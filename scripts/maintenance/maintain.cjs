#!/usr/bin/env node
/**
 * Golazo Maintenance Orchestrator
 *
 * Discovers and runs all maintenance tasks in scripts/maintenance/tasks/.
 * Each task is a module exporting { name: string, run(config): Promise<TaskResult> }.
 *
 * Task execution order (dependency-aware):
 *   1. federation-scanner  — discover new teams from federation sites
 *   2. i18n-completeness   — check translation coverage
 *   3. team-registry       — validate all team data (ingests approved discoveries)
 *   4. team-health         — check URLs and staleness (optional — slow)
 *   5. exercise-registry   — enrich exercises with YouTube videos
 *   6. content             — publish queued content
 *   7. cosmos-sync         — sync validated teams to Cosmos DB
 *
 * Usage:
 *   node scripts/maintenance/maintain.cjs                   # Run all tasks (excl. team-health)
 *   node scripts/maintenance/maintain.cjs --dry-run         # Preview without writing
 *   node scripts/maintenance/maintain.cjs --task exercises   # Run one task only
 *   node scripts/maintenance/maintain.cjs --verbose          # Extra logging
 *   node scripts/maintenance/maintain.cjs --full             # Include slow tasks (team-health)
 *
 * Designed to work both locally (VS Code) and in CI (GitHub Actions cron).
 */

const fs = require('fs')
const path = require('path')
const config = require('./config.cjs')

/**
 * @typedef {{ added: number, updated: number, skipped: number, errors: string[] }} TaskResult
 * @typedef {{ name: string, run: (config: object) => Promise<TaskResult> }} TaskModule
 */

// Ordered task execution — tasks run in this sequence for dependency correctness
const TASK_ORDER = [
  'federation-scanner',
  'i18n-completeness',
  'team-registry',
  'team-health',
  'exercise-registry',
  'content',
  'cosmos-sync',
]

// Tasks excluded from default runs (slow or optional). Included with --full flag.
const SLOW_TASKS = new Set(['team-health'])

const fullMode = process.argv.includes('--full')

async function main() {
  const startTime = Date.now()
  console.log('═══════════════════════════════════════════════')
  console.log('  ⚽ Golazo Maintenance Runner')
  console.log(`  ${new Date().toISOString().slice(0, 19)}`)
  console.log(`  Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}${fullMode ? ' (FULL)' : ''}`)
  if (config.taskFilter) console.log(`  Filter: ${config.taskFilter}`)
  console.log('═══════════════════════════════════════════════\n')

  // Discover tasks
  const tasksDir = path.join(__dirname, 'tasks')
  const taskFiles = fs.readdirSync(tasksDir).filter(f => f.endsWith('.cjs'))

  if (taskFiles.length === 0) {
    console.log('No tasks found in scripts/maintenance/tasks/')
    process.exit(0)
  }

  // Load all task modules
  /** @type {Map<string, TaskModule>} */
  const taskModules = new Map()
  for (const file of taskFiles) {
    const task = require(path.join(tasksDir, file))
    taskModules.set(task.name, task)
  }

  // Build execution order: ordered tasks first, then any unordered tasks alphabetically
  const orderedNames = TASK_ORDER.filter(n => taskModules.has(n))
  const unorderedNames = [...taskModules.keys()].filter(n => !TASK_ORDER.includes(n)).sort()
  const executionOrder = [...orderedNames, ...unorderedNames]

  /** @type {Map<string, TaskResult>} */
  const results = new Map()
  let hasErrors = false

  for (const taskName of executionOrder) {
    const task = taskModules.get(taskName)

    // Filter by --task flag if provided
    if (config.taskFilter && !task.name.includes(config.taskFilter)) {
      if (config.verbose) console.log(`  Skipping ${task.name} (filtered out)\n`)
      continue
    }

    // Skip slow tasks unless --full or explicitly filtered
    if (SLOW_TASKS.has(task.name) && !fullMode && !config.taskFilter) {
      if (config.verbose) console.log(`  Skipping ${task.name} (slow — use --full to include)\n`)
      continue
    }

    console.log(`┌── ${task.name} ──────────────────────────────`)
    const taskStart = Date.now()

    try {
      const result = await task.run(config)
      results.set(task.name, result)

      const elapsed = ((Date.now() - taskStart) / 1000).toFixed(1)
      console.log(`│  Added: ${result.added}  Updated: ${result.updated}  Skipped: ${result.skipped}`)
      if (result.errors.length > 0) {
        hasErrors = true
        console.log(`│  Errors: ${result.errors.length}`)
        result.errors.forEach(e => console.log(`│    ⚠ ${e}`))
      }
      console.log(`└── Done (${elapsed}s)\n`)
    } catch (err) {
      hasErrors = true
      results.set(task.name, { added: 0, updated: 0, skipped: 0, errors: [err.message] })
      console.log(`│  ❌ FAILED: ${err.message}`)
      console.log(`└── Error\n`)
    }
  }

  // Summary
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('═══════════════════════════════════════════════')
  console.log('  Summary')
  console.log('───────────────────────────────────────────────')
  for (const [name, result] of results) {
    const status = result.errors.length > 0 ? '⚠' : '✓'
    console.log(`  ${status} ${name}: +${result.added} added, ${result.updated} updated, ${result.skipped} skipped`)
  }
  console.log(`\n  Total time: ${totalElapsed}s`)
  console.log('═══════════════════════════════════════════════')

  // Generate maintenance report
  generateReport(results, totalElapsed, config)

  if (hasErrors) process.exit(1)
}

/** Write data/maintenance-report.json with run results */
function generateReport(results, elapsed, config) {
  const report = {
    generatedAt: new Date().toISOString(),
    mode: config.dryRun ? 'dry-run' : 'live',
    elapsedSeconds: parseFloat(elapsed),
    tasks: {},
    summary: { totalAdded: 0, totalUpdated: 0, totalSkipped: 0, totalErrors: 0 },
  }

  for (const [name, result] of results) {
    report.tasks[name] = {
      added: result.added,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    }
    report.summary.totalAdded += result.added
    report.summary.totalUpdated += result.updated
    report.summary.totalSkipped += result.skipped
    report.summary.totalErrors += result.errors.length
  }

  const reportPath = path.join(config.dataDir, 'maintenance-report.json')
  if (!config.dryRun) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8')
    console.log(`\n  Report: data/maintenance-report.json`)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
