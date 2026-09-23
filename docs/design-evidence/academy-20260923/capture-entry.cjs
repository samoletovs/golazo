const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const { chromium } = require(process.argv[2])
const root = path.resolve(__dirname, '..', '..', '..')
const source = process.argv[3]
const base = 'http://127.0.0.1:4323'
const output = path.join(__dirname, `source-${source.slice(0, 7)}`)
const today = new Date()
const gameDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}`
const club = { id: 'synthetic-club', name: 'Fictional Northbank Academy', country: 'LV', city: 'Fictional town', type: 'club', aliases: [], colors: ['#2447c5'], verified: false, addedBy: 'user', createdAt: '2026-09-01', updatedAt: '2026-09-01' }

async function main() {
  if (!/^[0-9a-f]{40}$/.test(source)) throw Error('Provide an exact source revision')
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  if ((await (await fetch(`${base}/source-revision.txt`)).text()).trim() !== source) throw Error('Source mismatch')
  fs.mkdirSync(output, { recursive: true })
  const observations = [], errors = []
  const roles = process.argv[4] ? [process.argv[4]] : ['player', 'coach', 'mentor']
  const languages = process.argv[5] ? [process.argv[5]] : ['en', 'lv']
  const widths = process.argv[6] ? [Number(process.argv[6])] : [390, 1440]
  if (roles.some(value => !['player', 'coach', 'mentor'].includes(value)) || languages.some(value => !['en', 'lv'].includes(value)) || widths.some(value => ![390, 1440].includes(value))) throw Error('Unsupported fixture selector')
  const browser = await chromium.launch()
  try {
    for (const role of roles) for (const language of languages) for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
      try {
        const labels = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', `${language}.json`), 'utf8'))
        await context.addInitScript(({ language, base }) => {
          if (location.origin !== base) return
          if (!localStorage.getItem('golazo-state')) localStorage.setItem('golazo-state', JSON.stringify({ profile: null, onboardingComplete: false }))
          localStorage.setItem('golazo-lang', language)
        }, { language, base })
        let imports = 0
        await context.route('**/*', async route => {
          const url = route.request().url(), method = route.request().method()
          if (!url.startsWith(base + '/')) {
            if (url.startsWith('https://fonts.googleapis.com/')) await route.fulfill({ contentType: 'text/css', body: '' })
            else await route.abort()
          } else if (url.includes('/.auth/')) await route.fulfill({ json: { clientPrincipal: null } })
          else if (url.includes('/api/tournament-import')) {
            const request = route.request().postDataJSON()
            imports++
            const data = imports === 1
              ? { tournament: 'Fictional Academy Cup', totalGames: 2, matchedGames: 0, games: [], allTeams: ['Fictional Northbank', 'Fictional Eastbank'] }
              : { tournament: 'Fictional Academy Cup', totalGames: 2, matchedGames: 2, className: 'U13', allTeams: ['Fictional Northbank', 'Fictional Eastbank'],
                games: ['10:00', '12:00'].map((time, index) => ({ date: gameDate, time, home: request.teamName, away: `Fictional Eastbank ${index + 1}`, venue: 'Fictional pitch', score: '', finished: false })) }
            await route.fulfill({ json: data })
          } else if (url.includes('/api/teams') && method === 'POST') await route.fulfill({ status: 409, json: { existingId: club.id } })
          else if (url.includes('/api/teams')) await route.fulfill({ json: { teams: [club] } })
          else if (url.includes('/api/shared-tournaments') && method === 'GET') await route.fulfill({ json: { tournaments: [] } })
          else if (url.includes('/api/')) await route.fulfill({ status: 503, json: { error: 'Synthetic unavailable remote service' } })
          else await route.continue()
        })
        const page = await context.newPage()
        page.on('pageerror', error => errors.push({ role, language, width, message: error.message }))
        const snap = async surface => {
          const measured = await page.evaluate(() => ({ width: innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, language: document.documentElement.lang }))
          if (measured.scrollWidth > measured.clientWidth) {
            console.error({ role, surface, ...measured, outside: await page.evaluate(() => [...document.querySelectorAll('body *')].filter(element => {
              if (element.closest('svg,.h-scroll,.academy-table-scroll')) return false
              const rect = element.getBoundingClientRect()
              return rect.width && rect.height && (rect.right > innerWidth + 1 || rect.left < -1)
            }).map(element => ({ tag: element.tagName, class: String(element.className), text: element.textContent?.trim().slice(0, 70), right: element.getBoundingClientRect().right })).slice(0, 12)) })
            await page.screenshot({ path: path.join(root, '.test-artifacts', 'entry-overflow.png'), fullPage: true })
            throw Error(`Overflow at ${surface}`)
          }
          const name = `entry-${role}-${language}-${surface}-${width}.png`
          await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled', scale: 'css' })
          const viewportName = process.argv.includes('--viewport') ? name.replace('.png', '-viewport.png') : undefined
          if (viewportName) await page.screenshot({ path: path.join(output, viewportName), fullPage: false, animations: 'disabled', scale: 'css' })
          observations.push({ role, language, width, surface, capture: name, viewport_capture: viewportName, ...measured })
        }
        await page.goto(base, { waitUntil: 'networkidle' })
        await page.locator('[data-academy-surface="visitor-login"]').waitFor()
        if (role === 'player') await snap('visitor-sign-in')
        await page.getByRole('button', { name: labels['login.skip'], exact: true }).click()
        await page.locator('[data-academy-surface="onboarding-player-role"]').waitFor()
        if (role === 'player') await snap('role-choice')
        const roleLabel = role === 'coach' ? labels['coach.role'] : labels[`onboarding.iAm${role === 'player' ? 'Player' : 'Mentor'}`]
        await page.getByRole('button', { name: roleLabel, exact: true }).click()
        await page.getByPlaceholder(labels['onboarding.namePlaceholder']).fill(`Fictional ${role} 07`)
        await page.locator('main input[type="date"]').fill(role === 'coach' ? '1988-04-01' : '2014-04-01')
        await snap('onboarding-basics')
        await page.locator('main .btn-primary').last().click()
        if (role !== 'coach') {
          await page.locator(`[data-academy-surface="onboarding-${role}-football"]`).waitFor()
          await page.locator('main button').filter({ hasText: /\bCM\s*$/ }).click()
          await snap('onboarding-football')
          await page.locator('main .btn-primary').last().click()
          await page.locator(`[data-academy-surface="onboarding-${role}-physical"]`).waitFor()
          await page.locator('main input[type="number"]').nth(0).fill('150')
          await page.locator('main input[type="number"]').nth(1).fill('42')
          await snap('onboarding-physical')
          await page.locator('main .btn-primary').last().click()
          await page.locator(`[data-academy-surface="onboarding-${role}-assessment"]`).waitFor()
          for (let index = 0; index < 5; index++) await page.locator('main .assess-btn').nth(index * 5 + 2).click()
          await snap('onboarding-assessment')
          await page.getByRole('button', { name: labels['onboarding.finish'], exact: true }).click()
        }
        await page.locator('.academy-shell').waitFor()
        await page.locator('main .academy-page').first().waitFor()
        const ready = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
        if (!ready.onboardingComplete || ready.profile.role !== role) throw Error('Onboarding did not complete with the selected role')
        await snap('onboarding-ready')
        if (role !== 'coach') await page.locator('.academy-primary-nav [data-page="profile"]').click()
        await page.getByRole('button', { name: labels['teams.manage'], exact: true }).click()
        let dialog = page.locator('[data-academy-dialog="team-picker-my-teams"]')
        await dialog.waitFor()
        await snap('team-list')
        await dialog.getByRole('button', { name: `+ ${labels['teams.addNewTitle']}`, exact: true }).click()
        dialog = page.locator('[data-academy-dialog="team-picker-select-club"]')
        await dialog.getByRole('button', { name: /Fictional Northbank Academy/ }).waitFor()
        await snap('club-choice')
        await dialog.getByRole('button', { name: /Fictional Northbank Academy/ }).click()
        dialog = page.locator('[data-academy-dialog="team-picker-add-teams"]')
        await dialog.waitFor()
        await snap('squad-choice')
        await dialog.getByRole('button', { name: '←', exact: true }).click()
        await page.locator('[data-academy-dialog="team-picker-my-teams"]').getByRole('button', { name: `+ ${labels['teams.addNewTitle']}`, exact: true }).click()
        dialog = page.locator('[data-academy-dialog="team-picker-select-club"]')
        await dialog.getByPlaceholder(labels['teams.search']).fill(club.name)
        await dialog.getByRole('button', { name: '+ New', exact: true }).click()
        const create = page.locator('[data-academy-dialog="components-add-team-dialog"]')
        await create.waitFor()
        await snap('create-team')
        await create.getByRole('button', { name: labels['teams.addBtn'], exact: true }).click()
        await create.getByRole('button', { name: labels['teams.useThis'], exact: true }).waitFor()
        await snap('duplicate-team-choice')
        await create.getByRole('button', { name: labels['teams.useThis'], exact: true }).click()
        await page.locator('[data-academy-dialog="team-picker-add-teams"]').waitFor()
        await page.keyboard.press('Escape')
        if (role === 'player') {
          if (width >= 1100) await page.locator('.academy-secondary-nav [data-page="schedule"]').click()
          else { await page.locator('.academy-menu-toggle').click(); await page.locator('.academy-dialog [data-page="schedule"]').click() }
        } else await page.locator('.academy-primary-nav [data-page="schedule"]').click()
        await page.locator('.academy-schedule-actions').getByRole('button', { name: new RegExp(labels['schedule.addTournament']) }).click()
        const importer = page.locator('[data-academy-dialog="components-tournament-import"]')
        await importer.locator('input[type="url"]').fill('https://example.invalid/synthetic-tournament')
        await importer.getByPlaceholder(labels['import.teamNameHint']).fill('Fictional academy')
        await snap('tournament-import')
        await importer.locator('button.btn-primary').last().click()
        await importer.getByRole('button', { name: 'Fictional Northbank', exact: true }).waitFor()
        await snap('tournament-team-choice')
        await importer.getByRole('button', { name: 'Fictional Northbank', exact: true }).click()
        await importer.locator('button.btn-primary').last().click()
        await importer.getByText('Fictional Academy Cup', { exact: true }).first().waitFor()
        await snap('tournament-preview')
        const before = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
        await importer.locator('button.btn-primary').last().click()
        await page.getByText(labels['academy.sharingUnconfirmed'], { exact: true }).first().waitFor()
        await snap('tournament-result')
        const after = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
        if (after.tournaments.length !== before.tournaments.length + 1 || after.schedule.length !== before.schedule.length + 2 || after.xp.totalXp !== before.xp.totalXp) throw Error('Import lost or duplicated fixtures, or changed XP')
      } finally { await context.close() }
    }
  } finally { await browser.close() }
  const reportName = process.argv[4] ? `entry-observations-${process.argv.slice(4).join('-')}.json` : 'entry-observations.json'
  fs.writeFileSync(path.join(output, reportName), JSON.stringify({ source_commit: source, kind: 'synthetic-entry-and-tournament-observations-not-review', observations, errors, limits: ['No real sign-in or tournament parser requests', 'Final onboarding readiness is the first live Home after completion', 'Native controls and local data only; external services simulated'] }, null, 2))
  console.log(JSON.stringify({ source, observations: observations.length, errors }))
  if (errors.length) process.exitCode = 1
}
main().catch(error => { console.error(error); process.exitCode = 1 })
