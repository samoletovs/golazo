/* Re-run the preserved Academy procedures without changing historical evidence. */
const assert = require('node:assert/strict')
const cp = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

const procedures = new Set([
  'capture-support', 'capture-entry', 'capture-controls',
  'release-training', 'release-learning', 'release-calendar',
  'release-profiles', 'release-shared', 'assemble-coverage', 'navigation', 'fonts',
])
if (process.argv.includes('--help')) {
  console.log('Usage: node run-evidence.cjs <procedure> <installed-playwright-package> <source-SHA> <loopback-origin> [procedure-arguments]')
  console.log([...procedures].join(', '))
  process.exit(0)
}
const [name, driver, source, requestedBase, ...extra] = process.argv.slice(2)
assert(procedures.has(name), 'Unknown evidence procedure')
assert.match(source || '', /^[0-9a-f]{40}$/)
const url = new URL(requestedBase)
assert.equal(url.protocol, 'http:')
assert.equal(url.hostname, '127.0.0.1')
assert.equal(url.pathname, '/')
assert(!url.username && !url.password && !url.search && !url.hash)
const base = url.origin
const root = path.resolve(__dirname, '../../..')
const historic = path.join(root, 'docs', 'design-evidence', 'academy-20260923')
const output = path.join(historic, `source-${source.slice(0, 7)}`)
const filename = name === 'navigation'
  ? path.join(root, 'tests', 'academy-browser-probe.js')
  : path.join(historic, name === 'fonts' ? 'release-fonts.py' : `${name}.cjs`)
const original = fs.readFileSync(filename, 'utf8')
// Only the loopback origin changes. Assertions, fixtures and capture paths stay intact.
const executable = original.replaceAll('http://127.0.0.1:4323', base)
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const started = new Date().toISOString()
const execution = {
  kind: 'evidence-procedure-execution-not-independent-review',
  source_commit: source,
  procedure: path.relative(root, filename).replaceAll(path.sep, '/'),
  original_sha256: hash(original),
  executed_sha256: hash(executable),
  runner_sha256: hash(fs.readFileSync(__filename)),
  substitution: { original_loopback_origin: 'http://127.0.0.1:4323', actual_loopback_origin: base },
  playwright_package: 'Existing Python-managed Playwright driver; machine-local installation path omitted',
  fixture_dependency_search_path: process.env.NODE_PATH || '',
  started_at: started,
}

async function guard() {
  assert.equal(cp.execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source)
  cp.execFileSync('git', ['-C', root, 'diff', '--exit-code', source, '--', '.', ':(exclude)docs/design-evidence/**'])
  const response = await fetch(`${base}/source-revision.txt`)
  assert(response.ok, 'Preview source marker request failed')
  assert.equal((await response.text()).trim(), source)
}

async function main() {
  await guard()
  fs.mkdirSync(output, { recursive: true })
  process.once('exit', code => {
    execution.finished_at = new Date().toISOString()
    execution.exit_code = code
    const stamp = started.replaceAll(/[:.]/g, '-')
    fs.writeFileSync(path.join(__dirname, `execution-${name}-${stamp}.json`), JSON.stringify(execution, null, 2) + '\n')
  })
  if (name === 'fonts') {
    assert.equal(extra.length, 1, 'Provide the already installed Python executable')
    const bootstrap = [
      'import sys',
      'from pathlib import Path',
      'filename, source, base = sys.argv[1:]',
      'code = Path(filename).read_bytes().decode("utf-8").replace("http://127.0.0.1:4323", base)',
      'sys.argv = [filename, "--source", source]',
      'exec(compile(code, filename, "exec"), {"__name__": "__main__", "__file__": filename})',
    ].join('\n')
    cp.execFileSync(extra[0], ['-c', bootstrap, filename, source, base], { stdio: 'inherit' })
    await guard()
    const report = JSON.parse(fs.readFileSync(path.join(output, 'fonts-observations.json'), 'utf8'))
    assert.equal(report.source_commit, source)
    assert.deepEqual(report.failures, [])
    console.log(JSON.stringify({ source, observations: report.observations.length, failures: report.failures }))
    return
  }
  if (name === 'navigation') {
    const { chromium } = require(driver)
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      const probe = new Function(`return (${executable})`)()
      const summary = await probe(page)
      const observations = await page.evaluate(() => window.__academyProbe)
      await guard()
      const report = {
        ...observations,
        source_commit: source,
        kind: 'fresh-synthetic-navigation-observations-not-independent-review',
        base_url: base,
        procedure_sha256: execution.original_sha256,
        executed_procedure_sha256: execution.executed_sha256,
      }
      fs.writeFileSync(path.join(output, 'navigation-observations.json'), JSON.stringify(report, null, 2) + '\n')
      console.log(JSON.stringify(summary))
      assert.deepEqual(summary.errors, [])
      assert.deepEqual(summary.failures, [])
    } finally {
      await browser.close()
    }
    return
  }
  process.argv = name === 'assemble-coverage'
    ? [process.execPath, filename, source]
    : [process.execPath, filename, driver, source, ...extra]
  const module = { exports: {} }
  const resolve = createRequire(filename)
  const requireProcedure = request => resolve(request)
  requireProcedure.main = module
  new Function('module', 'exports', 'require', '__dirname', '__filename', executable)(
    module, module.exports, requireProcedure, path.dirname(filename), filename,
  )
}
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
