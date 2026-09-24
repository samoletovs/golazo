/* Evidence only: existing compiled app, synthetic data, visible UI navigation. */
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const crypto = require('node:crypto')
if (!process.argv[2]) throw Error('Provide the installed Playwright driver package path')
const { chromium } = require(process.argv[2])
const source = process.argv[3]
if (!/^[0-9a-f]{40}$/.test(source || '')) throw Error('Provide the exact compiled source revision')
const root = path.resolve(__dirname, '..', '..', '..')
const output = path.join(__dirname, `source-${source.slice(0, 7)}`)
const base = 'http://127.0.0.1:4323'
const previousPath = path.join(output, 'calendar-observations.json')
const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath, 'utf8')) : null
const labels = JSON.parse(fs.readFileSync(path.join(root, 'src', 'i18n', 'en.json'), 'utf8'))
const scopePath = path.join(root, '.design-scope.json')
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const scope = JSON.parse(scopeBytes)
const oldStatus = JSON.parse(fs.readFileSync(path.join(__dirname, 'surface-status.json'), 'utf8'))
const suffixes = ['schedule-week', 'schedule-month', 'schedule-day-detail', 'schedule-training-form', 'schedule-match-form', 'schedule-other-event-form', 'schedule-team-search', 'weekly-training-setup', 'schedule-tournament-import', 'schedule-tournament-team-search', 'schedule-tournament-team-choice', 'schedule-tournament-preview', 'schedule-tournament-result']
const ids = ['player', 'coach', 'mentor'].flatMap(role => suffixes.map(suffix => `${role}-${suffix}`)).concat(['player-football-portal', 'player-tournament-detail', 'player-portal-tournament-import', 'player-portal-tournament-team-search', 'player-portal-tournament-team-choice', 'player-portal-tournament-preview', 'player-portal-tournament-result', 'player-club-directory', 'player-club-detail'])
ids.push(...['import', 'team-search', 'team-choice', 'preview', 'result'].map(suffix => `player-log-tournament-${suffix}`))
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const report = {
  source_commit: source, kind: 'bounded-synthetic-calendar-observations-not-review',
  started_at: new Date().toISOString(), base_url: base, language: 'en', widths: [390, 1440],
  runner_sha256: hash(fs.readFileSync(__filename)),
  scope: {
    path: '.design-scope.json', git_blob: `${source}:.design-scope.json`, sha256: hash(scopeBytes),
    worktree_raw_sha256: hash(fs.readFileSync(scopePath)), prior_status_sha256: oldStatus.scope_sha256,
    matches_prior_inventory: hash(scopeBytes) === oldStatus.scope_sha256,
  },
  prior_status_source: oldStatus.source_commit,
  previous_attempts: previous ? [...(previous.previous_attempts || []), { started_at: previous.started_at, completed_at: previous.completed_at, observations: previous.observations.length, errors: previous.errors, unfinished: previous.unfinished, disposition: previous.errors.length ? 'Superseded by rerun; initial fixture lacked persisted XP and an unscoped search selector matched the background club button. These were runner errors, not application navigation blockers.' : 'Superseded by final metadata-complete run; application behavior was not changed.' }] : [],
  surface_relationships: [
    { ids: 'ROLE-schedule-* and ROLE-weekly-training-setup', implementation: 'SchedulePage', note: 'Shared implementation, separately exercised through each role navigation; not distinct application routes per dialog state.' },
    { ids: 'ROLE-schedule-tournament-* and player-portal-tournament-*', implementation: 'TournamentImport', note: 'Shared dialog wizard; role and opening entry are retained. No artificial image uniqueness applied.' },
    { ids: 'player-club-directory', owning_surface: 'player-football-portal', note: 'Inline expanded hierarchy state, not a separate page.' },
    { ids: 'player-tournament-detail', owning_surface: 'player-football-portal', note: 'Native disclosure containing all recorded matches, opened through its real summary control.' },
  ],
  targets: ids.map(id => ({ id, entry: scope.surfaces.find(item => item.id === id)?.entry, old_verification_status: oldStatus.surfaces.find(item => item.id === id)?.verification_status })),
  observations: [], blockers: [], errors: [], interactions: [], requests: [], provenance: [],
  limits: ['English only; existing EN captures reused only for exact role, width, entry and source.', 'Synthetic localStorage is initial fixture setup only; no React state navigation or post-load storage mutation.', 'All auth/API responses are mocked; outbound requests blocked; no production children/accounts.', 'Installed/fallback fonts: external font CSS mocked empty.', 'No source edit, application rebuild, install, commit, PR or deployment. No craft review or approval claim.'],
}
let browser
const deadline = Date.now() + 8 * 60 * 1000
function persist() {
  report.updated_at = new Date().toISOString()
  report.unfinished = ids.flatMap(id => [390, 1440].flatMap(width => {
    if (report.observations.some(item => item.id === id && item.width === width && item.status === 'observed')) return []
    const blocker = report.blockers.find(item => item.id === id && item.width === width)
    return [{ id, width, reason: blocker?.reason || 'Not reached within bounded execution; consult errors.' }]
  }))
  fs.writeFileSync(path.join(output, 'calendar-observations.json'), JSON.stringify(report, null, 2) + '\n')
}
function imageInfo(file) {
  const bytes = fs.readFileSync(file)
  if (bytes.subarray(1, 4).toString() !== 'PNG') throw Error(`Not a PNG: ${file}`)
  return { sha256: hash(bytes), dimensions: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }, bytes: bytes.length }
}
function verifyArtifacts() {
  const failures = []
  for (const observation of report.observations) {
    const measured = imageInfo(path.join(__dirname, observation.capture))
    if (measured.sha256 !== observation.sha256 || measured.dimensions.width !== observation.width || measured.dimensions.height !== observation.dimensions.height) failures.push({ id: observation.id, width: observation.width })
  }
  report.artifact_verification = { checked_at: new Date().toISOString(), checked: report.observations.length, hash_and_dimension_failures: failures }
  if (failures.length) throw Error('Evidence hash/dimension verification failed')
}
async function bindSource(phase) {
  const args = ['-C', root]
  const head = cp.execFileSync('git', [...args, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (head !== source) throw Error(`HEAD mismatch: ${head}`)
  cp.execFileSync('git', [...args, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  const untracked = cp.execFileSync('git', [...args, 'ls-files', '--others', '--exclude-standard', '--', '.', ':(exclude)docs/design-evidence/**'], { encoding: 'utf8' }).trim()
  if (untracked) throw Error(`Untracked non-evidence source: ${untracked}`)
  const response = await fetch(`${base}/source-revision.txt`, { signal: AbortSignal.timeout(5000) })
  const marker = (await response.text()).trim()
  if (!response.ok || marker !== source) throw Error(`Compiled marker mismatch: ${marker}`)
  report.provenance.push({ phase, timestamp: new Date().toISOString(), head, compiled_marker: marker, clean_source_excluding_evidence: true })
  persist()
}
function reuse() {
  const mappings = {
    'entry-observations.json': { 'tournament-import': 'schedule-tournament-import', 'tournament-team-choice': 'schedule-tournament-team-choice', 'tournament-preview': 'schedule-tournament-preview', 'tournament-result': 'schedule-tournament-result' },
    'support-observations.json': { 'calendar-training-form': 'schedule-training-form', 'recurring-setup': 'weekly-training-setup' },
  }
  for (const [name, mapping] of Object.entries(mappings)) {
    const evidence = JSON.parse(fs.readFileSync(path.join(output, name), 'utf8'))
    if (evidence.source_commit !== source) throw Error(`Existing report source mismatch: ${name}`)
    for (const item of evidence.observations) {
      if (item.language !== 'en' || ![390, 1440].includes(item.width) || !mapping[item.surface]) continue
      if (name === 'support-observations.json' && item.role !== 'player') continue
      const id = `${item.role}-${mapping[item.surface]}`
      const info = imageInfo(path.join(output, item.capture))
      if (info.dimensions.width !== item.width) throw Error(`Existing image width mismatch: ${item.capture}`)
      report.observations.push({
        id, role: item.role, width: item.width, language: 'en', status: 'observed', origin: 'exact-existing-evidence',
        capture: `source-${source.slice(0, 7)}/${item.capture}`, ...info, existing_report: `source-${source.slice(0, 7)}/${name}`,
        existing_state: item.surface, interaction_evidence: name === 'entry-observations.json'
          ? 'capture-entry.cjs: role onboarding via visible buttons, role calendar navigation, Add tournament, URL/team input, Fetch, discovered team choice, preview, Import; checks two games and unchanged XP.'
          : 'capture-support.cjs: player calendar navigation, Add training or recurring-training visible button.',
      })
    }
  }
  persist()
}
const today = new Date()
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const gameDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}`
const club = { id: 'synthetic-club', name: 'Fictional Northbank Academy', country: 'LV', city: 'Fictional town', type: 'club', aliases: [], colors: ['#2447c5', '#ff715b'], verified: false, addedBy: 'user', createdAt: date, updatedAt: date }
const squad = { ...club, id: 'synthetic-squad', name: 'Fictional Northbank U13', type: 'team', parentClubId: club.id, birthYear: 2014, teamLabel: 'U13' }
function fixture(role) {
  const profile = {
    id: `synthetic-${role}`, familyId: 'synthetic-family', role, name: `Fictional ${role} 07`,
    birthDate: role === 'player' ? '2014-04-01' : '1988-04-01', country: 'LV', city: 'Fictional town',
    team: club.name, positions: ['CM'], dominantFoot: 'right', language: 'en', createdAt: date,
    teams: [{ id: squad.id, name: squad.name, aliases: [], active: true, isPrimary: true, colors: ['#2447c5'], createdAt: date }],
    managedTeams: role === 'coach' ? [{ teamId: squad.id, teamName: squad.name, clubName: club.name, role: 'head', claimedAt: date, verified: false }] : [],
    menteeIds: role === 'mentor' ? ['synthetic-player'] : [],
  }
  return {
    profile, onboardingComplete: true,
    xp: { totalXp: 0, level: 1, currentLevelXp: 0, nextLevelXp: 100, streakDays: 0, lastActivityDate: date, checkInStreakDays: 0, lastCheckInDate: '' },
    schedule: [{ id: 'synthetic-training', familyId: 'synthetic-family', playerId: profile.id, type: 'training', title: 'Fictional team training', date, startTime: '17:00', endTime: '18:00', location: 'Fictional pitch', notes: 'Bring water and boots.', trainingType: 'team', createdBy: 'fixture', createdAt: date }],
    tournaments: [{ id: 'synthetic-existing-cup', playerId: profile.id, name: 'Fictional Recorded Cup', startDate: date, endDate: date, location: 'Fictional pitch', expectedGames: 2, completed: false, className: 'U13', createdAt: date }],
    matches: [0, 1].map(index => ({ id: `synthetic-match-${index}`, playerId: profile.id, tournamentId: 'synthetic-existing-cup', date, opponent: `Fictional Eastbank ${index + 1}`, playingFor: squad.name, scoreUs: 2, scoreThem: index + 1, position: 'CM', minutesPlayed: 40, goals: 1, assists: 1, shots: 3, keyPasses: 2, tackles: 2, selfRating: 7, mood: 4, createdAt: date })),
  }
}
async function runContext(role, width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' })
  const data = fixture(role)
  let imports = 0
  await context.addInitScript(({ data, base }) => {
    if (location.origin !== base) return
    if (!localStorage.getItem('golazo-state')) localStorage.setItem('golazo-state', JSON.stringify(data))
    localStorage.setItem('golazo-lang', 'en')
  }, { data, base })
  await context.route('**/*', async route => {
    const request = route.request(), url = request.url(), parsed = new URL(url)
    if (parsed.origin !== base) {
      report.requests.push({ role, width, url, outcome: 'blocked-external' })
      return url.startsWith('https://fonts.googleapis.com/') ? route.fulfill({ contentType: 'text/css', body: '' }) : route.abort()
    }
    if (parsed.pathname.startsWith('/.auth/')) return route.fulfill({ json: { clientPrincipal: { userId: 'synthetic-auth', userDetails: 'fixture@example.invalid', identityProvider: 'github', userRoles: ['authenticated'] } } })
    if (!parsed.pathname.startsWith('/api/')) return route.continue()
    report.requests.push({ role, width, method: request.method(), path: parsed.pathname + parsed.search, outcome: 'mocked' })
    if (parsed.pathname === '/api/tournament-import') {
      imports++
      const { teamName } = request.postDataJSON()
      return route.fulfill({ json: imports % 2 ? { tournament: 'Fictional Academy Cup', totalGames: 2, matchedGames: 0, games: [], allTeams: ['Fictional Northbank', 'Fictional Eastbank'] }
        : { tournament: 'Fictional Academy Cup', totalGames: 2, matchedGames: 2, className: 'U13', allTeams: ['Fictional Northbank', 'Fictional Eastbank'], games: ['10:00', '12:00'].map((time, index) => ({ date: gameDate, time, home: teamName, away: `Fictional Eastbank ${index + 1}`, venue: 'Fictional pitch', score: '', finished: false })) } })
    }
    if (parsed.pathname === '/api/teams') return route.fulfill({ json: { teams: [club, squad] } })
    if (parsed.pathname.includes('/roster')) return route.fulfill({ json: { players: [] } })
    if (parsed.pathname.includes('/mentor/mentees')) return route.fulfill({ json: { mentees: [{ id: 'synthetic-player', name: 'Fictional Player 07' }] } })
    if (parsed.pathname.includes('/shared-tournaments') && request.method() === 'GET') return route.fulfill({ json: { tournaments: [] } })
    return route.fulfill({ status: 503, json: { error: 'Synthetic unavailable remote service' } })
  })
  const page = await context.newPage()
  page.setDefaultTimeout(6000)
  page.on('pageerror', error => { report.errors.push({ role, width, type: 'pageerror', message: error.message }); persist() })
  const trace = []
  async function action(description, run) {
    if (Date.now() > deadline) throw Error('Bounded execution deadline reached')
    const item = { role, width, description, started_at: new Date().toISOString() }
    report.interactions.push(item)
    try { await run(); item.outcome = 'completed'; trace.push(description) }
    catch (error) { item.outcome = 'failed'; item.error = error.message; throw error }
  }
  const click = (locator, description) => action(description, () => locator.click())
  async function navigate(destination) {
    const primary = page.locator(`.academy-primary-nav [data-page="${destination}"]`)
    if (await primary.count()) await click(primary, `Primary navigation > ${destination}`)
    else if (width >= 1100) await click(page.locator(`.academy-secondary-nav [data-page="${destination}"]`), `Desktop secondary navigation > ${destination}`)
    else {
      await click(page.locator('.academy-menu-toggle'), 'Open mobile navigation menu')
      await click(page.locator(`.academy-dialog [data-page="${destination}"]`), `Mobile menu > ${destination}`)
    }
    await page.locator(`[data-academy-surface="${destination === 'log' ? 'player-log' : `pages-${destination === 'portal' ? 'football-portal' : 'schedule-page'}`}"]`).waitFor()
  }
  async function snap(id, locator) {
    if (report.observations.some(item => item.id === id && item.width === width && item.status === 'observed')) return
    await page.evaluate(() => document.fonts.ready)
    const capture = `calendar-${id}-${width}.png`
    await (locator || page).screenshot({ path: path.join(output, capture), animations: 'disabled', scale: 'css', ...(locator ? {} : { fullPage: true }) })
    const layout = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight }, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, surfaces: [...document.querySelectorAll('[data-academy-surface],[data-academy-dialog]')].map(e => e.dataset.academySurface || e.dataset.academyDialog) }))
    report.observations.push({ id, role, width, language: 'en', status: 'observed', origin: 'visible-ui-current-run', capture: `source-${source.slice(0, 7)}/${capture}`, capture_kind: locator ? 'element' : 'full-page', ...imageInfo(path.join(output, capture)), layout, interaction_evidence: [...trace], timestamp: new Date().toISOString() })
    if (layout.scrollWidth > layout.clientWidth) report.blockers.push({ id, width, reason: 'Horizontal document overflow observed', measured: layout })
    persist()
  }
  async function importer(prefix) {
    const dialog = page.locator('[data-academy-dialog="components-tournament-import"]')
    await dialog.waitFor()
    await action('Enter synthetic tournament URL', () => dialog.locator('input[type="url"]').fill('https://example.invalid/synthetic-tournament'))
    await snap(`${prefix}-import`)
    await action('Type Fictional in tournament registry team search', () => dialog.getByPlaceholder(labels['import.teamNameHint']).fill('Fictional'))
    const suggestions = dialog.getByRole('group', { name: labels['teams.search'], exact: true })
    await suggestions.getByRole('button', { name: new RegExp(club.name) }).waitFor()
    await snap(`${prefix}-team-search`)
    await click(suggestions.getByRole('button', { name: new RegExp(club.name) }), 'Select Fictional Northbank Academy registry suggestion')
    await click(dialog.locator('button.btn-primary').last(), 'Fetch synthetic tournament; zero matched games exposes discovered teams')
    await dialog.getByRole('button', { name: 'Fictional Northbank', exact: true }).waitFor()
    await snap(`${prefix}-team-choice`)
    await click(dialog.getByRole('button', { name: 'Fictional Northbank', exact: true }), 'Select discovered tournament team Fictional Northbank')
    await click(dialog.locator('button.btn-primary').last(), 'Fetch selected tournament team fixtures')
    await dialog.getByText('Fictional Academy Cup', { exact: true }).first().waitFor()
    await snap(`${prefix}-preview`)
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
    await click(dialog.locator('button.btn-primary').last(), 'Import the two previewed fixtures using visible Import control')
    await dialog.getByText(labels['academy.sharingUnconfirmed'], { exact: true }).waitFor()
    await snap(`${prefix}-result`)
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('golazo-state')))
    const check = { role, width, description: `${prefix}: local import adds exactly one tournament and two fixtures without XP change`, outcome: after.tournaments.length === before.tournaments.length + 1 && after.schedule.length === before.schedule.length + 2 && after.xp.totalXp === before.xp.totalXp ? 'completed' : 'failed' }
    report.interactions.push(check)
    if (check.outcome === 'failed') throw Error(check.description)
    await action('Close tournament result with Escape', () => page.keyboard.press('Escape'))
  }
  async function segment(name, run) {
    try { await run() }
    catch (error) {
      report.errors.push({ role, width, segment: name, message: error.message, reproduction: [...trace] })
      try {
        const capture = `calendar-blocker-${role}-${name}-${width}.png`
        await page.screenshot({ path: path.join(output, capture), fullPage: true, animations: 'disabled', timeout: 4000 })
        report.errors.at(-1).capture = `source-${source.slice(0, 7)}/${capture}`
        report.errors.at(-1).image = imageInfo(path.join(output, capture))
        report.errors.at(-1).visible_controls = await page.locator('button:visible,input:visible').evaluateAll(items => items.map(item => ({ tag: item.tagName, text: item.textContent?.trim().slice(0, 100), placeholder: item.getAttribute('placeholder'), ariaLabel: item.getAttribute('aria-label') })))
      } catch (captureError) { report.errors.push({ role, width, segment: name, message: `Failure evidence capture: ${captureError.message}` }) }
      persist()
      await page.keyboard.press('Escape')
    }
  }
  try {
    await page.goto(base, { waitUntil: 'networkidle', timeout: 15000 })
    await page.locator('.academy-shell').waitFor()
    await segment('schedule', async () => {
      await navigate('schedule')
      await page.getByText('Fictional team training', { exact: true }).waitFor()
      await snap(`${role}-schedule-week`)
      await click(page.locator('.schedule-tabs button').nth(1), 'Calendar > Month tab')
      await page.locator('.cal-day[data-today="true"]').waitFor()
      await snap(`${role}-schedule-month`)
      await click(page.locator('.cal-day[data-today="true"]'), 'Month calendar > populated current day')
      await page.getByText('Bring water and boots.', { exact: true }).waitFor()
      await snap(`${role}-schedule-day-detail`)
      for (const [type, key] of [['training', 'schedule.addTraining'], ['match', 'schedule.addMatch'], ['other-event', 'schedule.addEvent']]) {
        await click(page.locator('.academy-schedule-actions').getByRole('button', { name: new RegExp(labels[key]) }), `Calendar > ${labels[key]}`)
        const dialog = page.locator('[data-academy-dialog="pages-schedule-page"]')
        await dialog.waitFor()
        await snap(`${role}-schedule-${type}-form`)
        if (type === 'match') {
          await action('Type Fictional in match opponent team search', () => dialog.getByPlaceholder(labels['schedule.opponent']).fill('Fictional'))
          await page.getByRole('button', { name: new RegExp(club.name) }).waitFor()
          await snap(`${role}-schedule-team-search`)
          await click(page.getByRole('button', { name: new RegExp(club.name) }), 'Select synthetic opponent registry suggestion')
        }
        await action('Close event form with Escape', () => page.keyboard.press('Escape'))
      }
      await click(page.getByRole('button', { name: new RegExp(labels['schedule.addRecurring']) }), 'Calendar > weekly recurring-training setup')
      await page.locator('[data-academy-dialog="weekly-setup"]').waitFor()
      await snap(`${role}-weekly-training-setup`)
      await action('Close weekly training setup with Escape', () => page.keyboard.press('Escape'))
    })
    await segment('schedule-tournament', async () => {
      await navigate('schedule')
      await click(page.locator('.academy-schedule-actions').getByRole('button', { name: new RegExp(labels['schedule.addTournament']) }), 'Calendar > Add tournament')
      await importer(`${role}-schedule-tournament`)
    })
    if (role === 'player') {
      await segment('log-tournament', async () => {
        await navigate('log')
        await click(page.locator('main').getByRole('button', { name: new RegExp(labels['import.addTournament']) }), 'Log > Add tournament')
        await importer('player-log-tournament')
      })
      await segment('portal', async () => {
        await navigate('portal')
        await page.getByRole('button', { name: new RegExp(club.name) }).waitFor()
        await snap('player-football-portal')
        const title = page.getByText('Fictional Recorded Cup', { exact: true })
        const card = title.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " card ")][1]')
        const details = card.locator('[data-academy-surface="tournament-detail"]')
        await click(details.locator('summary'), 'Recorded tournament > expand all match details')
        if (!await details.evaluate(element => element.open)) throw Error('Tournament detail did not open')
        await details.scrollIntoViewIfNeeded()
        await snap('player-tournament-detail')
        await click(page.getByRole('button', { name: new RegExp(club.name) }), 'Club directory > expand Fictional Northbank Academy hierarchy')
        await page.getByRole('button', { name: new RegExp(labels['teams.viewClub']) }).waitFor()
        await snap('player-club-directory')
        await click(page.getByRole('button', { name: new RegExp(labels['teams.viewClub']) }), 'Expanded directory > View club profile')
        await page.locator('[data-academy-dialog="components-team-profile"]').waitFor()
        await snap('player-club-detail')
        await action('Close club profile with Escape', () => page.keyboard.press('Escape'))
      })
      await segment('portal-tournament', async () => {
        await navigate('portal')
        await click(page.getByRole('button', { name: new RegExp(labels['import.addTournament']) }), 'Football portal > Add tournament')
        await importer('player-portal-tournament')
      })
    }
  } finally { await context.close(); persist() }
}
async function main() {
  if (!fs.existsSync(output)) throw Error('Existing source evidence directory required')
  persist()
  await bindSource('before')
  if (JSON.stringify(scope) !== JSON.stringify(JSON.parse(fs.readFileSync(scopePath, 'utf8')))) throw Error('Working inventory differs from immutable source scope')
  reuse()
  browser = await chromium.launch({ headless: true })
  report.browser = { name: 'Chromium', version: browser.version(), headless: true, platform: process.platform }
  try {
    for (const role of ['player', 'coach', 'mentor']) for (const width of [390, 1440]) {
      if (Date.now() > deadline) throw Error('Bounded execution deadline reached')
      try { await runContext(role, width) }
      catch (error) { report.errors.push({ role, width, message: error.message }); persist() }
    }
  } finally {
    await browser.close()
    await bindSource('after')
    report.completed_at = new Date().toISOString()
    report.status = report.unfinished.length || report.errors.length ? 'bounded-handoff-with-unfinished-or-blocked-targets' : 'requested-observations-complete-not-review'
    const groups = new Map()
    for (const observation of report.observations) {
      const aliases = groups.get(observation.sha256) || []
      aliases.push({ id: observation.id, width: observation.width, capture: observation.capture })
      groups.set(observation.sha256, aliases)
    }
    report.identical_image_groups = [...groups.values()].filter(group => group.length > 1)
    verifyArtifacts()
    persist()
    console.log(JSON.stringify({ observations: report.observations.length, reused: report.observations.filter(item => item.origin === 'exact-existing-evidence').length, unfinished: report.unfinished, errors: report.errors.map(item => ({ role: item.role, width: item.width, segment: item.segment, message: item.message })), report: path.join(output, 'calendar-observations.json') }, null, 2))
  }
}
main().catch(async error => {
  report.errors.push({ type: 'fatal', message: error.stack })
  report.status = 'failed-with-persistent-bounded-handoff'
  persist()
  if (browser?.isConnected()) await browser.close()
  console.error(error)
  process.exitCode = 1
})
