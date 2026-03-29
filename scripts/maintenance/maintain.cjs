#!/usr/bin/env node
/**
 * Golazo Maintenance Orchestrator
 *
 * Discovers and runs all maintenance tasks in scripts/maintenance/tasks/.
 * Each task is a module exporting { name: string, run(config): Promise<TaskResult> }.
 *
 * Usage:
 *   node scripts/maintenance/maintain.cjs                   # Run all tasks
 *   node scripts/maintenance/maintain.cjs --dry-run         # Preview without writing
 *   node scripts/maintenance/maintain.cjs --task exercises   # Run one task only
 *   node scripts/maintenance/maintain.cjs --verbose          # Extra logging
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

async function main() {
  const startTime = Date.now()
  console.log('═══════════════════════════════════════════════')
  console.log('  ⚽ Golazo Maintenance Runner')
  console.log(`  ${new Date().toISOString().slice(0, 19)}`)
  console.log(`  Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}`)
  if (config.taskFilter) console.log(`  Filter: ${config.taskFilter}`)
  console.log('═══════════════════════════════════════════════\n')

  // Discover tasks
  const tasksDir = path.join(__dirname, 'tasks')
  const taskFiles = fs.readdirSync(tasksDir)
    .filter(f => f.endsWith('.cjs'))
    .sort()

  if (taskFiles.length === 0) {
    console.log('No tasks found in scripts/maintenance/tasks/')
    process.exit(0)
  }

  /** @type {Map<string, TaskResult>} */
  const results = new Map()
  let hasErrors = false

  for (const file of taskFiles) {
    /** @type {TaskModule} */
    const task = require(path.join(tasksDir, file))

    // Filter by --task flag if provided
    if (config.taskFilter && !task.name.includes(config.taskFilter)) {
      if (config.verbose) console.log(`  Skipping ${task.name} (filtered out)\n`)
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

  if (hasErrors) process.exit(1)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
