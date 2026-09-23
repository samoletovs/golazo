const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const cp = require('node:child_process')
const root = path.resolve(__dirname, '..', '..', '..')
const source = process.argv[2]
const directory = `source-${source.slice(0, 7)}`
const folder = path.join(__dirname, directory)
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'))
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const scope = JSON.parse(scopeBytes)
const reports = ['observations.json', 'navigation-observations.json', 'support-observations.json', 'entry-observations.json', 'control-observations.json'].map(name => ({ name, data: read(name) }))
for (const report of reports) {
  if (report.data.source_commit !== source) throw Error(`Wrong source: ${report.name}`)
  if (report.data.errors?.length || report.data.failures?.length) throw Error(`Unresolved probe failure: ${report.name}`)
}
function owners(id) {
  const pages = (...names) => names.map(name => `src/pages/${name}.tsx`)
  const components = (...names) => names.map(name => `src/components/${name}.tsx`)
  if (id.includes('onboarding')) return [...pages('OnboardingPage'), ...components('TeamPicker', 'AddTeamDialog')]
  if (id === 'visitor-sign-in') return pages('LoginPage')
  if (id.includes('bootstrap')) return ['src/App.tsx', ...components('academy/AcademyState')]
  if (id.includes('error-boundary')) return components('ErrorBoundary')
  if (id.endsWith('-shell')) return [...components('academy/AcademyShell'), 'src/academy/navigation.ts']
  if (id.includes('feedback')) return components('FeedbackButton', 'academy/AcademyDialog')
  if (id.includes('identity-editor')) return [...pages('Profile'), ...components('academy/IdentityEditor')]
  if (id.includes('record-detail')) return components('academy/ActivityHistory', 'academy/ActivityRecordDialog')
  if (id.includes('routine')) return components('MorningRoutine', 'DailyCheckIn', 'DailyQuiz')
  if (id.includes('level-up')) return components('LevelUpCelebration')
  if (id.includes('daily-quiz')) return components('DailyQuiz')
  if (id.includes('daily-challenge')) return components('academy/AcademyDailyPractice')
  if (id.includes('coach-advice')) return components('CoachCard')
  if (id.startsWith('coach-announcement')) return pages('AnnouncementsPage')
  if (id.includes('team-announcements')) return components('AnnouncementFeed')
  if (id.includes('physical-reminder') || id.includes('measurement-dialog')) return components('PhysicalUpdateFlow')
  if (id.includes('tracked-fields')) return components('TrackedFieldsEditor')
  if (id.includes('team-search')) return components('TeamSearch')
  if (id.includes('tournament') && !id.endsWith('tournament-detail')) return components('TournamentImport', 'TeamSearch')
  if (/training-(log|completion)$|inline-training/.test(id)) return [...pages('TrainingLog'), ...components('training/TrainingFields', 'training/TrainingCompletion')]
  if (/match-(log|completion)$|inline-match/.test(id)) return [...pages('MatchLog'), ...components('academy/AcademySaved')]
  if (/diary-(log|completion)$/.test(id)) return pages('DiaryPage')
  if (id.includes('log-hub') || id.includes('log-skip')) return [...pages('LogPage'), ...components('academy/ActivityHistory')]
  if (id === 'coach-player-evaluation') return pages('EvaluationPage')
  if (id.includes('evaluation-history') || id.includes('evaluation-detail')) return components('EvaluationHistory')
  if (id.includes('skill-history')) return components('academy/SkillSnapshot', 'SkillRadar')
  if (id.includes('profile-physical-history')) return components('academy/AcademyPhysicalHistory')
  if (id.includes('progress') || id.includes('physical-history')) return [...pages('ProgressPage'), ...components('academy/ChartDataTable', 'academy/ActivityRecordDialog')]
  if (id.includes('wellbeing-patterns') || id.includes('check-in-trends') || id.includes('linked-player')) return pages(id.startsWith('mentor') ? 'MentorDashboard' : 'ProgressPage')
  if (/learn-articles|article-detail|learn-programs|program-|workout-/.test(id)) return [...pages('LearnPage'), ...components('WorkoutView')]
  if (/learn-exercises|exercise-library|exercise-detail|custom-drill/.test(id)) return [...pages('Exercises'), ...components('VideoPlayer')]
  if (id.startsWith('coach-team-challenge')) return pages('TeamChallenges')
  if (/challenges-(daily|weekly|special)|challenge-track/.test(id)) return pages('Challenges')
  if (id.includes('photo-controls')) return components('PhotoUpload')
  if (id.includes('card-export')) return [...pages('Profile'), 'src/engine/fifaCard.ts']
  if (id.includes('achievement')) return components('AchievementsList')
  if (id.includes('personal-goals') || id.includes('goal-editor')) return components('PersonalGoals')
  if (id.includes('settings') || id.includes('reset-confirmation')) return [...pages('SettingsPage'), ...components('ThemePicker')]
  if (/team-list-dialog|club-choice-dialog|squad-choice-dialog|create-team-dialog/.test(id)) return components('TeamPicker', 'AddTeamDialog')
  if (id.includes('schedule') || id.includes('weekly-training-setup')) return pages('SchedulePage')
  if (/football-portal|tournament-detail|club-directory|club-detail/.test(id)) return [...pages('FootballPortal'), ...components('TeamProfile')]
  if (/friends-leaderboard|friend-invite|friend-join|social-challenge/.test(id)) return [...pages('LeaderboardPage'), ...components('SocialChallenges')]
  if (id.startsWith('coach-roster')) return pages('SquadRoster')
  if (id.startsWith('coach-training')) return pages('TrainingPlanner')
  if (id.startsWith('coach-attendance')) return components('AttendanceGrid')
  if (id.startsWith('coach-statistics')) return [...pages('CoachStatsPage'), ...components('CoachSquadFilter')]
  if (id.startsWith('coach-home')) return [...pages('CoachDashboard'), ...components('CoachSquadFilter')]
  if (id === 'mentor-home') return pages('MentorDashboard')
  if (id === 'player-home' || id === 'player-activity-overview') return [...pages('Dashboard'), ...components('academy/AcademyWeekboard')]
  if (id.endsWith('-profile')) return pages('Profile')
  throw Error(`Unmapped source surface: ${id}`)
}
const observations = reports.slice(2).flatMap(report => report.data.observations.map(item => ({ ...item, report: report.name })))
function directEvidence(surface) {
  const { id, role } = surface
  let candidates = []
  const support = label => observations.filter(item => item.role === role && item.surface === label && item.report === 'support-observations.json')
  const entry = label => observations.filter(item => item.role === role && item.surface === label && item.report === 'entry-observations.json')
  const controls = label => role === 'player' ? observations.filter(item => item.surface === label && item.report === 'control-observations.json') : []
  if (id === 'visitor-sign-in') candidates = observations.filter(item => item.surface === 'visitor-sign-in')
  else if (id === 'onboarding-role-choice') candidates = observations.filter(item => item.surface === 'role-choice')
  else if (/onboarding-(basics|football|physical|assessment|ready)$/.test(id)) candidates = entry(id.replace(`${role}-`, ''))
  else if (id.endsWith('-home')) candidates = support('home-populated')
  else if (id === 'player-log-hub') candidates = support('journal-populated')
  else if (id === 'player-record-detail') candidates = ['training', 'match', 'diary'].flatMap(kind => support(`${kind}-record-detail`))
  else if (id === 'player-identity-editor') candidates = [...support('identity-editor'), ...support('identity-retained-failure')]
  else if (id === 'player-photo-controls') candidates = [...controls('photo-upload'), ...controls('photo-removal')]
  else if (id === 'player-card-export') candidates = controls('credential-export-control')
  else if (id === 'player-achievement-collection') candidates = support('achievement-collection')
  else if (id === 'player-goal-editor') candidates = support('goal-editor')
  else if (id === 'player-language-settings') candidates = controls('language-persisted')
  else if (id === 'player-theme-settings') candidates = controls('explicit-alternate-theme')
  else if (id === 'player-role-settings') candidates = controls('role-mentor')
  else if (id.endsWith('-settings') && !/(language|theme|role|account)-settings/.test(id)) candidates = support('settings')
  else if (id.endsWith('-reset-confirmation')) candidates = support('reset-confirmation')
  else if (id === 'player-match-log') candidates = controls('match-retained-failure')
  else if (id === 'player-match-completion') candidates = controls('match-completion')
  else if (id === 'player-diary-log') candidates = controls('diary-retained-failure')
  else if (id === 'player-diary-completion') candidates = controls('diary-completion')
  else if (id === 'player-exercise-library' || id === 'player-learn-exercises') candidates = support('exercise-library')
  else if (id === 'player-exercise-detail-dialog') candidates = support('exercise-detail')
  else if (id === 'player-custom-drill-dialog') candidates = support('custom-drill')
  else if (id === 'player-schedule-training-form') candidates = support('calendar-training-form')
  else if (id === 'player-weekly-training-setup') candidates = support('recurring-setup')
  else if (id === 'coach-roster') candidates = support('roster')
  else if (id === 'coach-roster-player-detail') candidates = support('roster-player-detail')
  else if (id === 'coach-training-planner') candidates = [...support('training'), ...support('training-retained-remote-failure')]
  else if (id === 'coach-training-drill-editor') candidates = support('training-drill-editor')
  else if (id === 'coach-attendance') candidates = support('attendance')
  else if (id === 'coach-announcements') candidates = support('announcements')
  else if (id === 'coach-player-evaluation') candidates = support('evaluation')
  else if (id === 'coach-team-challenges') candidates = support('team-challenges')
  else if (id === 'mentor-linked-player-selector') candidates = [...support('linked-player-selector'), ...support('linked-player-sparse')]
  else if (/^(player|mentor)-(team-list|club-choice|squad-choice|create-team)-dialog$/.test(id) || /^coach-home-(team-list|club-choice|squad-choice|create-team)-dialog$/.test(id)) {
    const label = id.includes('team-list') ? 'team-list' : id.includes('club-choice') ? 'club-choice' : id.includes('squad-choice') ? 'squad-choice' : 'create-team'
    candidates = entry(label)
    if (label === 'create-team') candidates.push(...entry('duplicate-team-choice'))
  } else if (id.includes('-schedule-tournament-')) {
    const label = id.endsWith('import') ? 'tournament-import' : id.endsWith('team-choice') ? 'tournament-team-choice' : id.endsWith('preview') ? 'tournament-preview' : id.endsWith('result') ? 'tournament-result' : null
    if (label) candidates = entry(label)
  }
  return candidates.map(item => ({ report: `${directory}/${item.report}`, state: item.surface, width: item.width, language: item.language ?? item.initialLanguage, capture: item.capture ? `${directory}/${item.capture}` : undefined }))
}
const surfaces = scope.surfaces.map(surface => {
  const sourceFiles = [...new Set(['src/App.tsx', 'src/index.css', ...owners(surface.id)])]
  for (const file of sourceFiles) if (!fs.existsSync(path.join(root, ...file.split('/')))) throw Error(`Missing owning source: ${file}`)
  const direct = directEvidence(surface)
  return { ...surface, implementation_status: 'integrated-source', source_files: sourceFiles,
    verification_status: direct.length ? 'render-and-control-observations-available' : 'source-integrated-not-individually-certified',
    observations: direct, independent_review: 'not_run',
    limits: direct.length ? 'These observations are not independent craft review or complete state coverage.' : 'Shared-system or owning-workspace evidence exists, but this exact role/entry/state has not been separately certified.' }
})
if (surfaces.length !== 220 || new Set(surfaces.map(item => item.id)).size !== 220) throw Error('Frozen scope inventory mismatch')
const pngs = fs.readdirSync(folder).filter(name => name.endsWith('.png')).sort().map(name => {
  const bytes = fs.readFileSync(path.join(folder, name))
  return { path: `${directory}/${name}`, sha256: hash(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length,
    kind: name.startsWith('credential-export-') ? 'exported-credential' : 'browser-capture' }
})
const initial = reports[0].data.results.filter(item => item.phase === 'initial-payload').map(item => ({
  language: item.language,
  decoded_js_bytes: item.assets.filter(asset => asset.path.endsWith('.js')).reduce((sum, asset) => sum + asset.decodedBytes, 0),
  transfer_js_bytes: item.assets.filter(asset => asset.path.endsWith('.js')).reduce((sum, asset) => sum + asset.transferBytes, 0),
}))
const verification = {
  source_commit: source, kind: 'held-implementation-handoff-not-approval', scope_sha256: hash(scopeBytes),
  implementation_scope_count: surfaces.length,
  individually_observed_scope_entries: surfaces.filter(item => item.observations.length).length,
  scope_entries_without_individual_certification: surfaces.filter(item => !item.observations.length).map(item => item.id),
  automated: { unit_tests: 251, unit_files: 29, design_enforcement_regressions: 16, lint: 'passed with warnings; zero errors', types: 'passed', build: 'passed', terminology: 'passed' },
  browser: { primary_observations: reports[0].data.results.length, role_navigation_observations: reports[1].data.observations.length,
    supporting_observations: reports[2].data.observations.length, entry_observations: reports[3].data.observations.length,
    control_observations: reports[4].data.observations.length, widths: [320, 390, 768, 1024, 1440],
    languages: ['en', 'lv', 'ru', 'es'], supporting_languages: ['en', 'lv'], native_browser_zoom: 2,
    png_files: pngs.length, additional_viewport_captures: pngs.filter(item => item.path.endsWith('-viewport.png')).length, errors: 0 },
  performance: { budget_approval: 'No new budget approved', initial_js_requests: initial, baseline: 'baseline-build-manifest.json',
    limit: 'Baseline records build outputs at PR #10 production base, not an initial-network or pre-PR #10 measurement. Initial JavaScript remains large; no optimization pass is claimed.' },
  independent_code_functional_review: 'not_run_by_this_agent',
  independent_visual_craft_review: 'not_run',
  integrated_owner_acceptance: 'not_obtained',
  release: 'HELD - no PR, merge or deployment',
  limits: ['Synthetic profiles, authentication and APIs only', 'Chromium only; installed/fallback fonts tested, public web-font CSS mocked empty', 'No real-user or screen-reader study', 'Not every one of the 220 role/entry/state combinations individually certified', 'Remote API correctness and production integrations not exercised'],
}
fs.writeFileSync(path.join(__dirname, 'surface-status.json'), JSON.stringify({ source_commit: source, scope_sha256: hash(scopeBytes), kind: 'implementation-and-observation-map-not-review-receipt', surfaces }, null, 2))
fs.writeFileSync(path.join(__dirname, 'capture-manifest.json'), JSON.stringify({ source_commit: source, captures: pngs }, null, 2))
fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(verification, null, 2))
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
function picture(file, label, phone = false) {
  if (!fs.existsSync(path.join(folder, file))) throw Error(`Missing gallery capture: ${file}`)
  return `<figure><a href="${directory}/${file}"><img class="${phone ? 'phone' : 'desktop'}" src="${directory}/${file}" alt="${escape(label)}"></a><figcaption>${escape(label)} · <a href="${directory}/${file}">full capture</a></figcaption></figure>`
}
const pages = ['dashboard', 'log', 'progress', 'learn', 'profile']
const families = ['en', 'lv'].map(language => `<section data-language="${language}" ${language === 'lv' ? 'hidden' : ''}><h2>${language.toUpperCase()} · desktop / mobile</h2><div class="family">${pages.map(page => picture(`${language}-workspace-${page}-1440.png`, page)).join('')}</div><div class="family">${pages.map(page => picture(`${language}-workspace-${page}-390.png`, page, true)).join('')}</div></section>`).join('')
const featureFiles = [
  ['support-player-en-home-populated-1440.png', 'Populated weekboard'],
  ['support-player-en-journal-populated-1440.png', 'Saved-entry journal'],
  ['support-coach-en-home-populated-1440.png', 'Coach workspace'],
  ['support-mentor-en-home-populated-1440.png', 'Mentor workspace'],
  ['support-player-en-identity-editor-390.png', 'Identity editor'],
  ['entry-player-en-squad-choice-390-viewport.png', 'Team wizard'],
  ['entry-coach-en-tournament-preview-390-viewport.png', 'Tournament preview'],
  ['support-coach-en-training-drill-editor-390.png', 'Training-plan editor'],
]
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/__evidence/"><title>Golazo Academy · held candidate</title><style>
body{margin:0;background:#f3f5f8;color:#14243b;font:16px/1.5 system-ui;padding:28px}main{max-width:1680px;margin:auto}h1,h2{line-height:1.1;letter-spacing:-.035em}h1{font-size:42px}h2{margin-top:36px}a{color:#193589;text-underline-offset:3px}.notice{padding:16px 20px;background:#ffcfba;border-radius:6px}.toolbar{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin:24px 0}select{padding:12px;border:1px solid #56647a;background:white;font:inherit}.family{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px;margin:20px 0}.support{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}figure{margin:0;min-width:0;background:white;border:1px solid #cad3df;border-radius:6px;overflow:hidden}img{display:block;width:100%;object-fit:cover;object-position:top;background:white}.desktop{aspect-ratio:1.6}.phone{aspect-ratio:390/900}figcaption{padding:10px;font-size:13px}.links{columns:3;overflow-wrap:anywhere}summary{cursor:pointer;padding:12px 0;font-weight:700}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #cad3df;vertical-align:top;font-size:13px}.scope-scroll{overflow:auto;max-height:600px}.muted{color:#56647a}[hidden]{display:none!important}@media(max-width:950px){.family,.support{grid-template-columns:repeat(2,minmax(0,1fr))}.links{columns:1}body{padding:16px}}:focus-visible{outline:3px solid #2447c5;outline-offset:4px}
</style><main><p class="muted">Golazo · A / Academy weekboard</p><h1>The integrated app, held for review.</h1><p class="notice"><strong>Synthetic data. Not final acceptance.</strong> These are actual compiled-app captures, not the old concepts. Functional checks do not prove visual craft.</p><p>Source <code>${source}</code> · 220 inventoried surfaces · ${pngs.length} PNG artifacts · ${verification.browser.primary_observations + verification.browser.role_navigation_observations + verification.browser.supporting_observations + verification.browser.entry_observations + verification.browser.control_observations} browser observations.</p>
<div class="toolbar"><a href="/__preview">Open interactive synthetic app</a><a href="verification.json">Verification / limits</a><a href="surface-status.json">Every surface status</a><label>Screen family <select id="language"><option value="en">English</option><option value="lv">Latviešu</option></select></label></div>
<p class="muted">Thumbnails crop the top of each real-use viewport. Open full captures for the complete page. The primary family uses the same synthetic player after a local training save.</p>${families}
<h2>Connected supporting experiences</h2><div class="support">${featureFiles.map(([file, label]) => picture(file, label, file.includes('-390'))).join('')}</div>
<h2>Review boundary</h2><p>No independent code/craft approval or integrated owner acceptance has been recorded. No PR or deployment was made. ${verification.individually_observed_scope_entries} scoped entry IDs have direct observation links; the remaining IDs are explicitly listed for individual review rather than treated as passed.</p><p>Initial JavaScript remains large. The retained baseline is build-size evidence, not a pre-PR #10 network baseline. No new performance budget or optimization claim is made.</p>
<details><summary>All 220 source-bound surface statuses</summary><div class="scope-scroll"><table><thead><tr><th>Surface / role</th><th>Implementation</th><th>Verification status</th></tr></thead><tbody>${surfaces.map(item => `<tr><td>${escape(item.id)}<br>${escape(item.role)}</td><td>${escape(item.source_files.join(', '))}</td><td>${escape(item.verification_status)}</td></tr>`).join('')}</tbody></table></div></details>
<details><summary>All captures and exported artifacts</summary><ul class="links">${pngs.map(item => `<li><a href="${item.path}">${escape(path.basename(item.path))}</a> (${item.width}×${item.height}; ${item.kind})</li>`).join('')}</ul></details>
<footer><p class="muted">Review contact sheet only. The candidate remains held for the parent’s separate functional/code and visual craft reviews, then the owner’s integrated-app acceptance.</p></footer></main><script>document.querySelector('#language').addEventListener('change',e=>document.querySelectorAll('[data-language]').forEach(node=>node.hidden=node.dataset.language!==e.target.value));</script></html>`
fs.writeFileSync(path.join(__dirname, 'index.html'), html)
console.log(JSON.stringify({ source, surfaces: surfaces.length, directlyObserved: verification.individually_observed_scope_entries, pngs: pngs.length, browserObservations: verification.browser.primary_observations + verification.browser.role_navigation_observations + verification.browser.supporting_observations + verification.browser.entry_observations + verification.browser.control_observations, initial }))
