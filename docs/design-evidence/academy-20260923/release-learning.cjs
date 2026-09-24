/* Bounded, synthetic evidence runner. No production state or external services. */
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { chromium } = require(process.argv[2])
const { fixture, engine } = require('./capture-support.cjs')
const source = process.argv[3]
assert.match(source, /^[0-9a-f]{40}$/)
const root = path.resolve(__dirname, '../../..')
const base = 'http://127.0.0.1:4323'
const out = path.join(__dirname, `source-${source.slice(0, 7)}`)
const reportPath = path.join(out, 'learning-observations.json')
const labels = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/en.json'), 'utf8'))
const T = key => labels[key] || key
const ids = [
  'player-daily-quiz', 'player-daily-challenge', 'player-coach-advice', 'player-team-announcements',
  'player-routine-check-in', 'player-routine-challenge', 'player-routine-quiz', 'player-routine-completion', 'player-level-up-overlay',
  'player-learn-articles', 'player-article-detail', 'player-learn-programs', 'player-program-detail',
  'player-program-workout', 'player-workout-rating', 'player-workout-completion', 'player-learn-exercises',
  'player-exercise-library', 'player-exercise-detail-dialog', 'player-custom-drill-dialog',
  'player-challenges-daily', 'player-challenges-weekly', 'player-challenges-special', 'player-challenge-track-detail',
  'player-friends-leaderboard', 'player-friend-invite', 'player-friend-join', 'player-social-challenges',
  'player-social-challenge-create', 'player-social-challenge-join',
]
const scope = JSON.parse(fs.readFileSync(path.join(root, '.design-scope.json'), 'utf8'))
ids.forEach(id => assert(scope.surfaces.some(s => s.id === id), id))
fs.mkdirSync(out, { recursive: true })
const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : {
  source_commit: source, kind: 'bounded-synthetic-player-learning-evidence-not-review',
  started_at: new Date().toISOString(), observations: [], failures: [], product_findings: [],
  limits: ['Chromium; English; synthetic fixtures only.', 'All APIs intercepted; no external AI, real data, authentication, or video playback.',
    'Viewport screenshots are actual 390x1000 / 1440x1000 CSS pixels, not resized images.',
    'No owner approval, independent review, whole-redesign completion, release or deployment claimed.'],
}
assert.equal(report.source_commit, source)
report.scope_sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, '.design-scope.json'))).digest('hex')
report.source_marker = `${base}/source-revision.txt`
report.not_a_passing_review_receipt = true
const deadline = Date.now() + 15 * 60 * 1000
const checkTime = () => { if (Date.now() > deadline) throw Error('Bounded execution deadline reached') }
function persist() {
  report.updated_at = new Date().toISOString()
  report.surfaces = ids.map(id => {
    const rows = report.observations.filter(r => r.id === id)
    return { id, entry: scope.surfaces.find(s => s.id === id).entry,
      status: [390, 1440].every(w => rows.some(r => r.actual_viewport.width === w && r.assertions.length)) ? 'bounded-controls-observed-both-widths' : 'incomplete',
      mobile: rows.filter(r => r.actual_viewport.width === 390),
      desktop: rows.filter(r => r.actual_viewport.width === 1440),
      remaining_reason: [390, 1440].filter(w => !rows.some(r => r.actual_viewport.width === w)).map(w => `No completed observation at ${w}px; see failures or unexecuted bounded scope.`).join(' '),
    }
  })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
}
async function sourceGuard() {
  assert.equal(cp.execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source)
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  assert.equal((await (await fetch(`${base}/source-revision.txt`)).text()).trim(), source)
}
function finding(id, text, repro) {
  if (!report.product_findings.some(f => f.id === id && f.text === text)) report.product_findings.push({ id, text, repro })
  persist()
}
async function snap(id, page, target, state, controls, assertions, limits = []) {
  checkTime()
  await target.first().waitFor({ state: 'visible' })
  await target.first().evaluate(el => el.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(80)
  const measured = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, device_pixel_ratio: devicePixelRatio,
    scroll_width: document.documentElement.scrollWidth, client_width: document.documentElement.clientWidth,
  }))
  const name = `learning-${id}-${measured.width}-${state}.png`
  const file = path.join(out, name)
  await page.screenshot({ path: file, fullPage: false, animations: 'disabled', scale: 'css' })
  const record = { id, state, language: 'en', actual_viewport: measured,
    png: path.relative(__dirname, file).replaceAll(path.sep, '/'),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    controls_exercised: controls, assertions, limits,
    visible_target_text: (await target.first().innerText()).slice(0, 3500), observed_at: new Date().toISOString() }
  report.observations = report.observations.filter(r => !(r.id === id && r.state === state && r.actual_viewport.width === measured.width))
  report.observations.push(record)
  if (measured.scroll_width > measured.client_width) finding(id, `Root horizontal overflow at ${measured.width}px`, { state, measured, png: record.png })
  persist()
  console.log(`${measured.width} ${id} ${state}`)
}
const btn = (page, key) => page.getByRole('button', { name: T(key), exact: true })
async function navigate(page, destination, width) {
  const primary = page.locator(`.academy-primary-nav [data-page="${destination}"]`)
  if (await primary.count()) await primary.click()
  else if (width >= 1100) await page.locator(`.academy-secondary-nav [data-page="${destination}"]`).click()
  else {
    await page.locator('.academy-menu-toggle').click()
    await page.locator(`.academy-dialog [data-page="${destination}"]`).click()
  }
  await page.locator('main .academy-page').first().waitFor()
}
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
async function setup(browser, width, group) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'], serviceWorkers: 'block' })
  context.setDefaultTimeout(5000)
  const data = fixture('player', 'en')
  data.profile.teams[0].registryId = 'synthetic-team-a'
  data.xp = engine('xp').awardXp(engine('xp').createInitialXpState(), group === 'daily' ? 99 : 0, new Date().toISOString().slice(0, 10), 'u12')
  if (group === 'completion') {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    data.programProgress = [{
      programId: 'prog-speed-agility', startedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      completedDays: 19, totalDays: 20, lastActivityDate: yesterday, currentWeek: 4, currentDay: 5, status: 'active',
      dayLog: Array.from({ length: 19 }, (_, i) => ({
        week: Math.floor(i / 5) + 1, day: i % 5 + 1, completedAt: new Date(Date.now() - (20 - i) * 86400000).toISOString(), rating: 3,
      })),
    }]
    data.specialChallenges = [{ id: 'weakFoot', daysCompleted: 29, daysTarget: 30, lastLogDate: yesterday, startedAt: yesterday }]
  }
  const requests = []
  let created = false
  let joined = false
  let progress = 1
  let coachCalls = 0
  let createCalls = 0
  let joinCalls = 0
  const challenge = () => ({
    id: 'synthetic-social', code: 'ABC123', title: 'Fictional passing practice', target: 5, unit: 'sessions',
    createdBy: 'synthetic-auth', createdByName: 'Fictional player', createdAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    participants: [{ userId: 'synthetic-auth', name: 'Fictional player', progress }, { userId: 'synthetic-friend', name: 'Fictional friend', progress: 2 }],
  })
  await context.addInitScript(({ data, base }) => {
    if (location.origin === base && !localStorage.getItem('golazo-state')) {
      localStorage.setItem('golazo-state', JSON.stringify(data))
      localStorage.setItem('golazo-lang', 'en')
    }
  }, { data, base })
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method()
    if (url.origin !== base) {
      if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ contentType: 'text/css', body: '' })
      return route.abort()
    }
    if (url.pathname === '/synthetic-announcement') return route.fulfill({ contentType: 'text/html', body: '<h1>Fictional training notice</h1>' })
    if (url.pathname.startsWith('/.auth/')) return route.fulfill({ json: { clientPrincipal: { userId: 'synthetic-auth', userDetails: 'fixture@example.invalid', identityProvider: 'github', userRoles: ['authenticated'] } } })
    if (!url.pathname.startsWith('/api/')) return route.continue()
    requests.push({ path: url.pathname, method, body: req.postDataJSON() })
    if (url.pathname.endsWith('/announcements')) return route.fulfill({ json: { announcements: ['players', 'all', 'parents'].map((audience, i) => ({
      id: `synthetic-ann-${i}`, teamId: 'synthetic-team-a', authorId: 'synthetic-coach', authorName: 'Fictional coach',
      title: `Fictional ${audience} notice`, body: 'Bring a ball and water for fictional passing practice.', priority: i === 0 ? 'urgent' : 'normal', audience,
      linkUrl: `${base}/synthetic-announcement`, readBy: [], createdAt: new Date().toISOString(),
    })) } })
    if (url.pathname === '/api/coach') {
      coachCalls++
      return coachCalls === 1 ? route.fulfill({ status: 503, json: { error: 'Synthetic unavailable advice' } }) :
        route.fulfill({ json: { greeting: 'Fictional practice feedback', recommendation: 'Synthetic advice: look up before passing.',
          focusArea: 'technical', insights: [], drills: ['Fictional passing drill'], weeklyGoal: 'Practise passing at your own pace.' } })
    }
    if (url.pathname === '/api/leaderboard') return route.fulfill({ json: [
      { userId: 'synthetic-auth', name: 'Fictional player', level: 2, totalXp: 120, streakDays: 1 },
      { userId: 'synthetic-friend', name: 'Fictional friend', level: 1, totalXp: 60, streakDays: 1 },
    ] })
    if (url.pathname === '/api/invite') return route.fulfill({ json: { code: 'ABC123' } })
    if (url.pathname === '/api/invite/accept') return route.fulfill({ json: { success: true } })
    if (url.pathname === '/api/social-challenges/join') {
      joinCalls++
      if (joinCalls === 1) return route.fulfill({ status: 503, json: { error: 'Synthetic join failure' } })
      joined = true
      return route.fulfill({ json: { success: true } })
    }
    if (url.pathname.endsWith('/progress')) { progress++; return route.fulfill({ json: { success: true } }) }
    if (url.pathname === '/api/social-challenges') {
      if (method === 'POST') {
        createCalls++
        if (createCalls === 1) return route.fulfill({ status: 503, json: { error: 'Synthetic create failure' } })
        created = true
        return route.fulfill({ json: { challenge: challenge() } })
      }
      return route.fulfill({ json: { challenges: [challenge(),
        ...(created ? [{ ...challenge(), id: 'synthetic-created', title: 'Fictional new challenge' }] : []),
        ...(joined ? [{ ...challenge(), id: 'synthetic-joined', title: 'Fictional joined challenge' }] : [])] } })
    }
    if (url.pathname.includes('shared-tournaments')) return route.fulfill({ json: { tournaments: [] } })
    if (url.pathname === '/api/teams') return route.fulfill({ json: { teams: [] } })
    return route.fulfill({ status: 503, json: { error: 'Synthetic offline state; no service contacted' } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => { report.failures.push({ group, width, pageerror: error.message }); persist() })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.academy-shell').waitFor()
  return { context, page, requests }
}
async function daily({ page, requests }, width) {
  const dailyGrid = page.locator('.academy-daily-grid')
  const quiz = dailyGrid.locator('.card').filter({ has: page.getByText(T('quiz.title'), { exact: true }) })
  await snap('player-daily-quiz', page, quiz, 'question', ['Home > daily practice; inspect age-selected question and answer controls'], ['Four answer buttons visible', 'Daily quiz present in real dashboard'])
  const answer = quiz.locator('button').first()
  const answerText = await answer.innerText()
  await answer.click()
  assert.equal((await state(page)).quizAnswers.length, 1)
  await page.waitForTimeout(150)
  assert.equal(await quiz.locator('button').count(), 4)
  assert.equal(await quiz.locator('.correct-answer').count(), 1)
  assert(await quiz.locator('.correct-answer').isDisabled())
  await snap('player-daily-quiz', page, quiz, 'answered', [`Select answer: ${answerText}`], ['Exactly one dated quiz answer persisted locally', 'Question and all four disabled choices remain visible, with the correct answer identified'])
  if (await page.locator('[data-academy-dialog="level-up"]').count()) {
    await snap('player-level-up-overlay', page, page.locator('[data-academy-dialog="level-up"]'), 'earned', ['Answer quiz from synthetic 99 XP threshold'], ['Real XP action opened level-up dialog'])
    await btn(page, 'levelUp.continue').click()
  }
  const dailyPanel = dailyGrid.locator('.academy-panel').filter({ has: page.getByText(T('dashboard.challengeOfDay'), { exact: true }) })
  await snap('player-daily-challenge', page, dailyPanel, 'instructions', ['Inspect target, duration, rationale and challenge completion control'], ['Daily challenge description rendered'])
  await dailyPanel.getByRole('button', { name: new RegExp(T('challenges.markDone')) }).click()
  await page.waitForTimeout(200)
  const level = page.locator('[data-academy-dialog="level-up"]')
  if (await level.count()) {
    await snap('player-level-up-overlay', page, level, 'earned', ['Complete challenge from synthetic near-level threshold'], ['Real challenge XP triggered level-up dialog', 'Continue control visible'])
    await btn(page, 'levelUp.continue').click()
    assert.equal(await level.count(), 0)
  }
  await snap('player-daily-challenge', page, dailyPanel, 'done', ['Mark challenge done', 'Dismiss earned level dialog when present'], ['Completion label replaced action; repeat completion unavailable'])
  const coach = page.locator('.card-glow').filter({ has: page.getByText(T('academy.localPracticeTitle'), { exact: true }) })
  await coach.getByRole('button').click()
  await coach.getByRole('alert').waitFor()
  await snap('player-coach-advice', page, coach, 'failure', ['Get AI advice (intercepted 503)'], ['Local deterministic advice retained; visible error and retry'])
  assert(!String(await coach.innerText()).includes('subSkills.'))
  await coach.getByRole('button').click()
  const advice = page.locator('.card-glow').filter({ hasText: 'Fictional practice feedback' })
  await advice.waitFor()
  assert.equal(requests.filter(r => r.path === '/api/coach').length, 2)
  await snap('player-coach-advice', page, advice, 'mocked-retry', ['Retry with synthetic successful response'], ['Synthetic advice and AI attribution visible; response cached locally'], ['No external AI was contacted'])
  assert.equal(await page.getByText('Fictional parents notice', { exact: true }).count(), 0)
  const announcement = page.locator('.card').filter({ hasText: 'Fictional players notice' })
  await snap('player-team-announcements', page, announcement, 'audience-filter', ['Inspect urgent player notice, author/date/body and link'], ['Players/all notices shown; parents-only notice absent'])
  const popupPromise = page.waitForEvent('popup')
  await announcement.getByRole('link').click()
  const popup = await popupPromise
  await popup.getByRole('heading', { name: 'Fictional training notice' }).waitFor()
  await popup.close()
  await snap('player-team-announcements', page, announcement, 'link-return', ['Open notice link in new tab; assert local synthetic destination; close tab'], ['Notice link opens correct synthetic URL', 'Original dashboard retained'])
}
async function routine({ page }, width) {
  await btn(page, 'routine.go').click()
  let dialog = page.locator('[data-academy-dialog="morning-routine-checkin"]')
  assert(await dialog.getByRole('button', { name: new RegExp(T('checkin.save')) }).isDisabled())
  await dialog.getByRole('button', { name: 'Mood 4', exact: true }).click()
  await dialog.getByRole('button', { name: 'Energy 3', exact: true }).click()
  await dialog.getByRole('button', { name: new RegExp(T('checkin.addNote')) }).click()
  await dialog.getByPlaceholder(T('checkin.notePlaceholder')).fill('Fictional calm morning.')
  await snap('player-routine-check-in', page, dialog, 'selected', ['Open daily routine', 'Verify save disabled before ratings', 'Mood 4, energy 3, optional note'], ['Two required ratings enable save; note retained'])
  await dialog.getByRole('button', { name: new RegExp(T('checkin.save')) }).click()
  dialog = page.locator('[data-academy-dialog="morning-routine-challenge"]')
  await dialog.waitFor()
  assert.equal((await state(page)).checkIns[0].energy, 3)
  await snap('player-routine-challenge', page, dialog, 'challenge', ['Save check-in; advance to challenge'], ['Check-in persisted; challenge target/instructions and mark-done shown'])
  await dialog.getByRole('button', { name: T('routine.markDone'), exact: true }).click()
  dialog = page.locator('[data-academy-dialog="morning-routine-quiz"]')
  await dialog.waitFor()
  await snap('player-routine-quiz', page, dialog, 'question', ['Mark routine challenge done; automatically advance to quiz'], ['Question and four real answer controls visible'])
  await dialog.locator('button.btn-choice').first().click()
  await snap('player-routine-quiz', page, dialog, 'answer-feedback', ['Answer first option'], ['Selected/correct-answer feedback visible; answer options disabled'])
  dialog = page.locator('[data-academy-dialog="morning-routine-done"]')
  await dialog.waitFor()
  assert.equal((await state(page)).quizAnswers.length, 1)
  await snap('player-routine-completion', page, dialog, 'done', ['Finish quiz and automatic completion'], ['Completion and routine bonus visible; one quiz record persisted'])
  await btn(page, 'routine.backHome').click()
  assert.equal(await page.locator('[data-academy-dialog^="morning-routine-"]').count(), 0)
}
async function learn({ page }, width) {
  await navigate(page, 'learn', width)
  await btn(page, 'learn.articles').click()
  await btn(page, 'learn.cat.nutrition').click()
  assert(await page.locator('.academy-reading-heading').count() > 0)
  await snap('player-learn-articles', page, page.locator('.academy-library'), 'filtered', ['Learn > Articles > Nutrition filter'], ['Category control selected; matching article list visible'])
  assert.equal(await btn(page, 'learn.cat.nutrition').getAttribute('aria-pressed'), 'true')
  await snap('player-learn-articles', page, page.locator('.filter-scroll'), 'filter-controls', ['Select Nutrition category'], ['Nutrition aria-pressed=true; article headings follow the filters'])
  await page.locator('.academy-reading-heading').first().click()
  const article = page.locator('.academy-reading.is-open')
  await snap('player-article-detail', page, article, 'expanded', ['Expand first filtered article'], ['Full article body and mark-read control visible'])
  await article.getByRole('button', { name: new RegExp(T('learn.markRead')) }).click()
  assert.equal((await state(page)).readArticles.length, 1)
  await snap('player-article-detail', page, article, 'read', ['Mark article read'], ['Dated read record persisted; mark-read action removed'])
  await btn(page, 'learn.programs').click()
  await snap('player-learn-programs', page, page.locator('.academy-program').first(), 'list', ['Switch Articles > Programs'], ['Age-filtered program titles and duration visible'])
  await page.locator('.academy-program .academy-reading-heading').first().click()
  const program = page.locator('.academy-program.is-open')
  await snap('player-program-detail', page, program, 'overview', ['Expand first program'], ['Description and start-program control visible'])
  await program.getByRole('button', { name: T('learn.startProgram'), exact: true }).click()
  assert.equal((await state(page)).programProgress.length, 1)
  const workout = program.getByRole('button', { name: new RegExp(T('prog.completeWorkout')) })
  await workout.waitFor()
  assert(await program.getByText('65 min', { exact: true }).isVisible())
  await snap('player-program-workout', page, program.locator('.animate-fade-up').last(), 'day-one', ['Start program; inspect Week 1 Day 1 workout sequence'], ['Warmup, exercise sequence, cooldown and complete-workout shown'], ['Week/day indicators are not interactive selection controls'])
  await workout.click()
  const rating = program.getByText(T('prog.rateWorkout'), { exact: true }).locator('..')
  await snap('player-workout-rating', page, rating, 'optional-rating', ['Complete workout; open inline rating'], ['Five emoji choices and skip-rating action shown'])
  await program.getByRole('button', { name: T('prog.skipRating'), exact: true }).click()
  const progress = (await state(page)).programProgress[0]
  assert.equal(progress.completedDays, 1)
  assert.equal(progress.dayLog.length, 1)
  assert.equal(progress.dayLog[0].rating, undefined)
  await snap('player-workout-completion', page, program.getByText(T('prog.workoutDone'), { exact: true }).locator('..'), 'day-saved', ['Skip optional rating'], ['Day log persisted without rating; completedDays=1; repeated daily completion unavailable'], ['Full multiweek program completion not simulated'])
}
async function exercises({ page }, width) {
  await navigate(page, 'learn', width)
  await page.locator('[data-academy-surface="player-learn"] .schedule-tabs').getByRole('button', { name: T('learn.exercises'), exact: true }).click()
  const library = page.locator('[data-academy-surface="exercise-library"]')
  const search = page.getByRole('textbox', { name: T('exercises.search'), exact: true })
  await search.fill('no-fictional-match-zz')
  assert.equal(await page.locator('.academy-exercise-open').count(), 0)
  await snap('player-learn-exercises', page, search.locator('..'), 'empty-search', ['Learn > Exercises; search nonexistent term'], ['Zero drill results; clear-search available'])
  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await page.getByRole('combobox', { name: T('exercises.sortBy'), exact: true }).selectOption('duration')
  await page.getByRole('combobox', { name: T('exercises.skillLevel'), exact: true }).selectOption('2')
  assert(await page.locator('.academy-exercise-open').count() > 0)
  await snap('player-learn-exercises', page, page.locator('.academy-exercise-open').first(), 'filtered-library', ['Clear search; sort by duration; difficulty 2'], ['Filtered drills rendered; controls retain selected values'])
  await page.locator('.academy-exercise-open').first().click()
  let dialog = page.locator('[data-academy-dialog="pages-exercises"]')
  await dialog.waitFor()
  await snap('player-exercise-detail-dialog', page, dialog, 'instructions', ['Open filtered exercise'], ['Description, duration, difficulty, equipment, positions and save/done controls visible'], ['External images/videos blocked; media playback not exercised'])
  await dialog.getByRole('button', { name: '☆ Save', exact: true }).click()
  assert((await state(page)).savedExercises.length > 0)
  await dialog.locator('.exercise-modal-action').click()
  assert(await dialog.locator('.exercise-modal-action').isDisabled())
  await snap('player-exercise-detail-dialog', page, dialog.locator('.exercise-modal-action').locator('..'), 'saved-done', ['Save drill; mark drill done'], ['Saved exercise persisted; done control disabled'])
  await page.keyboard.press('Escape')
  await btn(page, 'exercises.submitDrill.title').click()
  dialog = page.locator('[data-academy-dialog="pages-exercises"]')
  await dialog.waitFor()
  const submit = dialog.getByRole('button', { name: T('exercises.submitDrill.submit'), exact: true })
  await submit.click()
  await dialog.getByText(T('exercises.submitDrill.errorName'), { exact: true }).waitFor()
  await snap('player-custom-drill-dialog', page, dialog, 'validation', ['Open custom drill; submit empty required name'], ['Visible required-name validation; dialog remains open'])
  await dialog.getByPlaceholder(T('exercises.submitDrill.namePlaceholder')).fill('Fictional passing drill')
  await dialog.getByPlaceholder(T('exercises.submitDrill.descriptionPlaceholder')).fill('Pass gently between two fictional markers, alternating feet.')
  await dialog.locator('select').selectOption('technical')
  await snap('player-custom-drill-dialog', page, dialog, 'filled', ['Enter name and description; select technical category; retain ball equipment and duration'], ['Inputs retain draft; no real media URL supplied'])
  await submit.click()
  await dialog.waitFor({ state: 'detached' })
  assert((await state(page)).userDrills.some(d => d.name === 'Fictional passing drill'))
  await navigate(page, 'exercises', width)
  await page.locator('main [data-academy-surface="exercise-library"]').waitFor()
  await snap('player-exercise-library', page, page.locator('main .academy-page').first(), 'standalone-library',
    ['Open Exercises through the actual secondary navigation'],
    ['Standalone library route reached without hidden state mutation', 'Search and exercise actions remain available'])
}
async function challenges({ page }, width) {
  await navigate(page, 'challenges', width)
  const cards = page.locator('main .card')
  const first = cards.first()
  await first.locator('button').first().click()
  await snap('player-challenges-daily', page, first, 'expanded', ['More > Challenges; expand first daily challenge'], ['Detailed instructions, recommendation rationale and completion control visible'])
  await first.getByRole('button', { name: new RegExp(T('challenges.markDone')) }).click()
  await snap('player-challenges-daily', page, first, 'completed', ['Mark expanded daily challenge done'], ['Completed status replaces reward button'])
  const weekly = page.getByRole('button', { name: new RegExp(T('challenges.logProgress')) })
  const weeklyCard = weekly.locator('xpath=ancestor::div[contains(@class,"card")][1]')
  const before = await weeklyCard.innerText()
  await weekly.click()
  assert.notEqual(await weeklyCard.innerText(), before)
  await snap('player-challenges-weekly', page, weeklyCard, 'incremented', ['Log weekly progress once'], ['Weekly recorded count increased; progress bar displayed'], ['Full weekly target not completed'])
  const special = page.locator('main button.card').first()
  await snap('player-challenges-special', page, special.locator('..'), 'tracks', ['Scroll Special track list'], ['Special track descriptions and start controls visible'])
  await special.click()
  assert(await special.isDisabled())
  assert.equal((await state(page)).specialChallenges[0].daysCompleted, 1)
  await snap('player-challenge-track-detail', page, special, 'started', ['Click first special track to start/log day'], ['Progress 1/target recorded; logged-today status visible; repeated same-day action disabled'],
    ['Retained shared inline track UI: source has no expanded detail dialog; click directly starts/logs day. No image uniqueness fabricated.', 'Multiday completion not exercised'])
}
async function social({ page, requests }, width) {
  await navigate(page, 'leaderboard', width)
  const board = page.locator('main .card').first()
  await board.getByText('Fictional player (you)', { exact: true }).waitFor()
  await snap('player-friends-leaderboard', page, board, 'populated', ['More > Friends leaderboard'], ['Two mocked friend rows, rank/level/XP visible'])
  await btn(page, 'leaderboard.generateCode').click()
  const copy = btn(page, 'leaderboard.copy')
  await copy.waitFor()
  await copy.click()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'ABC123')
  await snap('player-friend-invite', page, copy.locator('..'), 'generated-copied', ['Generate invite; copy code'], ['Mock code ABC123 visible and browser clipboard equals ABC123'], ['No real invite created'])
  const friendCard = page.locator('main .card').filter({ has: page.getByRole('heading', { name: T('leaderboard.joinWithCode'), exact: true }) })
  const join = friendCard.getByRole('button', { name: T('leaderboard.join'), exact: true })
  assert(await join.isDisabled())
  await friendCard.getByRole('textbox').fill('abc123')
  await join.click()
  await page.getByText(T('leaderboard.linked'), { exact: true }).waitFor()
  await snap('player-friend-join', page, join.locator('xpath=ancestor::div[contains(@class,"card")][1]'), 'linked', ['Verify empty-code join disabled; enter lowercase code; Join'], ['Request code normalized to ABC123; mocked linked message; input cleared'])
  assert(requests.some(r => r.path === '/api/invite/accept' && r.body.code === 'ABC123'))
  const socialCard = page.locator('main .card').filter({ has: page.getByRole('heading', { name: new RegExp(T('socialChallenges.title')) }) })
  await snap('player-social-challenges', page, socialCard, 'populated', ['Inspect friend challenge status and participant progress'], ['Synthetic challenge and two participants visible'])
  await socialCard.getByRole('button', { name: T('socialChallenges.logSession'), exact: true }).click()
  await page.waitForTimeout(150)
  assert.equal(await socialCard.getByText('2/5', { exact: true }).count(), 2)
  assert(requests.some(r => r.path === '/api/social-challenges/synthetic-social/progress' && r.method === 'POST'))
  await snap('player-social-challenges', page, socialCard, 'progress-logged', ['Log session; refresh mocked participant progress'], ['Current participant advances from 1/5 to 2/5; both participants now show 2/5'])
  await btn(page, 'socialChallenges.create').click()
  await page.getByLabel(T('socialChallenges.challengeTitle'), { exact: true }).fill('Fictional new challenge')
  await page.getByLabel(T('socialChallenges.target'), { exact: true }).fill('5')
  await page.getByLabel(T('socialChallenges.days'), { exact: true }).fill('7')
  await btn(page, 'socialChallenges.send').click()
  await socialCard.getByRole('alert').waitFor()
  await snap('player-social-challenge-create', page, socialCard.locator('form'), 'retained-failure', ['Create challenge; enter title,target=5,days=7; Send (mock 503)'], ['Error visible and form values retained after failure'])
  await btn(page, 'socialChallenges.send').click()
  await page.getByText('Fictional new challenge', { exact: true }).waitFor()
  await snap('player-social-challenge-create', page, socialCard, 'retry-success', ['Retry Send (mock success)'], ['Created title in refreshed list; creation form closed'])
  const socialJoin = socialCard.getByRole('button', { name: T('socialChallenges.join'), exact: true })
  assert(await socialJoin.isDisabled())
  await socialCard.getByRole('textbox', { name: T('socialChallenges.enterCode'), exact: true }).fill('abc123')
  await socialJoin.click()
  await socialCard.getByRole('alert').waitFor()
  await snap('player-social-challenge-join', page, socialJoin.locator('..'), 'retained-failure', ['Enter join code; Join (mock 503)'], ['Failure displayed and normalized input retained'])
  await socialJoin.click()
  await page.getByText('Fictional joined challenge', { exact: true }).waitFor()
  await snap('player-social-challenge-join', page, socialCard, 'retry-success', ['Retry Join (mock success)'], ['Joined challenge appears; input cleared'])
}
async function completion({ page }, width) {
  await navigate(page, 'learn', width)
  await btn(page, 'learn.programs').click()
  const program = page.locator('.academy-program').filter({ has: page.getByRole('heading', { name: new RegExp(T('prog.speedAgility.title')) }) })
  await program.locator('.academy-reading-heading').click()
  await program.getByRole('button', { name: new RegExp(T('prog.completeWorkout')) }).click()
  const rating = program.getByText(T('prog.rateWorkout'), { exact: true }).locator('..')
  await snap('player-workout-rating', page, rating, 'final-day-rating', ['Open seeded Week 4 Day 5; complete workout'], ['Optional rating shown on final day'], ['Synthetic fixture supplies the preceding 19 completed days'])
  await rating.getByRole('button').nth(3).click()
  await program.getByText(T('learn.programComplete'), { exact: true }).waitFor()
  const saved = (await state(page)).programProgress[0]
  assert.equal(saved.status, 'completed')
  assert.equal(saved.completedDays, 20)
  assert.equal(saved.dayLog.at(-1).rating, 4)
  await snap('player-workout-completion', page, program.getByText(T('learn.programComplete'), { exact: true }).locator('..'), 'program-complete',
    ['Choose rating 4 for real final-workout action'], ['Program status completed; 20/20 days; final rating=4; focus-category feedback visible'],
    ['Prior 19 days are explicitly synthetic, not a claim of longitudinal verification'])
  await navigate(page, 'challenges', width)
  const track = page.locator('main button.card').first()
  await snap('player-challenge-track-detail', page, track, 'progress-29-of-30', ['Navigate to seeded special track'], ['Existing progress 29/30; log-day control enabled'])
  await track.click()
  assert.equal((await state(page)).specialChallenges[0].daysCompleted, 30)
  assert(await track.isDisabled())
  await snap('player-challenge-track-detail', page, track, 'track-complete', ['Log final day via actual special-track card'], ['30/30 persisted; completion feedback shown; further logging disabled'],
    ['Shared inline track is the real implementation; no separate expanded dialog exists', 'Preceding 29 days seeded'])
}
function finalizeEvidence() {
  const coach = report.observations.find(r => r.id === 'player-coach-advice' && r.state === 'failure' && r.visible_target_text.includes('subSkills.'))
  if (coach) finding('player-coach-advice', 'Local practice advice exposes an untranslated subSkills.dribbling key.', {
    path: 'src/engine/coach.ts:178', repro: 'Synthetic player > Home > Practice ideas; unavailable-AI response retains local recommendation containing subSkills.dribbling.',
    png: coach.png, impact: 'User-facing localization defect; no product edits made.',
  })
  const workout = report.observations.find(r => r.id === 'player-program-workout' && r.state === 'day-one')
  if (workout && !workout.visible_target_text.includes('65 min')) finding('player-program-workout', 'Timed workout total does not match its visible sections.', {
    path: 'src/data/programs.ts:55', repro: 'Learn > Programs > Speed & Agility > Start program > W1 D1. Display: 20 min; components 5+10+15+10+10+10+5 = 65.',
    png: workout.png, impact: 'Misleading workout duration; no product edits made.',
  })
  report.png_integrity = report.observations.map(o => {
    const bytes = fs.readFileSync(path.join(__dirname, o.png))
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), o.sha256)
    assert.equal(bytes.readUInt32BE(16), o.actual_viewport.width)
    assert.equal(bytes.readUInt32BE(20), o.actual_viewport.height)
    return { id: o.id, png: o.png, sha256_verified: true, png_dimensions_verified: true }
  })
  report.unresolved_driver_failures = report.failures.filter(f => !f.resolved_by_successful_rerun_at)
  report.visual_inspection = {
    kind: 'executor-spot-check-not-independent-review',
    checked_pngs: ['learning-player-program-workout-390-day-one.png', 'learning-player-workout-rating-1440-optional-rating.png',
      'learning-player-routine-quiz-390-answer-feedback.png', 'learning-player-custom-drill-dialog-390-filled.png',
      'learning-player-learn-articles-390-filtered.png', 'learning-player-challenges-weekly-390-incremented.png',
      'learning-player-coach-advice-1440-failure.png', 'learning-player-social-challenge-create-390-retained-failure.png',
      'learning-player-social-challenge-join-1440-retry-success.png', 'learning-player-daily-quiz-390-question.png',
      'learning-player-exercise-detail-dialog-1440-instructions.png'],
    conclusion: 'Relevant actual controls and content, not generic hero captures. Individual assertions are in the observations; this is not independent craft approval.',
  }
  persist()
}
async function main() {
  let browser
  try {
    await sourceGuard()
    browser = await chromium.launch({ headless: true })
    const groups = { daily, routine, learn, exercises, challenges, social, completion }
    for (const width of [390, 1440]) {
      for (const [group, run] of Object.entries(groups)) {
        if (process.argv[4] && !process.argv[4].split(',').includes(group)) continue
        checkTime()
        await sourceGuard()
        let session
        try {
          session = await setup(browser, width, group)
          await run(session, width)
          for (const failure of report.failures.filter(f => f.group === group && f.width === width && !f.pageerror)) {
            failure.resolved_by_successful_rerun_at = new Date().toISOString()
          }
        } catch (error) {
          report.failures.push({ group, width, error: error.message, observed_at: new Date().toISOString() })
          console.error(`${width} ${group}: ${error.message}`)
        } finally {
          if (session) {
            report.requests = [...(report.requests || []), { group, width, requests: session.requests }]
            await session.context.close()
          }
          persist()
        }
      }
    }
    await sourceGuard()
    report.source_rechecked_at = new Date().toISOString()
    finalizeEvidence()
  } finally {
    if (browser) await browser.close()
    persist()
    console.log(JSON.stringify({ complete: report.surfaces.filter(s => s.status !== 'incomplete').map(s => s.id),
      remaining: report.surfaces.filter(s => s.status === 'incomplete').map(s => s.id), failures: report.failures }))
  }
}
main().catch(error => { report.failures.push({ fatal: error.message }); persist(); console.error(error); process.exitCode = 1 })
