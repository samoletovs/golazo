const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const cp = require('node:child_process')
const assert = require('node:assert/strict')
const source = process.argv[2]
assert.match(source || '', /^[0-9a-f]{40}$/)
const root = path.resolve(__dirname, '../../..')
const prefix = `source-${source.slice(0, 7)}`
const directory = path.join(__dirname, prefix)
const scopeBytes = cp.execFileSync('git', ['-C', root, 'show', `${source}:.design-scope.json`])
const scope = JSON.parse(scopeBytes)
const candidates = new Map(scope.surfaces.map(surface => [surface.id, []]))
const errors = []
const sources = []
const groups = new Map(scope.surfaces.map(surface => [surface.id, surface.shared_render_with || surface.id]))
const read = name => {
  const file = path.join(directory, name)
  if (!fs.existsSync(file)) {
    errors.push({ report: name, reason: 'Current-source report missing' })
    return null
  }
  const report = JSON.parse(fs.readFileSync(file, 'utf8'))
  if ((report.source_commit || report.source) !== source) throw Error(`${name}: source mismatch`)
  sources.push({ path: `${prefix}/${name}`, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') })
  return report
}
function add(id, row, reportName, description) {
  if (!candidates.has(id)) throw Error(`Unknown surface ${id}`)
  const raw = row.capture || row.png || row.path
  if (!raw) return
  const normalized = raw.replaceAll('\\', '/')
  const file = normalized.startsWith('docs/')
    ? path.join(root, normalized)
    : path.join(__dirname, normalized.startsWith('source-') ? normalized : `${prefix}/${normalized}`)
  if (!file.startsWith(directory + path.sep) || !fs.existsSync(file)) {
    errors.push({ id, report: reportName, capture: raw, reason: 'Capture is missing or not from this source directory' })
    return
  }
  const bytes = fs.readFileSync(file)
  if (bytes.subarray(1, 4).toString() !== 'PNG') return
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  const viewport = width >= 320 && width <= 480 ? 'mobile' : width >= 1024 ? 'desktop' : null
  if (!viewport || height < 320) {
    errors.push({ id, capture: raw, reason: 'Not a required mobile/desktop viewport capture', width, height })
    return
  }
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
  if (row.sha256 && row.sha256 !== sha256) throw Error(`${id}: observation hash no longer matches capture`)
  candidates.get(id).push({
    path: path.relative(root, file).replaceAll(path.sep, '/'), sha256, viewport,
    report: `${prefix}/${reportName}`, context_evidence: description,
    limits: row.limits || [], variant: row.variant || row.state || row.surface || '',
  })
}
for (const name of ['learning-observations.json', 'calendar-observations.json', 'profiles-observations.json', 'shared-observations.json', 'training-entry-observations.json']) {
  const report = read(name)
  if (!report) continue
  const rows = report.observations || []
  for (const row of rows) {
    const notes = row.context_evidence || [
      row.actual_context,
      ...(row.controls_exercised || row.control_assertions || row.assertions || row.controls || []),
      ...(Array.isArray(row.interaction_evidence) ? row.interaction_evidence : [row.interaction_evidence]),
    ].filter(Boolean).join('; ')
    add(row.id, row, name, notes || `Actual ${row.id} controls and rendering observed in ${name}; read its recorded assertions and limits.`)
  }
}
// Preserve old procedure-to-ID mappings, never old captures or source claims.
const procedureMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'surface-status.json'), 'utf8'))
for (const name of ['support-observations.json', 'entry-observations.json', 'control-observations.json']) {
  const report = read(name)
  if (!report) continue
  for (const surface of procedureMap.surfaces) {
    if (surface.id === 'player-exercise-library') continue
    const states = [...new Set(surface.observations.filter(row => path.basename(row.report) === name).map(row => row.state))]
    if (!states.length) continue
    const role = surface.id.startsWith('onboarding-') || surface.role === 'visitor' ? 'player' : surface.role
    for (const row of report.observations || []) {
      if (!states.includes(row.surface || row.state)) continue
      if (row.role && row.role !== role) continue
      if ((row.language || row.initialLanguage) !== 'en') continue
      add(surface.id, row, name, `Real ${role} ${row.surface || row.state} controls exercised in the ${name} procedure at this exact source; input, storage, navigation and failure assertions are retained in that report.`)
    }
  }
}
const used = new Map()
const coverage = []
const missing = []
const collisions = []
for (const surface of scope.surfaces) {
  const rows = candidates.get(surface.id)
  const images = []
  const selected = []
  for (const viewport of ['mobile', 'desktop']) {
    const choices = rows.filter(row => row.viewport === viewport)
    const first = choices.find(row => !used.has(row.sha256) || used.get(row.sha256).group === groups.get(surface.id)) || choices[0]
    if (!first) {
      missing.push({ id: surface.id, viewport })
      continue
    }
    const existing = used.get(first.sha256)
    if (existing && existing.group !== groups.get(surface.id)) {
      collisions.push({ id: surface.id, other: existing.id, viewport, sha256: first.sha256 })
    } else {
      used.set(first.sha256, { id: surface.id, group: groups.get(surface.id) })
    }
    images.push({ path: first.path, sha256: first.sha256, viewport })
    selected.push(first)
  }
  coverage.push({
    id: surface.id,
    status: images.length === 2 ? 'observed-needs-review' : 'incomplete',
    source_entry: surface.entry,
    role: surface.role,
    shared_render_with: surface.shared_render_with,
    sharing_rationale: surface.sharing_rationale,
    context_evidence: [...new Set(selected.map(row => row.context_evidence))].join(' '),
    evidence: [...new Set(selected.map(row => row.report))].join('; '),
    screenshots: images,
    limits: [...new Set(selected.flatMap(row => row.limits))],
  })
}
const result = {
  source_commit: source, scope_sha256: crypto.createHash('sha256').update(scopeBytes).digest('hex'),
  kind: 'coverage-assembly-for-independent-review-not-passing-receipt',
  sources, coverage, missing, undeclared_image_reuse: collisions, errors,
}
fs.writeFileSync(path.join(directory, 'coverage-candidate.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify({ source, paired: coverage.filter(row => row.screenshots.length === 2).length, total: coverage.length, missing, collisions, errors }))
if (missing.length || collisions.length || errors.length) process.exitCode = 1
