const fs = require('fs')
const path = require('path')

function buildSummary(report, env) {
  if (!env.GITHUB_RUN_ID || !env.GITHUB_RUN_ATTEMPT || !env.GITHUB_SHA ||
      report.runId !== env.GITHUB_RUN_ID ||
      report.runAttempt !== env.GITHUB_RUN_ATTEMPT ||
      report.sourceSha !== env.GITHUB_SHA || report.mode !== 'live') {
    throw new Error('No current-run maintenance report; refusing to summarize a stale report')
  }

  const { totalAdded, totalErrors } = report.summary
  const validCount = n => Number.isInteger(n) && n >= 0
  if (![totalAdded, totalErrors].every(validCount) ||
      (report.discoveryCount !== null && !validCount(report.discoveryCount))) {
    throw new Error('Invalid maintenance report counts')
  }
  if (report.discoveryCount === null && !report.tasks['maintenance-report']?.errors.length) {
    throw new Error('Unknown discovery count requires a report error')
  }
  const taskErrors = Object.values(report.tasks).reduce((sum, task) => sum + task.errors.length, 0)
  if (taskErrors !== totalErrors) throw new Error('Maintenance error total does not match task results')

  const exercises = report.tasks['exercise-registry']?.added || 0
  const discoveries = report.tasks['federation-scanner']?.added || 0
  const failures = Object.entries(report.tasks)
    .filter(([, task]) => task.errors.length > 0)
    .map(([name, task]) => `${name}: ${task.errors.length}`)
  return `⚽ golazo maintenance: ${totalAdded} added (${exercises} exercises, ${discoveries} new discoveries), ` +
    `${totalErrors} errors, ${report.discoveryCount ?? 'unknown'} total discoveries` +
    (failures.length ? ` — ${failures.join('; ')}` : '')
}

if (require.main === module) {
  try {
    const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'maintenance-report.json'), 'utf8'))
    const message = buildSummary(report, process.env)
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `message=${message}\n`)
    console.log(message)
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  }
}

module.exports = { buildSummary }
