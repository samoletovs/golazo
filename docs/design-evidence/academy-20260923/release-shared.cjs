/* Evidence only. Run against the already compiled, source-marked local application. */
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const crypto = require('node:crypto')
if (process.argv.includes('--help')) {
  console.log('Usage: node release-shared.cjs <playwright-driver> <40-character-source-SHA> [--budget-seconds N] [--base-url http://127.0.0.1:4323] [--list-ids]\nWrites only source-<SHA-prefix>/shared-* captures and observations. --list-ids prints the exact 35-ID/actual-entry map without starting a browser or writing files. Budget is caller-controlled; omit for no batch deadline.')
  process.exit(0)
}
const driver = process.argv[2]
const source = process.argv[3]
if (!driver || !/^[0-9a-f]{40}$/.test(source || '')) throw Error('Provide a Playwright driver and exact source SHA; see --help')
let budgetSeconds = null
let base = 'http://127.0.0.1:4323'
let listIds = false
for (let index = 4; index < process.argv.length; index++) {
  const option = process.argv[index]
  if (option === '--list-ids') listIds = true
  else if (option === '--base-url') base = process.argv[++index]
  else if (option === '--budget-seconds') {
    budgetSeconds = Number(process.argv[++index])
    if (!Number.isFinite(budgetSeconds) || budgetSeconds <= 0) throw Error('Budget must be a positive number of seconds')
  } else throw Error(`Unknown argument: ${option}`)
}
const origin = new URL(base)
if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname) || origin.username || origin.password || origin.pathname !== '/') throw Error('Use a loopback HTTP origin as --base-url')
base = origin.origin
process.argv[2] = driver
process.argv[3] = source
const { chromium } = require(driver)
const { fixture } = require('./capture-support.cjs')
const root = path.resolve(__dirname, '..', '..', '..')
const outputName = `source-${source.slice(0, 7)}`
const output = path.join(__dirname, outputName)
const labels = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'en.json'), 'utf8'))
const hash = data => crypto.createHash('sha256').update(data).digest('hex')
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const scope = JSON.parse(scopeBytes)
const roles = ['player', 'coach', 'mentor']
const ids = ['visitor-bootstrap', 'visitor-error-boundary',
  ...roles.flatMap(role => ['shell', 'bootstrap', 'error-boundary', 'feedback-dialog', 'account-settings'].map(suffix => `${role}-${suffix}`)),
  ...['player', 'mentor'].flatMap(role => ['team-list', 'club-choice', 'squad-choice', 'create-team'].map(suffix => `${role}-onboarding-${suffix}`)),
  ...['team-list', 'club-choice', 'squad-choice', 'create-team'].map(suffix => `coach-profile-${suffix}-dialog`),
  ...['coach', 'mentor'].flatMap(role => ['language-settings', 'theme-settings', 'role-settings'].map(suffix => `${role}-${suffix}`)),
]
const dialogMap = { 'team-list': 'team-picker-my-teams', 'club-choice': 'team-picker-select-club', 'squad-choice': 'team-picker-add-teams', 'create-team': 'components-add-team-dialog' }
function onboardingEntryConflict(item) {
  if (!item.id.includes('-onboarding-')) return null
  const entry = typeof item.entry === 'string' ? item.entry : ''
  if (/\bbasics\b/i.test(entry)) return null
  const declaredStep = /\bfootball\b/i.test(entry) ? 'football' : null
  return {
    declared_entry: item.entry ?? null, declared_step: declaredStep, actual_step: 'basics',
    reason: declaredStep === 'football'
      ? 'Source-bound entry specifies Football; the exercised visible team opener is in onboarding Basics.'
      : 'Source-bound entry does not identify onboarding Basics; the exercised team-opener entry cannot be certified as matching.',
  }
}
const targets = ids.map(id => {
  const item = scope.surfaces.find(surface => surface.id === id)
  if (!item) throw Error(`Assigned ID is absent from source-bound scope: ${id}`)
  const role = id.split('-')[0]
  let actualEntry, selector, component
  if (id.includes('-onboarding-')) {
    const suffix = id.slice(`${role}-onboarding-`.length)
    actualEntry = `${role} onboarding Basics > visible team opener > ${suffix}; externalTeams mode`
    selector = `[data-academy-dialog="${dialogMap[suffix]}"]`
    component = suffix === 'create-team' ? 'AddTeamDialog via TeamPicker' : 'TeamPicker'
  } else if (id.startsWith('coach-profile-')) {
    const suffix = id.slice('coach-profile-'.length, -'-dialog'.length)
    actualEntry = `Coach shell > Profile > Manage > ${suffix}; managedTeams mode`
    selector = `[data-academy-dialog="${dialogMap[suffix]}"]`
    component = suffix === 'create-team' ? 'AddTeamDialog via TeamPicker' : 'TeamPicker'
  } else if (id.endsWith('-bootstrap')) {
    actualEntry = `${role} initial auth/local fixture > deliberately pending sync`
    selector = '[data-academy-surface="bootstrap"]'
    component = 'AppContent / AcademyLoading'
  } else if (id.endsWith('-error-boundary')) {
    actualEntry = role === 'visitor' ? 'Unauthenticated startup > preference-storage read failure' : `Verified live ${role} shell > visible Settings > preference-storage read failure`
    selector = '[data-academy-surface="error-boundary"]'
    component = 'ErrorBoundary'
  } else if (id.endsWith('-shell')) {
    actualEntry = `${role} Home after synthetic auth and failed remote hydration with local fallback`
    selector = `[data-academy-shell="${role}"]`
    component = 'AcademyShell'
  } else if (id.endsWith('-feedback-dialog')) {
    actualEntry = `${role} Home > visible feedback icon > Bug`
    selector = '[data-academy-dialog="feedback"]'
    component = 'FeedbackButton / AcademyDialog'
  } else {
    actualEntry = `${role} shell > Settings > ${id.slice(role.length + 1, -'-settings'.length)} controls`
    selector = '[data-academy-surface="settings"]'
    component = id.endsWith('-theme-settings') ? 'SettingsPage / ThemePicker' : 'SettingsPage'
  }
  return { id, role, entry: item.entry, actual_entry: actualEntry, selector, component, entry_conflict: onboardingEntryConflict(item) }
})
const entryConflicts = targets.filter(target => target.entry_conflict).map(target => ({
  ids: [target.id], ...target.entry_conflict, actual_entry: target.actual_entry,
  scope_blob: `${source}:.design-scope.json`,
  evidence: 'runOnboarding verifies the role-specific Basics surface before opening TeamPicker, then continues into Football and checks that no team opener is present there.',
  disposition: 'Actual onboarding-context evidence is retained, but the mismatching source-bound entry is not certified.',
}))
if (listIds) {
  console.log(JSON.stringify({ source_commit: source, targets }, null, 2))
  process.exit(0)
}
const club = { id: 'synthetic-club', name: 'Fictional Northbank Academy', country: 'LV', city: 'Fictional town', type: 'club', aliases: [], colors: ['#2447c5'], verified: false, addedBy: 'user', createdAt: '2026-09-01', updatedAt: '2026-09-01' }
const previousPath = path.join(output, 'shared-observations.json')
const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath, 'utf8')) : null
const report = {
  source_commit: source, kind: 'bounded-shared-synthetic-observations-not-independent-review',
  started_at: new Date().toISOString(), base_url: base, source_marker_url: `${base}/source-revision.txt`,
  runner_sha256: hash(fs.readFileSync(__filename)), scope_sha256: hash(scopeBytes),
  fixture_provenance: ['capture-support.cjs', 'capture-entry.cjs', 'capture-controls.cjs'].map(file => ({
    file, sha256: hash(fs.readFileSync(path.join(__dirname, file))),
    usage: file === 'capture-support.cjs' ? 'Imported rich fixture function without executing its capture main' : 'Reused visible team/settings navigation procedure; did not execute or modify original runner',
  })),
  targets, execution_budget_seconds: budgetSeconds,
  widths: [390, 1440], viewport_height: 1000, observations: [], interactions: [], errors: [], blockers: [], provenance: [], requests: [],
  previous_attempts: previous ? [...(previous.previous_attempts || []), {
    started_at: previous.started_at, completed_at: previous.completed_at,
    captured: previous.observations.length, errors: previous.errors,
    disposition: previous.errors.length
      ? 'Superseded evidence-runner attempt. Coach tab expectation mistakenly used mentor Progress; squad birth-year choices were buttons, not select. Production source was not changed.'
      : 'Superseded only for metadata-complete evidence, including direct rendered translation-key finding. Product source unchanged.',
  }] : [],
  conflicts: entryConflicts,
  limits: [
    'English capture baseline only; coach/mentor language controls are exercised through all six locales and restored to English.',
    'Fresh isolated Chromium contexts; all profiles, clubs, accounts and responses are fictional. All auth/API requests intercepted; external requests blocked.',
    'External font CSS is mocked empty; installed fallback font rendering only.',
    'No production source changes, replacement application DOM, fake role text, image watermarking or artificial hash differentiation.',
    'Bootstrap and ErrorBoundary are shared app-level renderings. Role provenance comes from the input fixture and verified preceding live role shell, not role-specific fallback artwork.',
    ...(entryConflicts.length ? ['Onboarding entry mismatches detected in this source-bound inventory are explicitly listed and not certified as exact-entry passes.'] : []),
    'No independent craft review, full 220-surface review, real authentication, remote save, commit, PR or deployment is claimed.',
  ],
  surface_relationships: [
    { ids: ['visitor', ...roles].map(role => `${role}-bootstrap`), note: 'Shared bootstrap implementation. Separate fixture contexts genuinely produce identical captures; no per-role artwork is present or fabricated.' },
    { ids: ['visitor', ...roles].map(role => `${role}-error-boundary`), note: 'One ErrorBoundary above providers. Visitor is a startup preference-read failure; signed-in roles are reached from their verified live shell by visible Settings navigation with a transient preference-read failure. Signed-in role captures can legitimately be byte-identical.' },
    { ids: ids.filter(id => id.includes('-onboarding-')), note: 'Actual onboarding Basics externalTeams context, not reused Profile screenshots. Entry agreement is evaluated separately for every ID against the requested source revision’s frozen inventory.' },
  ],
}
const deadline = budgetSeconds === null ? Infinity : Date.now() + budgetSeconds * 1000
function persist() {
  report.updated_at = new Date().toISOString()
  report.unfinished = ids.flatMap(id => [390, 1440].filter(width => !report.observations.some(o => o.id === id && o.width === width)).map(width => ({ id, width })))
  report.exact_entry_uncertified = report.observations.filter(o => o.entry_conflict).map(o => ({
    id: o.id, width: o.width, variant: o.variant, ...o.entry_conflict,
  }))
  fs.writeFileSync(path.join(output, 'shared-observations.json'), JSON.stringify(report, null, 2) + '\n')
}
function assert(value, message) { if (!value) throw Error(message) }
function pngInfo(file) {
  const bytes = fs.readFileSync(file)
  assert(bytes.subarray(1, 4).toString() === 'PNG', `Not PNG: ${file}`)
  return { sha256: hash(bytes), dimensions: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }, bytes: bytes.length }
}
async function bindSource(phase) {
  const head = cp.execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  assert(head === source, `Unexpected HEAD: ${head}`)
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  const marker = (await (await fetch(`${base}/source-revision.txt`)).text()).trim()
  assert(marker === source, `Unexpected compiled marker: ${marker}`)
  report.provenance.push({ phase, at: new Date().toISOString(), head, marker, clean_non_evidence_source: true })
  persist()
}
async function snap(page, id, width, actualContext, assertions, variant = 'default') {
  assert(ids.includes(id), `Out-of-scope capture ${id}`)
  const entryConflict = targets.find(target => target.id === id).entry_conflict
  await page.evaluate(() => document.fonts.ready)
  const measured = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth, language: document.documentElement.lang,
    shell: document.querySelector('[data-academy-shell]')?.getAttribute('data-academy-shell') ?? null,
    surfaces: [...document.querySelectorAll('[data-academy-surface]')].map(el => el.getAttribute('data-academy-surface')),
    dialogs: [...document.querySelectorAll('[data-academy-dialog]')].map(el => el.getAttribute('data-academy-dialog')),
    focused: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 100),
    raw_translation_keys: [...new Set(document.body.innerText.match(/\bonboarding\.[A-Za-z]+\b/g) || [])],
  }))
  const name = `shared-${id}-${variant}-${width}.png`
  await page.screenshot({ path: path.join(output, name), fullPage: false, animations: 'disabled', scale: 'css' })
  const info = pngInfo(path.join(output, name))
  const item = { id, width, variant, status: entryConflict ? 'observed-with-entry-conflict' : 'observed',
    entry_conflict: entryConflict,
    actual_context: actualContext, control_assertions: assertions, capture: `${outputName}/${name}`, ...info,
    measured, no_horizontal_page_overflow: measured.scrollWidth <= measured.clientWidth,
    limits: ['Synthetic transport and account fixture; no live identity or backend proof', 'Capture observation, not independent design approval',
      ...(entryConflict ? [entryConflict.reason] : []),
      ...(id.endsWith('-error-boundary') || id.endsWith('-bootstrap') ? ['Shared fallback has no role-specific identity; context is established by fixture and interaction provenance'] : [])],
    captured_at: new Date().toISOString(), source_commit: source }
  report.observations.push(item)
  if (!item.no_horizontal_page_overflow) report.blockers.push({ id, width, reason: 'Measured horizontal document overflow', measured })
  if (measured.raw_translation_keys.length) report.blockers.push({
    id, width, capture: item.capture, reason: 'Visible untranslated localization key',
    keys: measured.raw_translation_keys, source: 'Rendered onboarding localization keys detected in the real application context; see the captured text and requested source revision.',
    disposition: 'No source edit authorized in this evidence-only worker; parent must retain this real finding.',
  })
  persist()
}
async function navigate(page, width, destination) {
  const primary = page.locator(`.academy-primary-nav [data-page="${destination}"]`)
  if (await primary.count()) await primary.click()
  else if (width >= 1100) await page.locator(`.academy-secondary-nav [data-page="${destination}"]`).click()
  else {
    await page.locator('.academy-menu-toggle').click()
    await page.locator(`.academy-dialog [data-page="${destination}"]`).click()
  }
  await page.locator('main .academy-page').first().waitFor()
  report.interactions.push({ action: 'visible navigation', destination, width, at: new Date().toISOString() })
}
async function setup(browser, role, width, { onboarding = false, hold = false, initialStorageFailure = false } = {}) {
  const data = onboarding || role === 'visitor' ? { profile: null, onboardingComplete: false } : fixture(role, 'en')
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
  context.setDefaultTimeout(6500)
  let release
  const gate = hold ? new Promise(resolve => { release = resolve }) : Promise.resolve()
  const principal = role === 'visitor' || onboarding ? null : {
    userId: `synthetic-auth-${role}`, userDetails: `fictional-${role}@example.invalid`, identityProvider: 'github', userRoles: ['authenticated'],
  }
  await context.addInitScript(({ data, base, initialStorageFailure }) => {
    if (location.origin !== base) return
    if (!localStorage.getItem('golazo-state')) localStorage.setItem('golazo-state', JSON.stringify(data))
    if (!localStorage.getItem('golazo-lang')) localStorage.setItem('golazo-lang', 'en')
    window.__sharedStorageFailure = initialStorageFailure
    const getItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && key === 'golazo-surface-theme' && window.__sharedStorageFailure) {
        throw new Error('Synthetic local preference storage unavailable')
      }
      return getItem.call(this, key)
    }
  }, { data, base, initialStorageFailure })
  await context.route('**/*', async route => {
    const request = route.request(), url = request.url(), method = request.method()
    if (!url.startsWith(base + '/')) {
      if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: '' })
      return route.abort()
    }
    const pathname = new URL(url).pathname
    if (pathname.startsWith('/api/') || pathname.startsWith('/.auth/')) report.requests.push({ role, width, path: pathname, method, fictional: true })
    if (pathname === '/.auth/logout') return route.abort()
    if (pathname.startsWith('/.auth/')) return route.fulfill({ json: { clientPrincipal: principal } })
    if (pathname === '/api/sync' && method === 'GET') {
      await gate
      return route.fulfill({ status: 503, json: { error: 'Synthetic unavailable remote hydration; local fixture retained' } })
    }
    if (pathname === '/api/teams' && method === 'POST') return route.fulfill({ status: 409, json: { existingId: club.id } })
    if (pathname === '/api/teams') return route.fulfill({ json: { teams: [club] } })
    if (pathname.endsWith('/roster')) return route.fulfill({ json: { players: [{ playerId: 'synthetic-player', playerName: 'Fictional Player 07', positions: ['CM'], jerseyNumber: 7, birthDate: '2014-04-01', active: true }] } })
    if (pathname === '/api/mentor/mentees') return route.fulfill({ json: { mentees: [{ id: 'synthetic-player', name: 'Fictional Player 07' }, { id: 'synthetic-player-2', name: 'Fictional Player 08' }] } })
    if (pathname.endsWith('/announcements')) return route.fulfill({ json: { announcements: [] } })
    if (pathname.includes('social-challenges')) return route.fulfill({ json: { challenges: [] } })
    if (pathname === '/api/shared-tournaments') return route.fulfill({ json: { tournaments: [] } })
    if (pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'Synthetic offline service' } })
    return route.continue()
  })
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push({ role, width, message: error.message, expected_storage_fault: error.message.includes('Synthetic local preference storage unavailable') }))
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('Golazo error boundary caught:')) {
      report.interactions.push({ role, width, action: 'production ErrorBoundary caught fixture storage failure', message: message.text().slice(0, 500) })
    }
  })
  return { context, page, release: () => release?.(), data }
}
async function teamFlow(page, role, width, onboarding) {
  const makeId = suffix => onboarding ? `${role}-onboarding-${suffix}` : `coach-profile-${suffix}-dialog`
  const context = onboarding ? `Unauthenticated ${role} onboarding basics; externalTeams wizard, not persisted Profile` : 'Authenticated coach Profile > Manage teams; managedTeams wizard'
  if (onboarding) {
    await page.getByRole('button', { name: `+ ${labels['onboarding.teamPlaceholder']}`, exact: true }).click()
  } else {
    await navigate(page, width, 'profile')
    await page.locator('[data-academy-surface="coach-profile"]').waitFor()
    await page.getByRole('button', { name: labels['teams.manage'], exact: true }).click()
  }
  let dialog = page.locator('[data-academy-dialog="team-picker-my-teams"]')
  await dialog.waitFor()
  await snap(page, makeId('team-list'), width, context, ['Opened visible team-management control', 'Real TeamPicker my-teams dialog present', onboarding ? 'Current onboarding role and basics retained behind dialog' : 'Coach Profile remains underlying surface'])
  await dialog.getByRole('button', { name: `+ ${labels['teams.addNewTitle']}`, exact: true }).click()
  dialog = page.locator('[data-academy-dialog="team-picker-select-club"]')
  await dialog.getByRole('button', { name: /Fictional Northbank Academy/ }).waitFor()
  await snap(page, makeId('club-choice'), width, `${context} > Add new > Select club`, ['Visible add-new opened club search', 'Fictional service registry club rendered'])
  await dialog.getByRole('button', { name: /Fictional Northbank Academy/ }).click()
  dialog = page.locator('[data-academy-dialog="team-picker-add-teams"]')
  await dialog.waitFor()
  await dialog.getByRole('button', { name: '2013', exact: true }).click()
  await dialog.getByRole('button', { name: 'B', exact: true }).click()
  if (role === 'coach') await dialog.getByRole('button', { name: `🤝 ${labels['coach.role.assistant']}`, exact: true }).click()
  else await dialog.getByRole('button', { name: '💨 LW', exact: true }).click()
  assert(await dialog.getByText(`${club.name} 2013 B`, { exact: true }).isVisible(), 'Squad preview did not reflect year and label controls')
  await snap(page, makeId('squad-choice'), width, `${context} > Fictional Northbank Academy > Add teams`, ['Selected visible club result', 'Birth-year 2013 and label B buttons changed the real squad preview', role === 'coach' ? 'Assistant-coach choice activated in coach-mode form' : 'LW position activated within externalTeams onboarding'])
  await dialog.getByRole('button', { name: '←', exact: true }).click()
  await page.locator('[data-academy-dialog="team-picker-my-teams"]').getByRole('button', { name: `+ ${labels['teams.addNewTitle']}`, exact: true }).click()
  dialog = page.locator('[data-academy-dialog="team-picker-select-club"]')
  await dialog.getByPlaceholder(labels['teams.search']).fill(club.name)
  await dialog.getByRole('button', { name: '+ New', exact: true }).click()
  const create = page.locator('[data-academy-dialog="components-add-team-dialog"]')
  await create.waitFor()
  await snap(page, makeId('create-team'), width, `${context} > Search > + New`, ['Visible new-club control opened AddTeamDialog', 'Club name retained from search'], 'form')
  await create.getByRole('button', { name: labels['teams.addBtn'], exact: true }).click()
  await create.getByRole('button', { name: labels['teams.useThis'], exact: true }).waitFor()
  await snap(page, makeId('create-team'), width, `${context} > Add club > mocked 409 duplicate`, ['Real Add request intercepted as fixture duplicate', 'Use-existing decision visibly rendered'], 'duplicate')
  await create.getByRole('button', { name: labels['teams.useThis'], exact: true }).click()
  await page.locator('[data-academy-dialog="team-picker-add-teams"]').waitFor()
  report.interactions.push({ role, width, action: 'Duplicate Use this returned to real squad-choice form', onboarding })
  await page.keyboard.press('Escape')
}
async function runRole(browser, role, width) {
  const { context, page, release, data } = await setup(browser, role, width, { hold: true })
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.locator('[data-academy-surface="bootstrap"]').waitFor()
    await page.waitForTimeout(150)
    await snap(page, `${role}-bootstrap`, width, `Authenticated synthetic ${role} principal; local role fixture loaded; GET /api/sync deliberately held`, ['Production bootstrap visible during pending hydration', 'Role-specific local fixture and principal request recorded'])
    release()
    await page.locator(`[data-academy-shell="${role}"]`).waitFor()
    await page.locator('main .academy-page').first().waitFor()
    await page.waitForLoadState('networkidle')
    const expectedTabs = role === 'player' ? ['dashboard', 'log', 'progress', 'learn', 'profile'] : ['dashboard', 'schedule', role === 'coach' ? 'stats' : 'progress', 'profile']
    const actualTabs = await page.locator('.academy-primary-nav [data-page]').evaluateAll(elements => elements.map(el => el.dataset.page))
    assert(JSON.stringify(actualTabs) === JSON.stringify(expectedTabs), `Unexpected ${role} primary tabs: ${actualTabs}`)
    await snap(page, `${role}-shell`, width, `Authenticated ${role} Home with rich capture-support.cjs local fixture`, [`Primary navigation exactly ${actualTabs.join(', ')}`, 'Shell data role matches fixture', 'Remote hydration failed explicitly; local role survived'])
    await page.locator('.academy-feedback-toggle').click()
    const feedback = page.locator('[data-academy-dialog="feedback"]')
    const submit = feedback.getByRole('button', { name: labels['feedback.submit'], exact: true })
    assert(await submit.isDisabled(), 'Blank feedback submit should be disabled')
    await feedback.getByRole('button', { name: `🐛 ${labels['feedback.bug']}`, exact: true }).click()
    assert(await feedback.getByRole('button', { name: `🐛 ${labels['feedback.bug']}`, exact: true }).getAttribute('aria-pressed') === 'true', 'Feedback Bug choice not pressed')
    await feedback.locator('textarea').fill('Fictional review only: keep this unsent.')
    assert(await submit.isEnabled(), 'Nonempty feedback did not enable submit')
    await snap(page, `${role}-feedback-dialog`, width, `${role} Home > visible feedback icon > Bug`, ['Blank submit disabled', 'Bug type selected by visible button', 'Fictional text enables submit', 'No feedback submitted to GitHub'])
    await page.keyboard.press('Escape')
    assert(await page.locator('.academy-feedback-toggle').isVisible(), 'Feedback did not close')
    if (role === 'coach') await teamFlow(page, role, width, false)
    await navigate(page, width, 'settings')
    await page.locator('[data-academy-surface="settings"]').waitFor()
    const logout = page.getByRole('button', { name: labels['profile.logout'], exact: true })
    await logout.scrollIntoViewIfNeeded()
    assert(await page.getByText(`fictional-${role}@example.invalid`, { exact: true }).isVisible(), 'Synthetic identity missing')
    await snap(page, `${role}-account-settings`, width, `${role} shell > Settings > Account`, ['Synthetic authenticated identity visible', 'Logout and reset controls visible', 'Account role matches local fixture'])
    if (role !== 'player') {
      const allLanguages = [['lv', 'Latviešu'], ['ru', 'Русский'], ['es', 'Español'], ['lt', 'Lietuvių'], ['et', 'Eesti'], ['en', 'English']]
      for (const [language, label] of allLanguages) {
        const control = page.getByRole('button', { name: label, exact: true })
        await control.click()
        await page.waitForFunction(value => document.documentElement.lang === value && localStorage.getItem('golazo-lang') === value, language)
        assert(await control.getAttribute('aria-pressed') === 'true', `Language not pressed: ${language}`)
      }
      await page.getByRole('button', { name: 'English', exact: true }).scrollIntoViewIfNeeded()
      await snap(page, `${role}-language-settings`, width, `${role} Settings > six locale buttons, restored English`, ['All six visible language controls activated', 'Document lang and stored preference matched each selection', 'Selected English has aria-pressed=true'])
      await page.reload({ waitUntil: 'networkidle' })
      assert(await page.evaluate(() => document.documentElement.lang) === 'en', 'Language did not persist through reload')
      await navigate(page, width, 'settings')
      await page.getByRole('button', { name: labels['theme.pitch'], exact: true }).click()
      assert(await page.evaluate(() => localStorage.getItem('golazo-surface-theme')) === 'pitch', 'Theme not persisted')
      await snap(page, `${role}-theme-settings`, width, `${role} Settings > visible Pitch theme selected`, ['Explicit Pitch selection persisted', 'Selection uses real ThemePicker control', 'No forced CSS or replacement theme DOM'])
      await page.getByRole('button', { name: labels['theme.clubhouse'], exact: true }).click()
      const roleLabel = role === 'coach' ? labels['coach.role'] : labels['login.asMentor']
      await page.getByRole('button', { name: roleLabel, exact: true }).scrollIntoViewIfNeeded()
      assert(await page.getByRole('button', { name: roleLabel, exact: true }).getAttribute('aria-pressed') === 'true', 'Original role selection missing')
      await snap(page, `${role}-role-settings`, width, `${role} Settings > account-role selection`, ['Current role is pressed', 'Role control is local account preference, not server authorization'])
      await page.getByRole('button', { name: labels['login.asPlayer'], exact: true }).click()
      await page.locator('[data-academy-shell="player"]').waitFor()
      await navigate(page, width, 'settings')
      await page.getByRole('button', { name: roleLabel, exact: true }).click()
      await page.locator(`[data-academy-shell="${role}"]`).waitFor()
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
      assert(stored.profile.role === role && stored.diary.length === data.diary.length, 'Role roundtrip corrupted local profile or diary')
      report.interactions.push({ role, width, action: 'Local role -> player -> original role roundtrip preserved diary count and profile role; each real shell observed' })
    }
    await navigate(page, width, 'dashboard')
    await page.evaluate(() => { window.__sharedStorageFailure = true })
    try { await navigate(page, width, 'settings') } catch (error) {
      if (!await page.locator('[data-academy-surface="error-boundary"]').isVisible()) throw error
    }
    await page.locator('[data-academy-surface="error-boundary"]').waitFor()
    await snap(page, `${role}-error-boundary`, width, `Previously verified authenticated ${role} shell > visible Settings navigation > ThemePicker preference-storage read failure`, ['Only Storage.getItem fixture failure enabled; production component catches it', 'Actual ErrorBoundary heading and refresh visible', 'Role-specific live navigation preceded shared fallback', 'Error text is identical fixture service error, not artificially varied'])
    await page.getByRole('button', { name: labels['error.refresh'], exact: true }).click()
    await page.locator(`[data-academy-shell="${role}"]`).waitFor()
    report.interactions.push({ role, width, action: 'Visible ErrorBoundary refresh reloads real app; cleared transient fixture fault restores original role shell' })
    await navigate(page, width, 'settings')
    const logoutRequest = page.waitForRequest(request => request.url().includes('/.auth/logout'))
    await page.getByRole('button', { name: labels['profile.logout'], exact: true }).click({ noWaitAfter: true })
    const request = await logoutRequest
    report.interactions.push({ role, width, action: 'Visible logout requested actual auth route; transport blocked, no real session contacted', url: request.url() })
  } finally { release(); await context.close() }
}
async function runVisitor(browser, width) {
  const { context, page, release } = await setup(browser, 'visitor', width, { hold: true })
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.locator('[data-academy-surface="bootstrap"]').waitFor()
    await snap(page, 'visitor-bootstrap', width, 'No principal and no local profile; initial authentication/hydration bootstrap', ['Production bootstrap present', 'No role shell fabricated'])
    release()
    await page.locator('[data-academy-surface="visitor-login"]').waitFor()
    report.interactions.push({ role: 'visitor', width, action: 'Release pending synthetic hydration; real visitor sign-in renders' })
  } finally { release(); await context.close() }
  const fault = await setup(browser, 'visitor', width, { initialStorageFailure: true })
  try {
    await fault.page.goto(base, { waitUntil: 'networkidle' })
    await fault.page.locator('[data-academy-surface="error-boundary"]').waitFor()
    await snap(fault.page, 'visitor-error-boundary', width, 'Unauthenticated visitor with no profile; AppContent initial preference-storage read fails', ['Real global ErrorBoundary catches browser-storage fixture failure', 'No profile/role introduced', 'Real refresh button visible'])
    await fault.page.evaluate(() => { window.__sharedStorageFailure = false })
    await fault.page.getByRole('button', { name: labels['error.refresh'], exact: true }).click()
    await fault.page.locator('[data-academy-surface="error-boundary"]').waitFor()
    report.interactions.push({ role: 'visitor', width, action: 'Visible refresh retried; persistent startup fixture fault correctly recurred, no recovery claim' })
  } finally { await fault.context.close() }
}
async function runOnboarding(browser, role, width) {
  const { context, page } = await setup(browser, role, width, { onboarding: true })
  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.locator('[data-academy-surface="visitor-login"]').waitFor()
    await page.getByRole('button', { name: labels['login.skip'], exact: true }).click()
    await page.getByRole('button', { name: labels[`onboarding.iAm${role === 'player' ? 'Player' : 'Mentor'}`], exact: true }).click()
    await page.locator(`[data-academy-surface="onboarding-${role}-basics"]`).waitFor()
    await page.getByPlaceholder(labels['onboarding.namePlaceholder']).fill(`Fictional ${role} 07`)
    await page.locator('main input[type="date"]').fill(role === 'player' ? '2014-04-01' : '1988-04-01')
    await teamFlow(page, role, width, true)
    await page.locator('main .btn-primary').last().click()
    await page.locator(`[data-academy-surface="onboarding-${role}-football"]`).waitFor()
    assert(await page.getByRole('button', { name: `+ ${labels['onboarding.teamPlaceholder']}`, exact: true }).count() === 0, 'Unexpected football-step team opener; re-check actual-entry mapping')
    report.interactions.push({
      role, width, action: 'Continued into real onboarding Football step; confirmed no team-picker opener here. Captures were reached from the role-specific Basics surface.',
      entry_conflicts: targets.filter(target => target.role === role && target.entry_conflict).map(target => ({ id: target.id, ...target.entry_conflict })),
    })
  } finally { await context.close() }
}
async function main() {
  fs.mkdirSync(output, { recursive: true })
  await bindSource('before')
  const browser = await chromium.launch({ headless: true })
  try {
    const jobs = [390, 1440].flatMap(width => [
      [`visitor-${width}`, () => runVisitor(browser, width)],
      ...roles.map(role => [`${role}-${width}`, () => runRole(browser, role, width)]),
      ...['player', 'mentor'].map(role => [`onboarding-${role}-${width}`, () => runOnboarding(browser, role, width)]),
    ])
    for (const [name, run] of jobs) {
      if (Date.now() > deadline) { report.blockers.push({ job: name, reason: 'Bounded execution deadline reached' }); break }
      console.log(`START ${name}`)
      try { await run(); console.log(`DONE ${name}`) }
      catch (error) { report.errors.push({ job: name, message: error.message, stack: error.stack }); console.error(`BLOCKED ${name}: ${error.message}`) }
      persist()
    }
  } finally { await browser.close() }
  await bindSource('after')
  const groups = new Map()
  for (const item of report.observations) {
    const current = pngInfo(path.join(__dirname, item.capture))
    assert(current.sha256 === item.sha256 && current.dimensions.width === item.width, `Artifact verification failed ${item.capture}`)
    const members = groups.get(item.sha256) || []
    members.push({ id: item.id, width: item.width, variant: item.variant, capture: item.capture })
    groups.set(item.sha256, members)
  }
  report.reuse = [...groups].filter(([, members]) => members.length > 1).map(([sha256, members]) => ({
    sha256, members, explanation: 'Independently captured real shared rendering produced identical bytes. Kept as genuine shared-component reuse; not fabricated as unique evidence.',
  }))
  for (const item of report.observations) {
    item.shared_rendering_reuse = report.reuse.find(group => group.sha256 === item.sha256)?.members.filter(member => member.capture !== item.capture) || []
  }
  report.artifact_verification = { count: report.observations.length, sha256_and_dimensions_match: true }
  report.completed_at = new Date().toISOString()
  persist()
  console.log(JSON.stringify({ observations: report.observations.length, unfinished: report.unfinished, errors: report.errors, conflicts: report.conflicts.length }))
  if (report.errors.length || report.unfinished.length) process.exitCode = 1
}
main().catch(error => {
  report.errors.push({ fatal: error.message })
  if (fs.existsSync(output)) persist()
  console.error(error)
  process.exitCode = 1
})
