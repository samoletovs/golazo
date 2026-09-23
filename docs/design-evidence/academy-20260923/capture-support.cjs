/* Local-only, synthetic review procedure. It is not part of the application bundle. */
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const { createRequire } = require('node:module')
const root = path.resolve(__dirname, '..', '..', '..')
const requireProject = createRequire(path.join(root, 'package.json'))
const ts = requireProject('typescript')
const driver = process.argv[2]
const source = process.argv[3]
const base = 'http://127.0.0.1:4323'
const output = path.join(__dirname, `source-${source.slice(0, 7)}`)
const { chromium } = require(driver)
const compiled = new Map()
function engine(name) {
  const file = path.join(root, 'src', 'engine', `${name}.ts`)
  if (compiled.has(file)) return compiled.get(file)
  const module = { exports: {} }
  compiled.set(file, module.exports)
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText
  new Function('module', 'exports', 'require', code)(module, module.exports, request => request.startsWith('.') ? engine(path.basename(request)) : requireProject(request))
  return module.exports
}
const xpEngine = engine('xp')
const skillsEngine = engine('skills')
const today = new Date().toISOString().slice(0, 10)
function day(offset) {
  const date = new Date(`${today}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - offset)
  return date.toISOString().slice(0, 10)
}
function fixture(role, language) {
  const player = 'synthetic-player'
  const profile = {
    id: role === 'player' ? player : `synthetic-${role}`, familyId: 'synthetic-family', role,
    name: `Fictional ${role} 07`, birthDate: role === 'player' ? '2014-04-01' : '1988-04-01',
    team: 'Fictional Northbank Academy', country: 'LV', city: 'Fictional town',
    positions: role === 'player' ? ['CM'] : [], dominantFoot: 'right', language,
    jerseyNumber: role === 'player' ? 7 : undefined, createdAt: day(30),
    teams: [{ id: 'synthetic-team-a', name: 'Ziemeļkrasta jaunatnes futbola akadēmijas komanda U13', aliases: [], active: true, isPrimary: true, colors: ['#2447c5'], createdAt: day(30) }],
    managedTeams: role === 'coach' ? ['a', 'b'].map((key, index) => ({ teamId: `synthetic-team-${key}`, teamName: `Fictional Academy U${13 + index}`, clubName: 'Fictional Northbank Academy', role: 'head', claimedAt: day(30), verified: false })) : [],
    menteeIds: role === 'mentor' ? [player, 'synthetic-player-2'] : [],
  }
  const trainings = [0, 2, 4, 7, 9, 12, 15, 18, 21, 25].map((offset, index) => ({
    id: `training-${index}`, playerId: player, date: day(offset), type: index % 2 ? 'individual' : 'team',
    durationMinutes: index % 2 ? 30 : 90, focusAreas: ['technical'], energy: 3, mood: 4,
    notes: `Fictional session ${index + 1}: looked up before passing.`, exerciseIds: [], createdAt: `${day(offset)}T18:00:00Z`,
  }))
  const matches = [3, 10, 17].map((offset, index) => ({
    id: `match-${index}`, playerId: player, date: day(offset), opponent: `Fictional Eastbank ${index + 1}`,
    playingFor: 'Fictional Northbank Academy', competition: 'Fictional development match',
    scoreUs: 2, scoreThem: 1, position: index === 0 ? 'CM' : ['CM'], minutesPlayed: 40,
    goals: 1, assists: 1, shots: 3, keyPasses: 2, tackles: 2, selfRating: 7, mood: 4,
    bestMoment: 'Found space for a teammate.', toImprove: 'Check over my shoulder before receiving.', createdAt: `${day(offset)}T15:00:00Z`,
  }))
  const diary = [0, 3].map((offset, index) => ({
    id: `diary-${index}`, playerId: player, date: day(offset), text: 'PRIVATE_SYNTHETIC_REFLECTION: I felt encouraged by a teammate.',
    mood: 4, promptsUsed: [], linkedTrainingIds: [], linkedMatchIds: [], moodContext: 'training', aiConsent: false, createdAt: `${day(offset)}T20:00:00Z`,
  }))
  let xp = xpEngine.createInitialXpState()
  const events = [...trainings.map(entry => ({ date: entry.date, amount: xpEngine.XP_AWARDS.logTraining })), ...matches.map(entry => ({ date: entry.date, amount: xpEngine.XP_AWARDS.logMatch })), ...diary.map(entry => ({ date: entry.date, amount: xpEngine.XP_AWARDS.diaryEntry }))].sort((a, b) => a.date.localeCompare(b.date))
  for (const event of events) xp = xpEngine.awardXp(xp, event.amount, event.date, 'u12')
  return { profile, trainings, matches, diary, xp, skillTree: skillsEngine.createInitialSkillTree(player), onboardingComplete: true,
    schedule: [{ id: 'fixture-schedule', familyId: 'synthetic-family', playerId: player, type: 'training', title: 'Fictional team training', date: today, startTime: '17:00', endTime: '18:00', trainingType: 'team', createdBy: 'fixture', createdAt: today }] }
}
function layout(page) {
  return page.evaluate(() => {
    const root = document.documentElement
    return { width: innerWidth, clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, language: root.lang }
  })
}
async function main() {
  if (!/^[0-9a-f]{40}$/.test(source)) throw Error('Provide the exact source revision')
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  if ((await (await fetch(`${base}/source-revision.txt`)).text()).trim() !== source) throw Error('Compiled source mismatch')
  fs.mkdirSync(output, { recursive: true })
  const observations = []
  const roles = process.argv[4] ? [process.argv[4]] : ['player', 'coach', 'mentor']
  if (roles.some(role => !['player', 'coach', 'mentor'].includes(role))) throw Error('Unknown fixture role')
  const errors = []
  const browser = await chromium.launch()
  const capture = async (page, label, role, language, width) => {
    const measured = await layout(page)
    if (measured.scrollWidth > measured.clientWidth) throw Error(`Page overflow: ${label} ${JSON.stringify(measured)}`)
    if (measured.language !== language) throw Error(`Language mismatch: ${label}`)
    const name = `support-${role}-${language}-${label}-${width}.png`
    await page.screenshot({ path: path.join(output, name), fullPage: true, animations: 'disabled', scale: 'css' })
    observations.push({ role, language, width, surface: label, capture: name, ...measured })
  }
  try {
    for (const role of roles) for (const language of ['en', 'lv']) for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
      try {
        const data = fixture(role, language)
        const labels = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', `${language}.json`), 'utf8'))
        await context.addInitScript(({ data, base }) => {
          if (location.origin !== base) return
          const original = Storage.prototype.setItem
          if (!localStorage.getItem('golazo-state')) original.call(localStorage, 'golazo-state', JSON.stringify(data))
          if (!localStorage.getItem('golazo-lang')) original.call(localStorage, 'golazo-lang', data.profile.language)
          window.__academyFail = false
          Storage.prototype.setItem = function (key, value) {
            if (key === 'golazo-state' && window.__academyFail) throw new DOMException('Synthetic local failure', 'QuotaExceededError')
            return original.call(this, key, value)
          }
        }, { data, base })
        await context.route('**/*', async route => {
          const url = route.request().url()
          if (!url.startsWith(base + '/')) {
            if (url.startsWith('https://fonts.googleapis.com/')) await route.fulfill({ contentType: 'text/css', body: '' })
            else if (url.includes('youtube.com') || url.includes('youtube-nocookie.com')) await route.fulfill({ contentType: 'text/html', body: '<p>Synthetic local test: external video is not played.</p>' })
            else await route.abort()
          } else if (url.includes('/.auth/')) await route.fulfill({ json: { clientPrincipal: { userId: 'synthetic-auth', userDetails: 'fixture@example.invalid', identityProvider: 'github', userRoles: ['authenticated'] } } })
          else if (url.includes('/api/') && route.request().method() !== 'GET') await route.fulfill({ status: 503, json: { error: 'Synthetic unconfirmed remote write' } })
          else if (url.endsWith('/roster')) await route.fulfill({ json: { players: [{ playerId: 'synthetic-player', playerName: 'Fictional Player 07', positions: ['CM'], jerseyNumber: 7, birthDate: '2014-04-01', joinedAt: day(30), active: true }] } })
          else if (url.includes('/api/mentor/mentees')) await route.fulfill({ json: { mentees: [{ id: 'synthetic-player', name: 'Fictional Player 07' }, { id: 'synthetic-player-2', name: 'Fictional Player 08' }] } })
          else if (url.includes('/api/shared-tournaments')) await route.fulfill({ json: { tournaments: [] } })
          else if (url.includes('/api/teams')) await route.fulfill({ json: { teams: [] } })
          else if (url.endsWith('/announcements')) await route.fulfill({ json: { announcements: [] } })
          else if (url.includes('social-challenges')) await route.fulfill({ json: { challenges: [] } })
          else if (url.includes('/api/')) await route.fulfill({ status: 503, json: { error: 'Synthetic offline state' } })
          else await route.continue()
        })
        const page = await context.newPage()
        page.on('pageerror', error => errors.push({ role, language, width, message: error.message }))
        await page.goto(base, { waitUntil: 'networkidle' })
        await page.locator('.academy-shell').waitFor()
        const navigate = async destination => {
          const primary = page.locator(`.academy-primary-nav [data-page="${destination}"]`)
          if (await primary.count()) await primary.click()
          else if (width >= 1100) await page.locator(`.academy-secondary-nav [data-page="${destination}"]`).click()
          else { await page.locator('.academy-menu-toggle').click(); await page.locator(`.academy-dialog [data-page="${destination}"]`).click() }
          await page.locator('main .academy-page').first().waitFor()
        }
        const snap = label => capture(page, label, role, language, width)
        await snap('home-populated')
        if (role === 'player') {
          await navigate('log')
          await snap('journal-populated')
          for (const [kind, match] of [['training', labels['training.type.team']], ['match', 'Fictional Eastbank'], ['diary', labels['diary.title']]]) {
            await page.locator('.academy-record-row').filter({ hasText: match }).first().click()
            await page.locator(`[data-academy-dialog="${kind}-record-detail"]`).waitFor()
            await snap(`${kind}-record-detail`)
            await page.keyboard.press('Escape')
          }
          await navigate('profile')
          await page.getByRole('button', { name: labels['academy.editIdentity'], exact: true }).click()
          await page.getByLabel(labels['onboarding.name'], { exact: true }).fill('Fictional Player With A Long Academy Name')
          await snap('identity-editor')
          await page.evaluate(() => { window.__academyFail = true })
          await page.getByRole('button', { name: labels['common.save'], exact: true }).click()
          await page.locator('.academy-dialog .academy-error').waitFor()
          await snap('identity-retained-failure')
          await page.evaluate(() => { window.__academyFail = false })
          await page.getByRole('button', { name: labels['common.save'], exact: true }).click()
          await page.locator('[data-academy-dialog="player-identity-editor"]').waitFor({ state: 'detached' })
          const savedName = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')).profile.name)
          if (savedName !== 'Fictional Player With A Long Academy Name') throw Error('Identity retry did not persist')
          await page.locator('.academy-achievement-details summary').click()
          await snap('achievement-collection')
          await page.locator('.academy-goal-composer summary').click()
          await snap('goal-editor')
          await navigate('learn')
          await page.getByRole('button', { name: labels['learn.exercises'], exact: true }).click()
          await page.locator('.academy-exercise-open').first().waitFor()
          await snap('exercise-library')
          await page.locator('.academy-exercise-open').first().click()
          await page.locator('[data-academy-dialog]').waitFor()
          await snap('exercise-detail')
          await page.keyboard.press('Escape')
          await page.getByRole('button', { name: labels['exercises.submitDrill.title'], exact: true }).click()
          await snap('custom-drill')
          await page.keyboard.press('Escape')
          await navigate('schedule')
          await page.locator('.academy-schedule-actions').getByRole('button', { name: new RegExp(labels['schedule.addTraining']) }).click()
          await snap('calendar-training-form')
          await page.keyboard.press('Escape')
          await page.getByRole('button', { name: new RegExp(labels['schedule.addRecurring']) }).click()
          await snap('recurring-setup')
          await page.keyboard.press('Escape')
        } else if (role === 'coach') {
          for (const [index, label] of ['roster', 'training', 'announcements', 'evaluation', 'attendance', 'team-challenges'].entries()) {
            await navigate('dashboard')
            await page.locator('.academy-coach-actions').first().locator('button').nth(index).click()
            await page.locator('main .academy-page').first().waitFor()
            if (label === 'roster' || label === 'attendance') {
              try { await page.getByText('Fictional Player 07', { exact: true }).first().waitFor() }
              catch (error) {
                console.error({ role, language, width, label, visible: (await page.locator('main').innerText()).slice(0, 1600) })
                await page.screenshot({ path: path.join(root, '.test-artifacts', 'support-wait-failure.png'), fullPage: true })
                throw error
              }
            }
            await snap(label)
            if (label === 'roster') {
              await page.getByRole('button', { name: /Fictional Player 07/ }).click()
              await snap('roster-player-detail')
            }
            if (label === 'training') {
              await page.getByPlaceholder(labels['coach.training.title']).fill('Fictional receiving session')
              await page.getByRole('button', { name: new RegExp(labels['coach.training.addDrill']) }).click()
              await snap('training-drill-editor')
              await page.getByRole('button', { name: labels['common.save'], exact: true }).click()
              await page.getByRole('alert').first().waitFor()
              await snap('training-retained-remote-failure')
            }
          }
        } else {
          await page.getByRole('button', { name: /Fictional Player 07/ }).waitFor()
          await snap('linked-player-selector')
          await page.getByRole('button', { name: /Fictional Player 08/ }).click()
          await snap('linked-player-sparse')
          if ((await page.locator('body').innerText()).includes('PRIVATE_SYNTHETIC_REFLECTION')) throw Error('Private diary exposed to mentor')
        }
        await navigate('settings')
        await snap('settings')
        await page.getByRole('button', { name: labels['profile.reset'], exact: true }).click()
        await snap('reset-confirmation')
        await page.keyboard.press('Escape')
      } finally { await context.close() }
    }
  } finally { await browser.close() }
  const report = { source_commit: source, kind: 'synthetic-supporting-surface-observations-not-review', observations, errors,
    limits: ['Chromium only', 'No real child data, authentication or service calls', 'Remote writes deliberately fail', 'External video playback and web fonts not verified', 'Independent craft review and integrated owner acceptance not claimed'] }
  fs.writeFileSync(path.join(output, process.argv[4] ? `support-observations-${process.argv[4]}.json` : 'support-observations.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ source, observations: observations.length, errors }))
  if (errors.length) process.exitCode = 1
}
module.exports = { fixture, layout, engine }
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
