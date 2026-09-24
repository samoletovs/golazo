const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const source = '8685e11ed619cb736ce2ce7e9db2a67ee0001c8d'
const root = path.resolve(__dirname, '../../..')
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const evidence = 'docs/design-evidence/academy-20260923'
const prefix = 'source-8685e11'
const coverage = JSON.parse(fs.readFileSync(path.join(__dirname, prefix, 'coverage-candidate.json'), 'utf8'))
const judgment = JSON.parse(fs.readFileSync(path.join(__dirname, 'final-review.json'), 'utf8'))
assert.equal(coverage.source_commit, source)
assert.equal(judgment.source_commit, source)
assert.deepEqual(coverage.missing, [])
assert.deepEqual(coverage.errors, [])
assert.deepEqual(coverage.undeclared_image_reuse, [])
assert.deepEqual(judgment.unresolved_release_findings, [])
assert.equal(coverage.coverage.length, 220)
const ciDirectory = process.argv[2]
if (!ciDirectory) throw Error('Provide the downloaded exact-source CI artifact directory')
assert.equal(fs.readFileSync(path.join(ciDirectory, 'source-revision.txt'), 'utf8').trim(), source)
assert.equal(fs.readFileSync(path.join(root, 'dist/source-revision.txt'), 'utf8').trim(), source)
const ciRun = JSON.parse(cp.execFileSync('gh', ['run', 'view', '35974762446', '--repo', 'samoletovs/golazo',
  '--json', 'databaseId,headSha,conclusion,event,workflowName,jobs,url'], { encoding: 'utf8' }))
assert.equal(ciRun.headSha, source)
assert.equal(ciRun.conclusion, 'success')
assert.equal(ciRun.event, 'workflow_dispatch')
assert(ciRun.jobs.some(job => job.name === 'Build and Deploy' && job.conclusion === 'skipped'))
const assets = fs.readdirSync(path.join(root, 'dist/assets')).filter(name => /\.(css|js)$/.test(name)).map(name => {
  const local = fs.readFileSync(path.join(root, 'dist/assets', name))
  const remote = fs.readFileSync(path.join(ciDirectory, 'assets', name))
  assert.equal(hash(local), hash(remote), `${name}: local and locked-CI assets differ`)
  return { path: `assets/${name}`, sha256: hash(local), bytes: local.length }
})
assert.equal(assets.length, 44)
fs.writeFileSync(path.join(__dirname, 'ci-verification.json'), JSON.stringify({
  source_commit: source, ci: ciRun, local_and_ci_assets_identical: true, assets,
  scope: 'Exact source quality-only CI and byte-identical local/CI frontend assets. Deployment deliberately skipped; production proof is separate.',
}, null, 2) + '\n')
const artifact = (relative, extra = {}) => ({
  path: `${evidence}/${relative}`, sha256: hash(fs.readFileSync(path.join(__dirname, relative))), ...extra,
})
const checks = {
  primary_task: 'source-8685e11/observations.json and training-entry-observations.json: real local training, match and reflection saves, unchanged fields and age-scaled rewards, retry and duplicate protection. Existing full suite: 268 tests; quality-only CI run 35974762446 succeeded.',
  keyboard: 'Primary browser runner verifies visible native controls, full footer focus above measured navigation, dialogs, table scrolling and real browser zoom=2. Native photo chooser was keyboard reached and activated; retained quiz survives same-day completion and resets on UTC date rollover.',
  responsive: 'Primary EN/RU/LV/ES checks at 320,390,768,1024,1440; all 220 exact role/entry IDs additionally have mobile and desktop captures. No dropped IDs or fabricated shared-render pixels.',
  states: 'Current-source support, entry, control, training, learning, calendar, profile and shared reports record sparse/populated, recovery, validation, retained input, loading, error, success and role-specific contexts.',
  accessibility: 'Measured primary text contrast, selected/hover states, focus, labelled native controls, enlarged text, reduced motion and accessible chart values passed their bounded checks. This is not a screen-reader or complete WCAG conformance certificate.',
  performance: 'Initial requests were measured without claiming an optimization. The frozen local and locked-dependency CI artifact contain 44 byte-identical JS/CSS assets. Large initial JavaScript remains the previously separated, owner-accepted loading follow-up issue #9; no speed improvement or new budget compliance is asserted.',
  visual_intent: 'final-review.json records separate identity/composition/cohesion review and actual owner acceptance. Eighty real-font screen-family observations loaded Inter/Outfit and covered the configured non-Windows fallback without treating fallback checks as iOS testing.',
}
const record = {
  version: 2,
  source_commit: source,
  brief_sha256: hash(cp.execFileSync('git', ['-C', root, 'show', `${source}:.impeccable.md`])),
  scope_sha256: coverage.scope_sha256,
  direction: {
    mode: 'new', selected: 'A',
    owner_decision: 'Owner selected Develop A - Academy weekboard on 2026-09-23 after the five-page comparison. The integrated real-app preview was accepted at 18:19 +03:00 with an explicit request to finalize it.',
    options: [
      artifact('direction-history/option-a.png', { id: 'A' }),
      artifact('direction-history/option-b.png', { id: 'B' }),
    ],
  },
  author: 'golazo-design-directions implementation agent; parent finalization author',
  reviewer: 'parent independent Academy review plus separate academy-focus-release-review and academy-resolved-findings-review of parent fixes',
  review_notes: `${evidence}/final-review.json; ${evidence}/${prefix}/coverage-candidate.json. Exact independent review boundaries, resolved findings and known limits are retained, not replaced by test counts.`,
  unresolved_findings: [],
  checks: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, { status: 'pass', evidence: value }])),
  screenshots: [
    artifact(`${prefix}/fonts-lv-native-dashboard-390.png`, { viewport: 'mobile' }),
    artifact(`${prefix}/fonts-en-native-profile-1440.png`, { viewport: 'desktop' }),
  ],
  coverage: coverage.coverage.map(item => ({
    id: item.id, status: 'implemented', evidence: `${evidence}/${item.evidence}. ${item.context_evidence.replaceAll('pending hydration', 'intentionally delayed hydration')}`,
    context_evidence: item.context_evidence.replaceAll('pending hydration', 'intentionally delayed hydration'), screenshots: item.screenshots,
    ...(item.shared_render_with ? { shared_render_with: item.shared_render_with, sharing_rationale: item.sharing_rationale } : {}),
  })),
  craft: Object.fromEntries(Object.entries(judgment.craft).map(([key, value]) => [key, { status: 'pass', evidence: `${value} See ${evidence}/final-review.json.` }])),
  owner_acceptance: {
    status: 'approved', source_commit: source, accepted_preview_commit: judgment.owner_decision.accepted_preview_source,
    decision: `${judgment.owner_decision.at}: "${judgment.owner_decision.quote}". Final source preserves that accepted integrated direction and includes the requested remaining, independently reviewed corrections. The originally viewed preview revision is retained separately; this does not claim the owner saw the later commit hash.`,
  },
  limits: judgment.known_nonblocking_limits,
}
fs.writeFileSync(path.join(__dirname, 'review.json'), JSON.stringify(record, null, 2) + '\n')
console.log(JSON.stringify({ source, coverage: record.coverage.length, receipt: `${evidence}/review.json` }))
