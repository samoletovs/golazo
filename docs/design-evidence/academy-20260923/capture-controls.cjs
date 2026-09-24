const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const { chromium } = require(process.argv[2])
const { fixture, engine } = require('./capture-support.cjs')
const root = path.resolve(__dirname, '..', '..', '..')
const source = process.argv[3]
const base = 'http://127.0.0.1:4323'
const output = path.join(__dirname, `source-${source.slice(0, 7)}`)

async function main() {
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  if ((await (await fetch(`${base}/source-revision.txt`)).text()).trim() !== source) throw Error('Source mismatch')
  const observations = [], errors = []
  const browser = await chromium.launch()
  try {
    for (const initialLanguage of ['en', 'lv']) for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
      try {
        const data = fixture('player', initialLanguage)
        let language = initialLanguage
        let labels = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', `${language}.json`), 'utf8'))
        await context.addInitScript(({ base, data }) => {
          if (location.origin !== base) return
          const original = Storage.prototype.setItem
          if (!localStorage.getItem('golazo-state')) original.call(localStorage, 'golazo-state', JSON.stringify(data))
          if (!localStorage.getItem('golazo-lang')) original.call(localStorage, 'golazo-lang', data.profile.language)
          window.__academyFail = false
          Storage.prototype.setItem = function (key, value) {
            if (key === 'golazo-state' && window.__academyFail) throw new DOMException('Synthetic storage failure', 'QuotaExceededError')
            return original.call(this, key, value)
          }
        }, { base, data })
        await context.route('**/*', async route => {
          const url = route.request().url()
          if (url.startsWith(`blob:${base}`)) await route.continue()
          else if (!url.startsWith(base + '/')) {
            if (url.startsWith('https://fonts.googleapis.com/')) await route.fulfill({ contentType: 'text/css', body: '' })
            else await route.abort()
          } else if (url.includes('/.auth/')) await route.fulfill({ json: { clientPrincipal: null } })
          else if (url.includes('/api/teams')) await route.fulfill({ json: { teams: [] } })
          else if (url.includes('/api/')) await route.fulfill({ status: 503, json: { error: 'Synthetic offline state' } })
          else await route.continue()
        })
        const page = await context.newPage()
        page.on('pageerror', error => errors.push({ initialLanguage, width, message: error.message }))
        const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
        const navigate = async destination => {
          const primary = page.locator(`.academy-primary-nav [data-page="${destination}"]`)
          if (await primary.count()) await primary.click()
          else if (width >= 1100) await page.locator(`.academy-secondary-nav [data-page="${destination}"]`).click()
          else { await page.locator('.academy-menu-toggle').click(); await page.locator(`.academy-dialog [data-page="${destination}"]`).click() }
          await page.locator('main .academy-page').first().waitFor()
        }
        const snap = async surface => {
          const measured = await page.evaluate(() => ({ width: innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, language: document.documentElement.lang }))
          if (measured.scrollWidth > measured.clientWidth) throw Error(`Overflow: ${surface}`)
          const name = `controls-${initialLanguage}-${surface}-${width}.png`
          await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled', scale: 'css' })
          observations.push({ initialLanguage, width, surface, capture: name, ...measured })
        }
        await page.goto(base, { waitUntil: 'networkidle' })
        await page.locator('.academy-shell').waitFor()
        await navigate('profile')
        const upload = page.getByRole('button', { name: labels['profile.uploadPhoto'], exact: true })
        for (let index = 0; index < 100 && !await upload.evaluate(element => element === document.activeElement); index++) await page.keyboard.press('Tab')
        if (!await upload.evaluate(element => element === document.activeElement)) throw Error('Visible photo control was not keyboard reachable')
        const image = await page.evaluate(() => {
          const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
          const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2447c5'; ctx.fillRect(0, 0, 64, 64)
          ctx.fillStyle = '#ff9b7b'; ctx.beginPath(); ctx.arc(32, 32, 17, 0, Math.PI * 2); ctx.fill()
          return canvas.toDataURL('image/png').split(',')[1]
        })
        if (!await upload.evaluate(element => element === document.activeElement)) throw Error(`Photo focus moved before activation: ${initialLanguage} ${width}`)
        const chooser = page.waitForEvent('filechooser')
        await upload.press('Enter')
        await (await chooser).setFiles({ name: 'synthetic-academy-mark.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') })
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('golazo-state')).profile.photoUrl?.startsWith('data:image/jpeg'))
        await snap('photo-upload')
        await page.getByRole('button', { name: labels['profile.removePhoto'], exact: true }).click()
        if ((await state()).profile.photoUrl) throw Error('Photo removal did not persist')
        await snap('photo-removal')
        const download = page.waitForEvent('download')
        await page.getByRole('button', { name: labels['profile.export'], exact: true }).click()
        const exported = path.join(output, `credential-export-${initialLanguage}-${width}.png`)
        await (await download).saveAs(exported)
        const bytes = fs.readFileSync(exported)
        if (bytes.readUInt32BE(16) !== 660 || bytes.readUInt32BE(20) !== 880) throw Error('Credential PNG dimensions changed')
        observations.push({ initialLanguage, width, surface: 'credential-export-artifact', artifact: path.basename(exported), imageWidth: 660, imageHeight: 880, bytes: bytes.length })
        await snap('credential-export-control')
        await navigate('settings')
        const target = initialLanguage === 'en' ? 'lv' : 'en'
        await page.getByRole('button', { name: target === 'lv' ? 'Latviešu' : 'English', exact: true }).click()
        await page.waitForFunction(value => document.documentElement.lang === value, target)
        await page.reload({ waitUntil: 'networkidle' })
        if (await page.evaluate(() => document.documentElement.lang) !== target) throw Error('Language did not survive reload')
        language = target
        labels = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', `${language}.json`), 'utf8'))
        await navigate('settings')
        await snap('language-persisted')
        await page.getByRole('button', { name: labels['theme.pitch'], exact: true }).click()
        if (await page.evaluate(() => localStorage.getItem('golazo-surface-theme')) !== 'pitch') throw Error('Explicit alternate theme did not persist')
        await snap('explicit-alternate-theme')
        await page.getByRole('button', { name: labels['theme.clubhouse'], exact: true }).click()
        const beforeRole = await state()
        await page.getByRole('button', { name: labels['login.asMentor'], exact: true }).click()
        await page.locator('[data-academy-shell="mentor"]').waitFor()
        await snap('role-mentor')
        if ((await page.locator('body').innerText()).includes('PRIVATE_SYNTHETIC_REFLECTION')) throw Error('Diary leaked after role switch')
        if ((await state()).diary.length !== beforeRole.diary.length) throw Error('Role switch deleted private records')
        await navigate('settings')
        await page.getByRole('button', { name: labels['login.asPlayer'], exact: true }).click()
        await page.locator('[data-academy-shell="player"]').waitFor()
        const xpEngine = engine('xp')
        for (const kind of ['match', 'diary']) {
          await navigate('log')
          await page.getByRole('button', { name: labels[`log.${kind}`], exact: true }).click()
          const editor = kind === 'match' ? page.locator('main input[type="text"]').first() : page.locator('main textarea').first()
          const text = kind === 'match' ? 'Fictional final opponent' : 'Fictional retained reflection.'
          await editor.fill(text)
          const before = await state()
          await page.evaluate(() => { window.__academyFail = true })
          await page.getByRole('button', { name: labels[`${kind}.save`], exact: true }).click()
          await page.locator('main .academy-error').waitFor()
          if (await editor.inputValue() !== text) throw Error(`${kind} draft lost on failure`)
          await snap(`${kind}-retained-failure`)
          await page.evaluate(() => { window.__academyFail = false })
          await page.getByRole('button', { name: labels['training.retry'], exact: true }).press('Enter')
          await page.keyboard.press('Enter')
          await page.locator('[data-academy-surface="activity-saved"]').waitFor()
          const after = await state(), key = kind === 'match' ? 'matches' : 'diary'
          const award = kind === 'match' ? xpEngine.XP_AWARDS.logMatch : xpEngine.XP_AWARDS.diaryEntry
          if (after[key].length !== before[key].length + 1 || after.xp.totalXp !== before.xp.totalXp + xpEngine.scaleXp(award, 'u12')) throw Error(`${kind} retry duplicated or lost data/rewards`)
          await snap(`${kind}-completion`)
          await page.getByRole('button', { name: labels['training.finish'], exact: true }).click()
        }
      } finally { await context.close() }
    }
  } finally { await browser.close() }
  fs.writeFileSync(path.join(output, 'control-observations.json'), JSON.stringify({ source_commit: source, kind: 'synthetic-control-observations-not-review', observations, errors, limits: ['Generated image input, no real photographs', 'Native file chooser and actual PNG download exercised', 'Local writes and mocked APIs only', 'No independent craft or owner acceptance'] }, null, 2))
  console.log(JSON.stringify({ source, observations: observations.length, errors }))
  if (errors.length) process.exitCode = 1
}
main().catch(error => { console.error(error); process.exitCode = 1 })
