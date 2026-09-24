/* Bounded, local-only evidence. No product changes or real service access. */
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const { createRequire } = require('node:module')
const driver = process.argv[2]
const source = process.argv[3]
if (!driver || !/^[0-9a-f]{40}$/.test(source || '')) throw Error('Usage: node release-profiles.cjs <playwright-driver-package> <full-source-sha> [loopback-preview-origin] [--contract-only] [--pinned-preview] [--validate-only]')
const preview = new URL(process.argv[4] || 'http://127.0.0.1:4323')
const flags = new Set(process.argv.slice(5))
const contractOnly = flags.has('--contract-only')
const pinnedPreview = flags.has('--pinned-preview')
const validateOnly = flags.has('--validate-only')
if (!['http:', 'https:'].includes(preview.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(preview.hostname) || preview.pathname !== '/' || preview.search || preview.hash || preview.username || preview.password) throw Error('Preview must be a loopback HTTP(S) origin')
const base = preview.origin
const { chromium } = require(driver)
const root = path.resolve(__dirname, '..', '..', '..')
const output = path.join(__dirname, `source-${source.slice(0, 7)}`)
const gitBytes = file => cp.execFileSync('git', ['-C', root, 'show', `${source}:${file.replaceAll('\\', '/')}`])
const helperRelative = path.relative(root, path.join(__dirname, 'capture-support.cjs'))
const helperModule = { exports: {} }
const requireHere = createRequire(__filename)
const revisionFs = {
  ...fs,
  readFileSync: (file, options) => {
    const relative = path.relative(root, file)
    if (!relative.startsWith('..') && relative.startsWith(`src${path.sep}`)) {
      const bytes = gitBytes(relative)
      return options === 'utf8' || options?.encoding === 'utf8' ? bytes.toString('utf8') : bytes
    }
    return fs.readFileSync(file, options)
  },
}
const helperRequire = name => name === 'node:fs' ? revisionFs : requireHere(name)
new Function('module', 'exports', 'require', '__dirname', '__filename', gitBytes(helperRelative).toString('utf8'))(
  helperModule, helperModule.exports, helperRequire, __dirname, path.join(__dirname, 'capture-support.cjs'),
)
const { fixture } = helperModule.exports
const labels = JSON.parse(gitBytes('src\\i18n\\en.json'))
const ids = [
  'player-progress', 'player-progress-chart-detail', 'player-progress-match-detail',
  'player-skill-history', 'player-evaluation-history', 'player-evaluation-detail',
  'player-physical-history', 'player-wellbeing-patterns', 'player-profile',
  'player-personal-goals', 'player-profile-physical-history',
  'player-profile-measurement-dialog', 'player-tracked-fields-dialog', 'player-physical-reminder-dialog',
  'coach-home-squad-filter', 'coach-announcement-composer', 'coach-team-challenge-create',
  'coach-statistics', 'coach-statistics-squad-filter', 'coach-profile', 'coach-photo-controls',
  'mentor-check-in-trends', 'mentor-wellbeing-patterns', 'mentor-team-announcements',
  'mentor-progress', 'mentor-progress-chart-detail', 'mentor-skill-history',
  'mentor-evaluation-history', 'mentor-evaluation-detail', 'mentor-physical-history',
  'mentor-progress-wellbeing', 'mentor-profile', 'mentor-photo-controls',
]
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const scope = JSON.parse(scopeBytes)
const report = {
  kind: 'bounded-synthetic-controls-evidence-not-quality-vote',
  source_commit: source,
  source_marker_url: `${base}/source-revision.txt`,
  scope_git_blob: cp.execFileSync('git', ['-C', root, 'rev-parse', `${source}:.design-scope.json`], { encoding: 'utf8' }).trim(),
  scope_sha256: hash(scopeBytes),
  scope_hash_method: 'SHA-256 of verbatim git show SOURCE:.design-scope.json bytes; no JSON reserialization',
  capture_harness_sha256: hash(fs.readFileSync(__filename)),
  fixture_loading: 'capture-support.cjs, engine source and English labels are loaded from the requested Git revision, not the mutable checkout',
  fixture_helpers: ['capture-support.cjs', 'capture-controls.cjs'].map(file => ({
    path: path.relative(root, path.join(__dirname, file)),
    sha256: hash(gitBytes(path.relative(root, path.join(__dirname, file)))),
  })),
  started_at: new Date().toISOString(), requested_ids: ids, observations: [], denied_profile_states: [], failures: [], runtime_errors: [],
  limits: [
    'English Chromium at 390x1000 and 1440x1000 only; not a browser/localization quality vote.',
    'Synthetic fictional records and mocked APIs only; no live auth, children, Azure, external fonts, or services.',
    'Read-only local/device snapshots are not asserted to be linked-child cloud history.',
    'Recorded mood/energy and measurement displays are UI evidence, not health, growth, or ability diagnoses.',
    'Coach statistics deliberately states analytics are unavailable; no invented zero totals.',
    'Evaluation list/detail primary captures use a pre-existing coach account with matching server-stored managed-team entitlement, visibly switched to player or mentor with the same identity and teams. They do not certify general player/mentor or linked-child evaluation access.',
    'Ordinary profiles without managed-team entitlement remain denied 403 and are recorded separately as negative access observations, never as populated history proof.',
    'Independent review and final owner acceptance remain parent-owned.',
    'Viewport captures scroll to actual sections; device-scope notice is checked in DOM and is not made artificially sticky.',
  ],
}
function persist() {
  fs.mkdirSync(output, { recursive: true })
  report.updated_at = new Date().toISOString()
  report.completed_ids = ids.filter(id => [390, 1440].every(width => report.observations.some(row => row.id === id && row.viewport.width === width && row.variant === 'primary')))
  report.unfinished_ids = ids.filter(id => !report.completed_ids.includes(id))
  report.coverage_status = report.unfinished_ids.length ? 'partial' : 'captured'
  report.id_map = Object.fromEntries(ids.map(id => [id, {
    scope_entry: scope.surfaces.find(item => item.id === id),
    status: report.completed_ids.includes(id) ? 'paired-captures' : 'unfinished',
    captures: report.observations.filter(row => row.id === id).map(({ variant, path, sha256, viewport, truthful_alias }) => ({
      variant, path, sha256, viewport, ...(truthful_alias ? { truthful_alias } : {}),
    })),
    reasons: report.failures.filter(failure => failure.id === id),
  }]))
  fs.writeFileSync(path.join(output, 'profiles-observations.json'), JSON.stringify(report, null, 2))
}
function day(offset) { const date = new Date(); date.setUTCDate(date.getUTCDate() - offset); return date.toISOString().slice(0, 10) }
function dataFor(role) {
  const data = fixture(role, 'en')
  data.profile.teams[0].registryId = 'synthetic-team-a'
  data.checkIns = [6, 5, 4, 3, 2, 1, 0].map((offset, index) => ({
    id: `synthetic-check-${index}`, date: day(offset), mood: index < 4 ? 3 : 2, energy: 2,
  }))
  data.physicalProfile = {
    measurements: [120, 90, 60].map((offset, index) => ({
      id: `synthetic-measure-${index}`, measuredAt: `${day(offset)}T12:00:00Z`,
      heightCm: 144 + index, weightKg: 36 + index, sprintTime10m: Number((2.4 - index / 10).toFixed(1)),
      standingJumpCm: 125 + index * 3, juggleRecord: 10 + index * 2,
    })),
    latestIndex: 2, trackedFields: ['heightCm', 'weightKg', 'sprintTime10m', 'standingJumpCm', 'juggleRecord'],
  }
  data.personalGoals = [{ id: 'synthetic-goal', title: 'Fictional steady practice goal', metric: 'trainings', target: 15, createdAt: day(30) }]
  data.skillTree.ratings = data.skillTree.ratings.map((rating, index) => ({ ...rating, rating: 3 + index % 4, lastUpdated: day(4) }))
  return data
}
const evaluation = {
  id: 'synthetic-evaluation', playerId: 'synthetic-player', teamId: 'synthetic-team-a',
  coachId: 'synthetic-coach', coachName: 'Fictional Coach 07',
  period: 'Fictional September review', date: day(2), createdAt: `${day(2)}T12:00:00Z`,
  technicalRating: 6, tacticalRating: 5, physicalRating: 5, mentalRating: 7, performanceRating: 6, knowledgeRating: 4,
  attendance: 80, strengths: ['Looked up before passing'], areasToImprove: ['Check space before receiving'],
  goalsForNextPeriod: ['Try one receiving practice'], coachNotes: 'Fictional observation, not a prediction.',
}
const announcements = [
  { id: 'synthetic-announcement', teamId: 'synthetic-team-a', authorId: 'synthetic-coach', authorName: 'Fictional Coach 07', title: 'Fictional family practice notice', body: 'Bring a water bottle to the fictional Saturday practice.', audience: 'parents', priority: 'normal', readBy: [], createdAt: `${day(1)}T12:00:00Z`, linkUrl: 'https://example.invalid/fictional-practice' },
  { id: 'synthetic-player-only', teamId: 'synthetic-team-a', authorId: 'synthetic-coach', authorName: 'Fictional Coach 07', title: 'PLAYER_ONLY_SYNTHETIC_NOTICE', body: 'Player-only test audience.', audience: 'players', priority: 'normal', readBy: [], createdAt: `${day(1)}T11:00:00Z` },
]
function createEvaluationApi() {
  const cosmosPath = path.join(root, 'api', 'src', 'cosmos.js')
  const managePath = path.join(root, 'api', 'src', 'functions', 'coach-manage.js')
  const cosmosModule = { exports: {} }
  new Function('module', 'exports', 'require', gitBytes(path.relative(root, cosmosPath)).toString('utf8'))(cosmosModule, cosmosModule.exports, name => {
    if (name === '@azure/cosmos') return { CosmosClient: class { constructor() { throw Error('Live Cosmos access prohibited in evidence') } } }
    throw Error(`Unexpected dependency in isolated auth parser: ${name}`)
  })
  const routes = new Map(), calls = []
  let storedProfile = null, coachReads = 0, storedEvaluations = [], authenticatedId = ''
  const fakeData = {
    ...cosmosModule.exports,
    getContainer: async () => ({ items: { query: query => {
      calls.push({ kind: 'profile-query', query })
      const requestedUser = query.parameters?.find(parameter => parameter.name === '@userId')?.value
      return { fetchAll: async () => ({ resources: requestedUser === authenticatedId && storedProfile ? [{ managedTeams: storedProfile.managedTeams }] : [] }) }
    } } }),
    getCoachContainer: async () => {
      coachReads++
      return { items: { query: query => {
        calls.push({ kind: 'evaluation-query', query })
        const requestedTeam = query.parameters?.find(parameter => parameter.name === '@teamId')?.value
        return { fetchAll: async () => ({ resources: storedEvaluations.filter(item => item.teamId === requestedTeam) }) }
      } } }
    },
  }
  const module = { exports: {} }
  new Function('module', 'exports', 'require', gitBytes(path.relative(root, managePath)).toString('utf8'))(module, module.exports, name => {
    if (name === '@azure/functions') return { app: { http: (name, definition) => routes.set(name, definition) } }
    if (name === '../cosmos') return fakeData
    if (name === 'crypto') return crypto
    throw Error(`Unexpected dependency in isolated evaluation handler: ${name}`)
  })
  const route = routes.get('coach-evaluations')
  if (!route || !route.methods.includes('GET')) throw Error('Evaluation GET contract was not registered')
  return {
    sourceFiles: [cosmosPath, managePath].map(file => ({ path: path.relative(root, file), sha256: hash(gitBytes(path.relative(root, file))) })),
    async request({ profile, teamId, records = [evaluation], authenticated = true, userId = 'synthetic-auth' }) {
      calls.length = 0; coachReads = 0
      storedProfile = profile; storedEvaluations = records; authenticatedId = userId
      const headers = new Headers()
      if (authenticated) headers.set('x-ms-client-principal', Buffer.from(JSON.stringify({
        userId, userDetails: 'fictional@example.invalid', userRoles: ['authenticated'],
      })).toString('base64'))
      const response = await route.handler({ method: 'GET', params: { teamId }, headers })
      return { status: response.status, response: JSON.parse(response.body), coach_container_reads: coachReads, queries: [...calls] }
    },
  }
}
async function evaluationContract() {
  const api = createEvaluationApi()
  const scenarios = [
    { name: 'unauthenticated', role: 'player', authenticated: false, managedTeams: [], expected: 401 },
    { name: 'ordinary-player-own-evaluation', role: 'player', authenticated: true, managedTeams: [], expected: 403 },
    { name: 'same-account-after-player-to-mentor-switch', role: 'mentor', authenticated: true, managedTeams: [], expected: 403 },
    { name: 'mentor-with-unrelated-managed-team', role: 'mentor', authenticated: true, managedTeams: [{ teamId: 'other-fictional-team' }], expected: 403 },
    { name: 'player-with-preexisting-managed-team-entitlement', role: 'player', authenticated: true, managedTeams: [{ teamId: 'synthetic-team-a' }], expected: 200 },
    { name: 'mentor-with-preexisting-managed-team-entitlement', role: 'mentor', authenticated: true, managedTeams: [{ teamId: 'synthetic-team-a' }], expected: 200 },
  ]
  const cases = []
  for (const scenario of scenarios) {
    const profile = { id: 'synthetic-player', role: scenario.role, managedTeams: scenario.managedTeams }
    const result = await api.request({ profile, teamId: 'synthetic-team-a', authenticated: scenario.authenticated })
    if (result.status !== scenario.expected || (result.status !== 200 && result.coach_container_reads !== 0)) throw Error(`Evaluation permission contract changed: ${scenario.name}, status=${result.status}`)
    if (result.status === 200 && !result.response.evaluations.every(item => item.playerId === profile.id && item.teamId === 'synthetic-team-a')) throw Error('Own-history contract fixture identity/team mismatch')
    cases.push({ scenario: scenario.name, profile, ...result, permission_assertion_passed: true })
  }
  return {
    source_commit: source, checked_at: new Date().toISOString(),
    method: 'Executed unchanged registered GET handler and unchanged SWA principal parser with in-memory Azure Functions registration and Cosmos query stubs. No real auth or service access.',
    source_files: api.sourceFiles,
    references: {
      gate: 'api\\src\\functions\\coach-manage.js:352-360',
      ownership: 'api\\src\\functions\\coach-manage.js:28-40',
      ui_role_switch: 'src\\pages\\SettingsPage.tsx:37-40 preserves ID and profile fields',
      ui_identity_filter: 'src\\components\\EvaluationHistory.tsx:24-61 refetches on mount, matches playerId to profile.id, has no persisted evaluation cache',
      platform_auth: 'staticwebapp.config.json /api/* requires authenticated',
    },
    cases,
    finding: 'Ordinary player/mentor accounts remain denied 403. A pre-existing managed-team owner can retain that entitlement through a visible coach-to-player or coach-to-mentor role switch and inspect evaluations matching the unchanged profile ID. This is authorized own-account history, not general player/mentor access or linked-child history. The actual GET addresses teamId only; own playerId is checked by the component, not sent as an invented request parameter.',
  }
}
async function session(browser, role, width, scenario = 'ordinary') {
  const authorizedOwn = scenario === 'authorized-own-history'
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
  const data = dataFor(authorizedOwn ? 'coach' : role)
  if (authorizedOwn) {
    data.profile.id = 'synthetic-own-history-account'
    data.profile.name = 'Fictional Own-history Account'
    data.profile.menteeIds = []
    for (const collection of [data.trainings, data.matches, data.diary]) {
      for (const item of collection) item.playerId = data.profile.id
    }
    data.skillTree.playerId = data.profile.id
  }
  const serverProfile = structuredClone(data.profile)
  const ownEvaluation = { ...evaluation, playerId: data.profile.id, period: 'Fictional own-account September review' }
  const evaluationApi = createEvaluationApi()
  const authenticatedUserId = authorizedOwn ? 'synthetic-own-auth-account' : `synthetic-auth-${role}`
  await context.addInitScript(({ data, base }) => {
    if (location.origin !== base) return
    const original = Storage.prototype.setItem
    if (!localStorage.getItem('golazo-state')) original.call(localStorage, 'golazo-state', JSON.stringify(data))
    original.call(localStorage, 'golazo-lang', 'en')
    window.__academyFail = false
    Storage.prototype.setItem = function (key, value) {
      if (key === 'golazo-state' && window.__academyFail) throw new DOMException('Synthetic storage failure', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  }, { data, base })
  const requests = []
  await context.route('**/*', async route => {
    const req = route.request(), url = req.url()
    if (url.startsWith(`blob:${base}`)) return route.continue()
    if (!url.startsWith(`${base}/`)) {
      if (url.startsWith('https://fonts.googleapis.com/')) return route.fulfill({ contentType: 'text/css', body: '' })
      return route.abort()
    }
    if (url.includes('/.auth/')) return route.fulfill({ json: { clientPrincipal: {
      userId: authenticatedUserId, userDetails: 'fictional@example.invalid', identityProvider: 'github', userRoles: ['authenticated'],
    } } })
    if (!url.includes('/api/')) return route.continue()
    const requestEvidence = { path: new URL(url).pathname, method: req.method() }
    requests.push(requestEvidence)
    if (req.method() !== 'GET') return route.fulfill({ status: 503, json: { error: 'Synthetic offline write failure' } })
    if (url.includes('/evaluations')) {
      const teamId = decodeURIComponent(new URL(url).pathname.match(/\/team\/([^/]+)\/evaluations$/)?.[1] || '')
      if (!teamId) throw Error('Unexpected evaluation GET route')
      const current = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')).profile)
      if (current.id !== serverProfile.id || JSON.stringify(current.managedTeams) !== JSON.stringify(serverProfile.managedTeams)) throw Error('Profile identity or pre-existing entitlement changed')
      const result = await evaluationApi.request({ profile: serverProfile, teamId, records: [ownEvaluation], userId: authenticatedUserId })
      if (result.status === 200 && (!authorizedOwn || !result.response.evaluations.every(item => item.playerId === current.id && item.teamId === teamId))) throw Error('Unauthorized or mismatched own-history response')
      Object.assign(requestEvidence, {
        status: result.status, scenario, requested_team_id: teamId, current_profile_id: current.id,
        current_role: current.role, authenticated_user_id: authenticatedUserId,
        returned_records: result.response.evaluations?.map(item => ({ id: item.id, playerId: item.playerId, teamId: item.teamId })) || [],
        contract_queries: result.queries, coach_container_reads: result.coach_container_reads,
        player_id_request_parameter: 'Not present in real GET contract; response identity is checked against unchanged profile.id.',
      })
      return route.fulfill({ status: result.status, json: result.response })
    }
    if (url.includes('/announcements')) return route.fulfill({ json: { announcements } })
    if (url.includes('/mentor/mentees')) return route.fulfill({ json: { mentees: [{ id: 'synthetic-player', name: 'Fictional Player 07' }, { id: 'synthetic-player-2', name: 'Fictional Player 08' }] } })
    if (url.includes('social-challenges')) return route.fulfill({ json: { challenges: [] } })
    if (url.includes('/roster')) return route.fulfill({ json: { players: [] } })
    if (url.includes('/api/teams')) return route.fulfill({ json: { teams: [] } })
    return route.fulfill({ status: 503, json: { error: 'Synthetic offline state' } })
  })
  const page = await context.newPage()
  page.setDefaultTimeout(6000)
  page.on('pageerror', error => { report.runtime_errors.push({ role, width, error: error.message }); persist() })
  const ensure = (value, message) => { if (!value) throw Error(message) }
  const text = key => labels[key] || key
  const button = key => page.getByRole('button', { name: text(key), exact: true })
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
  const section = key => page.locator('.card, .academy-panel').filter({ has: page.getByText(text(key), { exact: false }) }).first()
  const move = async target => {
    await target.waitFor({ state: 'visible' })
    await target.evaluate(node => node.scrollIntoView({ block: 'start' }))
    await page.evaluate(() => window.scrollBy(0, -95))
  }
  const navigate = async destination => {
    if (await page.locator('dialog[open]').count()) await page.keyboard.press('Escape')
    const primary = page.locator(`.academy-primary-nav [data-page="${destination}"]`)
    if (await primary.count()) await primary.click()
    else if (width >= 1100) await page.locator(`.academy-secondary-nav [data-page="${destination}"]`).click()
    else { await page.locator('.academy-menu-toggle').click(); await page.locator(`.academy-dialog [data-page="${destination}"]`).click() }
    await page.locator('main .academy-page').first().waitFor()
  }
  const snap = async (id, target, assertions, variant = 'primary', limits = []) => {
    if (target) await move(target)
    if (role === 'mentor') {
      ensure(!(await page.locator('body').innerText()).includes('PRIVATE_SYNTHETIC_REFLECTION'), 'Private diary leaked')
      if (id.includes('progress') || id.includes('skill') || id.includes('physical') || id.includes('-evaluation-')) {
        ensure((await page.locator('main').innerText()).includes(text('academy.deviceDataNotice')), 'Device snapshot notice missing')
      }
    }
    const measured = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, scrollY, language: document.documentElement.lang }))
    ensure(measured.clientWidth >= measured.scrollWidth, `Horizontal overflow ${id}`)
    const file = `profiles-${id}-${width}${variant === 'primary' ? '' : `-${variant}`}.png`
    await page.screenshot({ path: path.join(output, file), fullPage: false, animations: 'disabled', scale: 'css' })
    const sha256 = hash(fs.readFileSync(path.join(output, file)))
    const alias = report.observations.find(row => row.sha256 === sha256)
    const row = {
      id, role, variant, scope_entry: scope.surfaces.find(item => item.id === id).entry,
      path: path.relative(root, path.join(output, file)), sha256, source_commit: source,
      viewport: { width, height: 1000 }, layout: measured, assertions, limits,
      visible_text: (await page.locator('main').innerText()).slice(0, 14000),
      device_scope_text: await page.locator('.academy-data-note').allTextContents(),
    }
    if (id.includes('-evaluation-')) {
      row.access_context = {
        scenario, initial_role: 'coach', visible_role_switch_target: role,
        unchanged_profile_id: serverProfile.id, authenticated_user_id: authenticatedUserId,
        preexisting_managed_teams: serverProfile.managedTeams,
        evaluation_gets: requests.filter(request => request.path.endsWith('/evaluations')),
      }
      row.limits.push('Authorized own-account response fixture with pre-existing matching managed-team entitlement; not general player/mentor or linked-child evaluation access. All authentication and database access are stubbed.')
    }
    if (alias) row.truthful_alias = { id: alias.id, path: alias.path, reason: 'Same real shared UI rendered; no image manipulation or invented uniqueness.' }
    report.observations.push(row); persist()
    console.log(`CAPTURE ${id} ${width} ${variant}`)
  }
  const step = async (id, action) => {
    try { await action() }
    catch (error) { report.failures.push({ id, width, reason: error.message, current_view: (await page.locator('body').innerText()).slice(0, 6000) }); persist(); console.log(`GAP ${id} ${width}: ${error.message.split('\n')[0]}`) }
    finally { await page.evaluate(() => { window.__academyFail = false }).catch(() => {}); if (await page.locator('dialog[open]').count()) await page.keyboard.press('Escape') }
  }
  const tooltip = async card => {
    await move(card)
    const dots = card.locator('.recharts-line-dot')
    const dot = dots.nth(Math.min(2, (await dots.count()) - 1))
    if (await dot.count()) await dot.hover({ force: true })
    else { const box = await card.locator('.recharts-wrapper').boundingBox(); await page.mouse.move(box.x + box.width * .6, box.y + 80) }
    const tip = card.locator('.recharts-tooltip-wrapper')
    try { await tip.waitFor({ state: 'visible', timeout: 1000 }) }
    catch {
      const box = await card.locator('.recharts-wrapper').boundingBox()
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5)
      await tip.waitFor({ state: 'visible' })
    }
    return (await tip.innerText()).trim()
  }
  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.locator('.academy-shell').waitFor()
    if (authorizedOwn) {
      const before = await state()
      ensure(before.profile.role === 'coach', 'Own-history fixture must start as the pre-existing coach account')
      ensure(before.profile.managedTeams.some(team => team.teamId === ownEvaluation.teamId), 'Own-history fixture lacks its pre-existing server entitlement')
      await navigate('settings')
      await button(role === 'player' ? 'login.asPlayer' : 'login.asMentor').click()
      await page.locator(`[data-academy-shell="${role}"]`).waitFor()
      const after = await state()
      ensure(after.profile.id === before.profile.id && after.profile.role === role, 'Visible role switch changed account identity or failed')
      ensure(JSON.stringify(after.profile.managedTeams) === JSON.stringify(before.profile.managedTeams), 'Visible role switch changed pre-existing managed-team entitlements')
      ensure(JSON.stringify(after.profile.teams) === JSON.stringify(before.profile.teams), 'Visible role switch changed own team membership')
      ensure(JSON.stringify(after.diary) === JSON.stringify(before.diary), 'Role switch changed stored private diary')
      await navigate('progress')
      await step(`${role}-evaluation-history`, async () => {
        const entry = page.getByRole('button', { name: new RegExp(ownEvaluation.period) })
        await entry.waitFor()
        const successful = requests.find(request => request.path.endsWith('/evaluations') && request.status === 200)
        ensure(successful && successful.current_role === role, 'Authorized evaluation GET was not observed after the visible role switch')
        ensure(successful.returned_records.length === 1 && successful.returned_records[0].playerId === after.profile.id && successful.requested_team_id === ownEvaluation.teamId, 'Own-account identity or requested team mismatch')
        ensure(!(await page.locator('body').innerText()).includes('PRIVATE_SYNTHETIC_REFLECTION'), 'Private diary content exposed')
        await snap(`${role}-evaluation-history`, entry, [
          `Visible Settings coach-to-${role} switch preserved profile.id, teams and pre-existing managedTeams.`,
          'Actual registered GET handler executed with local auth/database stubs and returned 200 under the pre-existing entitlement.',
          'GET team ID and returned evaluation playerId match the unchanged own account and team; collapsed ratings rendered.',
          'No linked-child evaluation access or diary content.',
        ])
      })
      await step(`${role}-evaluation-detail`, async () => {
        const entry = page.getByRole('button', { name: new RegExp(ownEvaluation.period) })
        await entry.click()
        await page.getByText('Try one receiving practice', { exact: false }).waitFor()
        ensure(!(await page.locator('body').innerText()).includes('PRIVATE_SYNTHETIC_REFLECTION'), 'Private diary content exposed')
        await snap(`${role}-evaluation-detail`, entry, [
          'Expanded actual own-account evaluation control after the visible role switch.',
          '80% attendance, strengths, next-period goal and fictional coach note rendered from the authorized own-record fixture.',
          'Same authenticated account and pre-existing managed-team entitlement as list capture; no diary content.',
        ])
      })
      return
    }
    if (role === 'player') {
      await step('player-physical-reminder-dialog', async () => {
        await button('physical.update').click()
        await snap('player-physical-reminder-dialog', page.locator('.academy-dialog'), ['Opened existing dashboard stale-measurement reminder through its real update control.', 'Prefilled synthetic measurement inputs visible.'], 'primary', ['Same PhysicalUpdateFlow component as profile measurement dialog; distinct dashboard entry.'])
      })
    }
    if (role === 'mentor') {
      await step('mentor-team-announcements', async () => {
        const card = page.getByText('Fictional family practice notice', { exact: true })
        await card.waitFor()
        ensure(!await page.getByText('PLAYER_ONLY_SYNTHETIC_NOTICE', { exact: true }).count(), 'Wrong-audience notice rendered')
        const link = page.locator('a[href="https://example.invalid/fictional-practice"]')
        ensure(await link.getAttribute('rel') === 'noopener noreferrer', 'External notice link missing safe relation')
        await move(card)
        if (width === 1440) await page.evaluate(() => window.scrollBy(0, -230))
        await snap('mentor-team-announcements', null, ['Parent-audience synthetic notice rendered.', 'Player-only notice excluded.', 'External link has noopener/noreferrer and is not followed.'])
      })
      await step('mentor-wellbeing-patterns', async () => {
        const notice = page.locator('.card').filter({ hasText: text('academy.deviceSnapshot') }).first()
        await snap('mentor-wellbeing-patterns', notice, ['Conditional notice based on three consecutive synthetic low-mood records.', 'Device snapshot wording preserved; not attributed to a real child.'])
      })
      await step('mentor-check-in-trends', async () => {
        const card = section('mentor.moodTrend')
        const values = await tooltip(card)
        ensure(values.includes('2') || values.includes('3'), 'Expected synthetic chart values absent')
        await snap('mentor-check-in-trends', null, [`Real chart tooltip: ${values}`, 'Seven synthetic dates; no diary content.'])
      })
    }
    if (role !== 'coach') {
      await navigate('progress')
      await step(`${role}-progress`, async () => {
        ensure(await page.locator('.match-card-h').count() === 3, 'Synthetic matches absent')
        await snap(`${role}-progress`, page.locator('.h-scroll').first(), ['Three recorded synthetic match results and real progress controls rendered.', 'Read-only match cards for mentor; no fabricated cloud child history.'])
      })
      await step(`${role}-progress-chart-detail`, async () => {
        const details = page.locator('.academy-data-details').filter({ has: page.locator(`summary[aria-label="${text('academy.viewData')}: ${text('academy.recordedMinutes')}"]`) })
        await details.locator('summary').click()
        const rows = details.locator('tbody tr')
        ensure(await rows.count() === 30, 'Recorded-minute table should have 30 days')
        ensure((await rows.last().innerText()).includes('600'), 'Recorded minute sum must equal 600, not fabricated XP')
        await snap(`${role}-progress-chart-detail`, rows.last(), ['Opened native chart-data disclosure.', 'Thirty rows; final cumulative minutes exactly 600 from ten synthetic sessions.', 'Viewport focuses the inspectable recorded values, including final 600-minute total.'])
        await details.locator('summary').click()
      })
      if (role === 'player') await step('player-progress-match-detail', async () => {
        await page.locator('button.match-card-h').first().click()
        const dialog = page.locator('[data-academy-dialog="match-record-detail"]')
        await snap('player-progress-match-detail', dialog, ['Opened match result button.', 'Read-only opponent, score, minutes, goals and reflection from synthetic MatchEntry.'])
      })
      await step(`${role}-skill-history`, async () => {
        const card = section('progress.skillRadar')
        await card.locator('summary').click()
        ensure((await card.innerText()).includes(text('academy.skillSnapshotHint')), 'Snapshot/history explanation absent')
        await snap(`${role}-skill-history`, card, ['Opened real skill-data disclosure.', 'Current ratings and update dates shown, not invented longitudinal skill history.'])
      })
      await step(`${role}-evaluation-history`, async () => {
        const currentProfile = (await state()).profile
        const matchingEvaluationButtons = await page.getByRole('button', { name: new RegExp(ownEvaluation.period) }).count()
        const denied = requests.find(request => request.path.endsWith('/evaluations') && request.status === 403)
        ensure(denied && denied.coach_container_reads === 0, 'Expected ordinary-account 403 before evaluation data access')
        ensure(matchingEvaluationButtons === 0, 'Denied ordinary-account evaluation was rendered')
        report.denied_profile_states.push({
          affected_ids: [`${role}-evaluation-history`, `${role}-evaluation-detail`], role, viewport: { width, height: 1000 },
          kind: 'negative-access-observation-not-populated-surface-proof',
          profile_id: currentProfile.id, preexisting_managed_teams: currentProfile.managedTeams,
          status: 403, evaluation_controls: matchingEvaluationButtons, request: denied,
          capture: null, limitation: 'The component silently omits unavailable evaluations; absence is corroborated by the recorded 403 and zero evaluation-container reads, not misrepresented as populated UI.',
        })
        persist()
      })
      await step(`${role}-physical-history`, async () => {
        const card = section('progress.bodyGrowth')
        const values = await tooltip(card)
        ensure(values.includes('144') || values.includes('145') || values.includes('146'), 'Measurement tooltip missing actual synthetic height')
        await snap(`${role}-physical-history`, null, [`Inspected real measurement tooltip: ${values}`, 'Three fictional dated measurements; numerical UI evidence only.'])
      })
      const wellbeing = role === 'player' ? 'player-wellbeing-patterns' : 'mentor-progress-wellbeing'
      await step(wellbeing, async () => {
        const card = section('progress.moodTrend')
        const values = await tooltip(card)
        await snap(wellbeing, null, [`Real recorded mood/energy tooltip: ${values}`, 'Conditional wellbeing notice and recorded chart; no diagnosis.'])
      })
    } else {
      await step('coach-home-squad-filter', async () => {
        const squad = page.getByRole('button', { name: 'Fictional Academy U13', exact: true })
        await squad.click()
        ensure(await squad.getAttribute('aria-pressed') === 'true', 'Squad filter did not select')
        await snap('coach-home-squad-filter', squad, ['Real squad chip selected and aria-pressed=true.', 'Two fictional managed squads; filtered workspace shows selected squad.'])
      })
      await step('coach-announcement-composer', async () => {
        await navigate('dashboard')
        await page.locator('.academy-coach-actions').first().locator('button').nth(2).click()
        await page.getByRole('button', { name: new RegExp(text('coach.announce.new')) }).click()
        await page.getByPlaceholder(text('coach.announce.titleLabel')).fill('Fictional session change')
        await page.getByPlaceholder(text('coach.announce.body')).fill('Fictional session starts at 17:00. Bring water.')
        await page.getByPlaceholder(text('coach.announce.link')).fill('https://example.invalid/session')
        await button('coach.announce.parents').click()
        await page.getByRole('button', { name: new RegExp(text('coach.announce.send')) }).click()
        await page.getByRole('alert').first().waitFor()
        ensure(await page.getByPlaceholder(text('coach.announce.titleLabel')).inputValue() === 'Fictional session change', 'Draft lost on mock failure')
        await snap('coach-announcement-composer', page.getByRole('alert').first(), ['Title/body/link/audience filled through real controls.', 'POST mocked 503; error visible and draft retained.', 'No announcement delivered.'])
      })
      await step('coach-team-challenge-create', async () => {
        await navigate('dashboard')
        await page.locator('.academy-coach-actions').first().locator('button').nth(5).click()
        await button('teamChallenges.create').click()
        await page.getByLabel(text('teamChallenges.challengeTitle'), { exact: true }).fill('Fictional joint practice')
        await page.getByLabel(text('teamChallenges.opponentName'), { exact: true }).fill('Fictional Eastbank Academy')
        await page.getByLabel(text('teamChallenges.opponentCode'), { exact: true }).fill('fictional-opponent-code')
        await button('teamChallenges.send').click()
        await page.getByRole('alert').first().waitFor()
        ensure(await page.getByLabel(text('teamChallenges.challengeTitle'), { exact: true }).inputValue() === 'Fictional joint practice', 'Challenge draft lost')
        await snap('coach-team-challenge-create', page.getByRole('alert').first(), ['Real opposing-team form populated, 503 POST fails safely with retained draft.', 'No invitation sent.'])
      })
      await navigate('stats')
      await step('coach-statistics', async () => {
        await button('coach.filter.all').click()
        await snap('coach-statistics', page.getByText(text('academy.statisticsUnavailable'), { exact: true }), ['Unavailable analytics notice visible; no invented numeric results.', 'All squads selection lists two fictional squads.'])
      })
      await step('coach-statistics-squad-filter', async () => {
        const squad = page.getByRole('button', { name: 'Fictional Academy U14', exact: true })
        await squad.click()
        ensure(await squad.getAttribute('aria-pressed') === 'true', 'Statistics chip not selected')
        ensure(await page.getByRole('heading', { name: 'Fictional Academy U13', exact: true }).count() === 0, 'Statistics list not filtered')
        await snap('coach-statistics-squad-filter', squad, ['Selected second squad through real chip; first squad removed from content list.', 'Analytics unavailable wording remains truthful.'])
      })
    }
    await navigate('profile')
    await step(`${role}-profile`, async () => {
      await snap(`${role}-profile`, page.locator('.academy-credential'), ['Actual role identity and synthetic team displayed.', 'Role-appropriate profile controls rendered.'])
    })
    if (role === 'player') {
      await step('player-personal-goals', async () => {
        await page.locator('.academy-goal-composer summary').click()
        await page.getByLabel(text('goals.titlePlaceholder'), { exact: true }).fill('Fictional receiving practice')
        await page.getByLabel(text('goals.target'), { exact: true }).fill('20')
        await button('goals.add').click()
        ensure((await state()).personalGoals.some(goal => goal.title === 'Fictional receiving practice'), 'Goal not persisted')
        await snap('player-personal-goals', page.getByRole('heading', { name: text('goals.title'), exact: true }), ['Created goal with real title/metric/target controls; verified local persistence.', 'Existing goal progression and remove controls visible.'])
      })
      await step('player-profile-physical-history', async () => {
        await snap('player-profile-physical-history', section('profile.physical'), ['Latest three-record synthetic measurement set and real comparison deltas.', 'Actual Update and Customize controls.'])
      })
      await step('player-profile-measurement-dialog', async () => {
        await button('physical.update').click()
        await page.locator('#physical-heightCm').fill('147')
        await page.evaluate(() => { window.__academyFail = true })
        await button('physical.save').click()
        await page.locator('.academy-dialog .academy-error').waitFor()
        ensure(await page.locator('#physical-heightCm').inputValue() === '147', 'Measurement draft lost')
        ensure((await state()).physicalProfile.measurements.length === 3, 'Failed measurement write persisted')
        await snap('player-profile-measurement-dialog', page.locator('.academy-dialog .academy-error'), ['Edited real measurement control; injected storage failure.', 'Error visible, 147 retained; persisted measurement count remains three.'])
      })
      await step('player-tracked-fields-dialog', async () => {
        await button('physical.customize').click()
        const dialog = page.locator('[data-academy-dialog="components-tracked-fields-editor"]')
        const choice = dialog.locator('button[aria-pressed]:not([disabled])').first()
        const before = await choice.getAttribute('aria-pressed')
        await choice.click()
        ensure(await choice.getAttribute('aria-pressed') !== before, 'Field toggle inert')
        await snap('player-tracked-fields-dialog', dialog, ['Real optional tracked-field toggle changed aria-pressed.', 'Required controls remain disabled; reset/save controls available.'])
      })
    } else {
      await step(`${role}-photo-controls`, async () => {
        const photo = page.locator('.academy-photo-controls')
        const image = await page.evaluate(() => {
          const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
          const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2447c5'; ctx.fillRect(0, 0, 64, 64)
          ctx.fillStyle = '#ff9b7b'; ctx.beginPath(); ctx.arc(32, 32, 17, 0, Math.PI * 2); ctx.fill()
          return canvas.toDataURL('image/png').split(',')[1]
        })
        await page.evaluate(() => { window.__academyFail = true })
        const chooser = page.waitForEvent('filechooser')
        await button('profile.uploadPhoto').press('Enter')
        await (await chooser).setFiles({ name: 'synthetic-academy-mark.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') })
        await photo.getByRole('alert').waitFor()
        ensure(!(await state()).profile.photoUrl, 'Failed photo persisted')
        await snap(`${role}-photo-controls`, photo, ['Keyboard-activated real upload chooser with generated non-person mark.', 'Storage failure shows retry and retains File without persisting photo.'], 'retained-failure')
        await page.evaluate(() => { window.__academyFail = false })
        await photo.getByRole('button', { name: text('academy.retry'), exact: true }).click()
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('golazo-state')).profile.photoUrl?.startsWith('data:image/jpeg'))
        const firstPhoto = (await state()).profile.photoUrl
        const replacement = await page.evaluate(() => {
          const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
          const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2447c5'; ctx.fillRect(0, 0, 64, 64)
          ctx.fillStyle = '#ff9b7b'; ctx.fillRect(16, 16, 32, 32)
          return canvas.toDataURL('image/png').split(',')[1]
        })
        const changeChooser = page.waitForEvent('filechooser')
        await button('profile.changePhoto').press('Enter')
        await (await changeChooser).setFiles({ name: 'synthetic-replacement-mark.png', mimeType: 'image/png', buffer: Buffer.from(replacement, 'base64') })
        await page.waitForFunction(previous => {
          const current = JSON.parse(localStorage.getItem('golazo-state')).profile.photoUrl
          return current?.startsWith('data:image/jpeg') && current !== previous
        }, firstPhoto)
        await snap(`${role}-photo-controls`, photo, ['Retry persisted compressed JPEG through production PhotoUpload.', 'Keyboard Change opened chooser; second non-person image replaced previous persisted JPEG.', 'Synthetic non-person preview, change and remove controls visible.', 'No actual person photograph.'])
        await button('profile.removePhoto').click()
        ensure(!(await state()).profile.photoUrl, 'Photo removal not persisted')
        report.observations.findLast(row => row.id === `${role}-photo-controls` && row.viewport.width === width).assertions.push('Subsequent remove control verified photoUrl absent from persisted state.')
        persist()
      })
    }
  } finally {
    report.mock_requests = [...(report.mock_requests || []), { role, width, scenario, requests }]
    persist(); await context.close()
  }
}
async function main() {
  if (validateOnly) {
    const result = await evaluationContract()
    console.log(JSON.stringify({ mode: 'validate-only-no-files-or-browser', source, cases: result.cases, finding: result.finding }))
    return
  }
  if (contractOnly) {
    const previous = JSON.parse(fs.readFileSync(path.join(output, 'profiles-observations.json')))
    if (previous.source_commit !== source) throw Error('Existing evidence source mismatch')
    Object.assign(report, previous)
    const marker = await (await fetch(report.source_marker_url)).text()
    if (marker.trim() !== source) throw Error('Compiled marker mismatch')
    report.evaluation_api_contract = await evaluationContract()
    report.contract_harness_sha256 = hash(fs.readFileSync(__filename))
    report.contract_source_marker_verbatim = marker
    persist()
    console.log(JSON.stringify(report.evaluation_api_contract))
    return
  }
  report.working_checkout_differences = cp.execFileSync('git', ['-C', root, 'diff', '--name-only', source, '--', '.', ':(exclude)docs/design-evidence/**'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  if (!pinnedPreview && report.working_checkout_differences.length) throw Error('Working checkout differs; use --pinned-preview only when the compiled marker still matches and fixture inputs are revision-pinned')
  report.preview_verification = pinnedPreview ? 'Compiled source marker plus Git-revision fixture/source loading; working checkout differences recorded, never relabeled' : 'Clean source checkout and compiled source marker'
  report.source_marker_verbatim = await (await fetch(report.source_marker_url)).text()
  if (report.source_marker_verbatim.trim() !== source) throw Error('Compiled marker mismatch')
  persist()
  report.evaluation_api_contract = await evaluationContract()
  for (const id of ids) if (!scope.surfaces.some(item => item.id === id)) throw Error(`Unknown scope ID ${id}`)
  const browser = await chromium.launch()
  try {
    for (const role of ['player', 'coach', 'mentor']) for (const width of [390, 1440]) {
      try { await session(browser, role, width) }
      catch (error) { report.failures.push({ role, width, reason: error.message, classification: 'session-blocked' }); persist(); console.error(error.message) }
    }
    for (const role of ['player', 'mentor']) for (const width of [390, 1440]) {
      try { await session(browser, role, width, 'authorized-own-history') }
      catch (error) {
        for (const kind of ['history', 'detail']) report.failures.push({ id: `${role}-evaluation-${kind}`, role, width, reason: error.message, classification: 'authorized-own-history-session-blocked' })
        persist(); console.error(error.message)
      }
    }
  } finally {
    await browser.close()
    report.finished_at = new Date().toISOString()
    report.final_source_marker_verbatim = await (await fetch(report.source_marker_url)).text()
    if (report.final_source_marker_verbatim.trim() !== source) report.failures.push({ classification: 'source-mismatch', reason: 'Preview source changed during capture.' })
    for (const row of report.observations) {
      const bytes = fs.readFileSync(path.join(root, row.path))
      if (hash(bytes) !== row.sha256 || bytes.readUInt32BE(16) !== row.viewport.width || bytes.readUInt32BE(20) !== row.viewport.height) throw Error(`Persisted image verification failed: ${row.path}`)
    }
    report.persisted_artifacts_verified = true
    persist()
  }
  if (report.unfinished_ids.length || report.runtime_errors.length || report.failures.length) process.exitCode = 1
  console.log(JSON.stringify({ completed: report.completed_ids, unfinished: report.unfinished_ids, failures: report.failures }))
}
main().catch(error => {
  if (validateOnly) { console.error(error); process.exitCode = 1; return }
  const failure = { reason: error.stack, classification: 'fatal', at: new Date().toISOString() }
  if (!report.observations.length && fs.existsSync(path.join(output, 'profiles-observations.json'))) {
    const previous = JSON.parse(fs.readFileSync(path.join(output, 'profiles-observations.json')))
    if (previous.source_commit === source && previous.observations?.length) Object.assign(report, previous)
  }
  report.failures.push(failure); persist(); console.error(error); process.exitCode = 1
})
