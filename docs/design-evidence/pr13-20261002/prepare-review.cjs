/* Assemble measured facts only. Independent judgments remain deliberately unset. */
const assert = require('node:assert/strict')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../../..')
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const relative = file => path.relative(root, file).replaceAll(path.sep, '/')
const artifact = file => ({ path: relative(file), sha256: hash(fs.readFileSync(file)), bytes: fs.statSync(file).size })
for (const name of fs.readdirSync(__dirname).filter(name => /^execution-.+\.json$/.test(name))) {
  const file = path.join(__dirname, name)
  const execution = read(file)
  if (typeof execution.playwright_package === 'string' && path.isAbsolute(execution.playwright_package)) {
    execution.playwright_package = 'Existing Python-managed Playwright driver; machine-local installation path omitted'
    execution.export_redaction = 'Only the local Python installation path was removed. Source, procedure hashes, timestamps, exit codes and browser evidence are unchanged.'
    write(file, execution)
  }
}
const provenance = read(path.join(__dirname, 'artifact-provenance.json'))
const source = provenance.source_commit
assert.match(source, /^[0-9a-f]{40}$/)
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const briefBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.impeccable.md`])
const scope = JSON.parse(scopeBytes)
const captures = path.join(root, 'docs', 'design-evidence', 'academy-20260923', `source-${source.slice(0, 7)}`)
const coverageFile = path.join(captures, 'coverage-candidate.json')
const candidate = read(coverageFile)
assert.equal(candidate.source_commit, source)
assert.equal(candidate.scope_sha256, hash(scopeBytes))
for (const field of ['missing', 'errors', 'undeclared_image_reuse']) assert.deepEqual(candidate[field], [])
assert.deepEqual(candidate.coverage.map(row => row.id).sort(), scope.surfaces.map(row => row.id).sort())
for (const row of candidate.coverage) {
  assert.equal(row.status, 'observed-needs-review')
  assert.deepEqual(row.screenshots.map(image => image.viewport).sort(), ['desktop', 'mobile'])
  for (const image of row.screenshots) {
    const file = path.resolve(root, image.path)
    assert(file.startsWith(captures + path.sep), 'Coverage must use new, exact-source captures')
    assert.equal(hash(fs.readFileSync(file)), image.sha256)
  }
}
const names = [
  'observations', 'navigation-observations', 'support-observations', 'entry-observations',
  'control-observations', 'learning-observations', 'calendar-observations',
  'profiles-observations', 'shared-observations', 'training-entry-observations', 'fonts-observations',
]
const reports = names.map(name => {
  const file = path.join(captures, `${name}.json`)
  const report = read(file)
  assert.equal(report.source_commit, source, name)
  for (const field of ['errors', 'failures', 'runtime_errors', 'product_findings', 'blockers', 'unfinished', 'unfinished_ids', 'remaining']) {
    if (report[field] !== undefined) assert.deepEqual(report[field], [], `${name}.${field}`)
  }
  return { ...artifact(file), observations: (report.observations || report.results).length }
})
const ci = read(path.join(__dirname, 'ci-run.json'))
assert.equal(ci.headSha, source)
assert.equal(ci.event, 'workflow_dispatch')
assert.equal(ci.conclusion, 'success')
assert(ci.jobs.some(job => job.name === 'quality' && job.conclusion === 'success'))
assert(ci.jobs.some(job => job.name === 'Build and Deploy' && job.conclusion === 'skipped'))
const quality = ci.jobs.find(job => job.name === 'quality')
assert(quality.steps.some(step => step.name === 'Require source-bound evidence for UI changes' && step.conclusion === 'skipped'))
const ciLog = fs.readFileSync(path.join(__dirname, 'ci-quality.log'), 'utf8').replaceAll(/\u001b\[[0-9;]*m/g, '')
assert(/Tests\s+268 passed \(268\)/.test(ciLog), 'Hosted CI must report all 268 unit tests passing')
assert(/18 problems \(0 errors, 18 warnings\)/.test(ciLog), 'Record the unchanged lint warning count accurately')

const draftFile = path.join(__dirname, 'review.draft.json')
const draft = read(draftFile)
assert.equal(draft.source_commit, source)
assert.equal(draft.version, 2)
assert.equal(draft.reviewer, '', 'Never overwrite an independent reviewer')
assert.equal(draft.scope_sha256, hash(scopeBytes))
assert.equal(draft.brief_sha256, hash(briefBytes))
draft.author = 'Dependabot dependency author; bounded PR 13 evidence-preparation agent'
draft.direction = {
  mode: 'reuse',
  selected: 'A - Academy weekboard',
  owner_decision: 'Reuse the accepted Academy direction recorded in .impeccable.md. The owner accepted the integrated preview at 4113f91a630285da4f78328f8a90ba3ecbf62cba on 2026-09-23 at 18:19 +03:00. This dependency-only PR does not redesign application code; it does not claim the owner viewed the current source hash.',
}
draft.review_notes = ''
draft.unresolved_findings = [
  'The parent has not recorded its independent functional and craft review of these new captures.',
  'Source-specific reuse of the existing integrated owner acceptance has not been attested.',
]
const checkEvidence = {
  primary_task: 'Fresh primary, entry, control, training-entry, calendar, learning and profile reports exercise real controls, exact-one local saves and retained-input retry. Hosted CI ran 268 unit tests.',
  keyboard: 'Primary browser observations include native keyboard reachability, dialog Escape, chart table scrolling, footer focus above wrapping navigation, and actual browser zoom 2. Native control captures include keyboard file chooser and credential export.',
  responsive: 'Fresh navigation probe: 400 role/language/viewport observations at 320,390,768,1024,1440. Every one of the 220 frozen scope IDs has an exact-source mobile/desktop capture pair.',
  states: 'Fresh synthetic reports cover sparse/populated data, loading/error recovery, denied versus authorized own-history evaluation, validation, local failures and mocked remote-write retry. No live user or API data was used.',
  accessibility: 'Existing assertions measured primary text contrast, selected hover states, reduced motion, enlarged text, native zoom and labelled keyboard controls. These bounded checks are not a full WCAG or screen-reader certification.',
  performance: 'The primary report retains decoded initial-asset measurements. The exact-source CI artifact was served unchanged, with hosted and served index hashes matched. Existing large-chunk warning remains; no loading optimization or new performance-budget compliance is claimed.',
  visual_intent: 'Eighty fresh real-font screen-family observations loaded Inter/Outfit. The configured fallback is exercised separately. Visual/craft judgment is reserved for the parent, not inferred from automation.',
}
draft.checks = Object.fromEntries(Object.entries(checkEvidence).map(([name, evidence]) => [
  name, { status: 'observed-needs-review', evidence: `${evidence} See docs/design-evidence/pr13-20261002/validation-summary.json.` },
]))
draft.coverage = candidate.coverage.map(row => ({
  ...row,
  evidence: row.evidence.split('; ').map(file => `docs/design-evidence/academy-20260923/${file}`).join('; '),
}))
draft.craft = Object.fromEntries(['identity', 'composition', 'cohesion'].map(name => [name, { status: 'not_run', evidence: '' }]))
draft.owner_acceptance = { status: 'not_run', source_commit: '', decision: '' }
write(draftFile, draft)

const summary = {
  kind: 'source-bound-validation-handoff-not-independent-review',
  source_commit: source,
  scope_sha256: hash(scopeBytes),
  brief_sha256: hash(briefBytes),
  application_diff: 'Only package-lock.json: dev-only brace-expansion 5.0.9 -> 5.0.12, resolved archive and integrity.',
  ci: { run_id: ci.databaseId, url: ci.url, source: ci.headSha, event: ci.event, conclusion: ci.conclusion, unit_tests: 268, design_gate_regressions: 16, lint_errors: 0, existing_lint_warnings: 18, existing_large_chunk_warning: true, deployment: 'skipped', pr_source_evidence_step: 'not run on manual validation; original PR gate remains unchanged' },
  artifact: artifact(path.join(__dirname, 'artifact-provenance.json')),
  reports,
  observation_rows: reports.reduce((sum, report) => sum + report.observations, 0),
  observation_count_limit: 'Rows are bounded observations, not independent tests. Calendar includes 28 explicitly reused rows from other fresh reports at this same source. Frozen shared-render aliases retain their own role/context obligations.',
  coverage: { ...artifact(coverageFile), surface_ids: candidate.coverage.length, paired: candidate.coverage.filter(row => row.screenshots.length === 2).length, missing: candidate.missing, undeclared_image_reuse: candidate.undeclared_image_reuse, errors: candidate.errors },
  draft: artifact(draftFile),
  independent_review: 'not performed; parent-owned',
  owner_acceptance: 'Historical accepted direction retained; no new exact-source attestation written',
  merge: 'not performed',
  deployment: 'not performed',
  limits: ['Chromium on Windows only; no Safari/Firefox or screen-reader/user study.', 'Synthetic profiles and intercepted APIs only; no real authentication, Azure, children or user records.', 'Fallback-font controls and separate public real-font checks are distinguished in each report.', 'Existing evaluation authorization boundaries, loading warning and lint warnings are preserved.', 'No gate, product code, approved design, data schema or behavior was changed.'],
}
write(path.join(__dirname, 'validation-summary.json'), summary)
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const href = file => path.relative(__dirname, path.join(root, file)).replaceAll(path.sep, '/')
const sections = candidate.coverage.map(row => `<section id="${escape(row.id)}"><h2>${escape(row.id)}</h2><p>${escape(row.role)} &mdash; ${escape(row.source_entry)}</p><p>${escape(row.context_evidence)}</p><p>Observed; independent review not recorded.</p><div class="captures">${row.screenshots.map(image => `<figure><figcaption>${escape(image.viewport)} &middot; ${escape(image.sha256)}</figcaption><a href="${escape(href(image.path))}"><img loading="lazy" src="${escape(href(image.path))}" alt="${escape(row.id)} ${escape(image.viewport)} capture"></a></figure>`).join('')}</div></section>`).join('\n')
fs.writeFileSync(path.join(__dirname, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Golazo PR 13: unreviewed exact-source evidence</title><style>body{font:16px/1.5 system-ui,sans-serif;margin:2rem;max-width:1500px}h1,h2{line-height:1.25}section{border-top:1px solid #bbb;margin-top:2rem;padding-top:1rem}.captures{display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap}figure{margin:0;max-width:46%;min-width:280px}figcaption{font:12px/1.5 monospace;overflow-wrap:anywhere}img{max-width:100%;height:auto;border:1px solid #ccc}nav{display:flex;gap:1rem;flex-wrap:wrap}@media(max-width:700px){body{margin:1rem}figure{max-width:100%;min-width:0}}</style><h1>Golazo PR 13: evidence for independent review</h1><p>Source <code>${source}</code>. ${candidate.coverage.length} frozen surface IDs. Every capture is new; no historical image is relabelled. All judgments remain unapproved.</p><nav><a href="validation-summary.json">Validation summary</a><a href="review.draft.json">Incomplete v2 draft</a><a href="${escape(href(relative(coverageFile)))}">Coverage and hashes</a></nav><p>Use the full-size linked images and underlying interaction reports. This gallery does not attest quality, owner acceptance, merge or deployment.</p>${sections}</html>\n`)
const files = [...fs.readdirSync(captures).map(name => path.join(captures, name)), ...fs.readdirSync(__dirname).filter(name => name !== 'evidence-manifest.json').map(name => path.join(__dirname, name))]
  .filter(file => fs.statSync(file).isFile()).sort()
write(path.join(__dirname, 'evidence-manifest.json'), { source_commit: source, kind: 'retained-evidence-file-hashes', files: files.map(artifact) })
console.log(JSON.stringify({ source, reports: reports.length, observation_rows: summary.observation_rows, surface_ids: candidate.coverage.length, screenshots: fs.readdirSync(captures).filter(name => name.endsWith('.png')).length, retained_files: files.length, draft: relative(draftFile), independent_review: summary.independent_review }))
