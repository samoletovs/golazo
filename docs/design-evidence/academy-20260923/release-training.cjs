const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { chromium } = require(process.argv[2])
const { fixture } = require('./capture-support.cjs')
const source = process.argv[3]
assert.match(source || '', /^[0-9a-f]{40}$/)
const root = path.resolve(__dirname, '../../..')
const output = path.join(__dirname, `source-${source.slice(0, 7)}`)
const base = 'http://127.0.0.1:4323'
const labels = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8'))
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const scope = JSON.parse(scopeBytes)
const ids = [
  'player-home', 'player-activity-overview', 'player-home-training-log', 'player-home-training-completion',
  'player-activity-inline-training', 'player-activity-inline-training-result', 'player-activity-inline-match',
  'player-activity-inline-match-result', 'player-log-hub', 'player-log-training-log',
  'player-log-training-completion', 'player-log-skip-dialog', 'player-match-team-search',
]
const report = {
  source_commit: source, scope_sha256: crypto.createHash('sha256').update(scopeBytes).digest('hex'),
  kind: 'bounded-synthetic-training-entry-evidence-not-review', observations: [], errors: [],
  limits: ['Synthetic local profiles and mocked APIs only.', 'Dashboard activity consolidation aliases retain each inventory ID; identical captures are not represented as independent designs.'],
}
function persist() {
  report.remaining = ids.filter(id => ![390, 1440].every(width => report.observations.some(item => item.id === id && item.width === width)))
  fs.writeFileSync(path.join(output, 'training-entry-observations.json'), JSON.stringify(report, null, 2))
}
async function guard() {
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  assert.equal((await (await fetch(`${base}/source-revision.txt`)).text()).trim(), source)
}
async function main() {
  await guard()
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
      try {
        const data = fixture('player', 'en')
        const today = new Date().toISOString().slice(0, 10)
        data.schedule.push({
          id: 'synthetic-review-match', familyId: data.profile.familyId, playerId: data.profile.id,
          type: 'match', date: today, title: 'Fictional review match', opponent: 'Fictional Eastbank Review',
          startTime: '11:00', endTime: '11:40', competition: 'Fictional match', createdBy: 'fixture', createdAt: today,
        })
        data.schedule.push({
          ...data.schedule[0], id: 'synthetic-unrecorded-for-skip',
          date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
          title: 'Fictional rest choice',
        })
        const club = { id: 'synthetic-search-team', name: 'Fictional Search Opposition', country: 'LV', type: 'club', aliases: [] }
        await context.addInitScript(({ data, base }) => {
          if (location.origin !== base) return
          if (!localStorage.getItem('golazo-state')) localStorage.setItem('golazo-state', JSON.stringify(data))
          localStorage.setItem('golazo-lang', 'en')
        }, { data, base })
        await context.route('**/*', route => {
          const url = route.request().url()
          if (url.includes('/.auth/')) return route.fulfill({ json: { clientPrincipal: null } })
          if (url.startsWith(base + '/api/teams')) return route.fulfill({ json: { teams: [club] } })
          if (url.startsWith(base + '/api/')) return route.fulfill({ status: 503, json: { error: 'Synthetic offline verification' } })
          if (url.startsWith(base + '/')) return route.continue()
          if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: '' })
          return route.abort()
        })
        const page = await context.newPage()
        page.on('pageerror', error => report.errors.push({ width, message: error.message }))
        const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
        const snap = async (surfaceIds, target, controls) => {
          const list = Array.isArray(surfaceIds) ? surfaceIds : [surfaceIds]
          for (const id of list) assert(scope.surfaces.some(item => item.id === id))
          await target.waitFor()
          await target.scrollIntoViewIfNeeded()
          const name = `training-entry-${list[0]}-${width}.png`
          const file = path.join(output, name)
          await page.screenshot({ path: file, animations: 'disabled', scale: 'css' })
          const bytes = fs.readFileSync(file)
          const measurement = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
          assert(measurement.scrollWidth <= measurement.clientWidth)
          for (const id of list) {
            report.observations.push({
              id, width, viewport: width < 480 ? 'mobile' : 'desktop',
              capture: `source-${source.slice(0, 7)}/${name}`,
              sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
              dimensions: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
              controls, measurement,
              context_evidence: id === list[0] ? controls.join('; ') : `The frozen scope explicitly consolidates ${id} into ${list[0]}. Same live Dashboard/TrainingLog implementation, with ${controls.join('; ')}. No screenshot nonce or fake unique layout.`,
            })
          }
          persist()
        }
        await page.goto(base, { waitUntil: 'networkidle' })
        await page.locator('[data-academy-surface="player-home"]').waitFor()
        await snap(['player-home', 'player-activity-overview'], page.locator('main h1'), ['Home shows current week, recorded activity and all retained activity sections'])
        const training = page.locator('.academy-agenda-row').filter({ hasText: 'Fictional team training' })
        await training.getByRole('button', { name: new RegExp(labels['academy.dayLog']) }).click()
        let dialog = page.locator('[data-academy-dialog="home-training-log"]')
        await dialog.locator('details.training-details summary').click()
        await dialog.locator('textarea[name="notes"]').fill('Fictional review: received into space.')
        await snap(['player-home-training-log', 'player-activity-inline-training'], dialog, ['Scheduled training opens populated real TrainingLog', 'Optional detail controls and notes retain input'])
        const beforeTraining = await state()
        await dialog.locator('button[type="submit"]').click()
        await dialog.locator('.academy-complete-label').waitFor()
        const afterTraining = await state()
        assert.equal(afterTraining.trainings.length, beforeTraining.trainings.length + 1)
        assert.equal(afterTraining.trainings.at(-1).fromSchedule, 'fixture-schedule')
        await snap(['player-home-training-completion', 'player-activity-inline-training-result'], dialog, ['Real local training save added one record', 'Schedule source retained; local-only success displayed'])
        await page.keyboard.press('Escape')
        if (afterTraining.xp.level > beforeTraining.xp.level) {
          await page.locator('[data-academy-dialog="level-up"]').getByRole('button', { name: labels['levelUp.continue'], exact: true }).click()
        }
        await page.locator('.academy-agenda-row').filter({ hasText: 'Fictional review match' }).getByRole('button', { name: new RegExp(labels['academy.dayLog']) }).click()
        dialog = page.locator('[data-academy-dialog="home-match-log"]')
        await snap('player-activity-inline-match', dialog, ['Home weekboard match opens real MatchLog with scheduled opponent/date'])
        const beforeMatch = await state()
        await dialog.getByRole('button', { name: labels['match.save'], exact: true }).click()
        await dialog.locator('.academy-complete-label').waitFor()
        const afterMatch = await state()
        assert.equal(afterMatch.matches.length, beforeMatch.matches.length + 1)
        await snap('player-activity-inline-match-result', dialog, ['Saving scheduled match creates exactly one record and displays local-only result'])
        await page.keyboard.press('Escape')
        if (afterMatch.xp.level > beforeMatch.xp.level) {
          await page.locator('[data-academy-dialog="level-up"]').getByRole('button', { name: labels['levelUp.continue'], exact: true }).click()
        }
        await page.locator('.academy-primary-nav [data-page="log"]').click()
        await page.locator('[data-academy-surface="player-log"]').waitFor()
        await snap('player-log-hub', page.locator('main h1'), ['Log workspace exposes manual choices and saved-entry journal'])
        await page.getByRole('button', { name: labels['log.training'], exact: true }).click()
        await page.locator('.academy-form').waitFor()
        await snap('player-log-training-log', page.locator('.academy-form'), ['Log > Training opens a fresh draft through real controls'])
        await page.locator('input[name="duration"]').fill('10')
        await page.locator('.academy-form button[type="submit"]').click()
        await page.locator('.academy-complete-label').waitFor()
        await snap('player-log-training-completion', page.locator('[data-academy-surface="training-completion"]'), ['Manual training saves a ten-minute record and displays actual reward/result'])
        await page.locator('.academy-primary-nav [data-page="dashboard"]').click()
        await page.locator('.academy-primary-nav [data-page="log"]').click()
        await page.getByRole('button', { name: labels['log.match'], exact: true }).click()
        const search = page.getByPlaceholder(labels['match.opponent'], { exact: true })
        await search.fill('Fictional')
        const suggestion = page.getByRole('button', { name: new RegExp(club.name) })
        await suggestion.waitFor()
        await snap('player-match-team-search', suggestion, ['Match opponent search receives a synthetic registry suggestion'])
        await suggestion.click()
        assert(await page.getByRole('button', { name: labels['academy.clearSelection'], exact: true }).isVisible())
        assert((await page.locator('main').innerText()).includes(club.name))
        await page.locator('.academy-primary-nav [data-page="dashboard"]').click()
        await page.locator('.academy-primary-nav [data-page="log"]').click()
        const skip = page.getByRole('button', { name: labels['log.skip'], exact: true }).first()
        if (await skip.count()) {
          await skip.click()
          const reason = page.getByText(labels['log.skipReason'], { exact: true })
          await snap('player-log-skip-dialog', reason.locator('..'), ['Open existing unrecorded-event skip controls; no XP or activity is granted'])
        } else {
          throw Error('Fixture must retain an unrecorded event for skip verification')
        }
      } catch (error) {
        report.errors.push({ width, message: error.message })
        process.exitCode = 1
      } finally { await context.close(); persist() }
    }
    await guard()
  } finally {
    await browser.close()
    persist()
  }
  console.log(JSON.stringify({ source, observations: report.observations.length, remaining: report.remaining, errors: report.errors }))
}
main().catch(error => { console.error(error); process.exitCode = 1 })
