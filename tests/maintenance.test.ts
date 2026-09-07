// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { EventEmitter } from 'node:events'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import vm from 'node:vm'

const maintenanceDir = path.resolve('scripts', 'maintenance')
const fixtureRoot = path.resolve('tests', 'fixtures', 'maintenance')
const environment = { GITHUB_RUN_ID: 'current-run', GITHUB_RUN_ATTEMPT: '2', GITHUB_SHA: 'current-sha' }
const config = {
  dataDir: path.join(fixtureRoot, 'data'),
  srcDir: path.join(fixtureRoot, 'src'),
  i18nDir: path.join(fixtureRoot, 'i18n'),
  dryRun: true,
  verbose: false,
  youtubeApiKey: 'offline-fixture-key',
  youtubeSafeSearch: 'strict',
  youtubeMaxResultsPerQuery: 5,
  youtubeChannelWhitelist: ['approved-channel'],
  youtubeTimeoutMs: 100,
  federationDelay: 0,
  federationSources: {
    EE: [{ id: 89, name: 'U-19 Eliitliiga', slug: 'u-19-eliitliiga', url: 'https://jalgpall.ee/voistlused/noored/89/u-19-eliitliiga' }],
    LV_GOV: '',
    LT: [{ name: 'A Lyga', url: 'https://www.toplyga.lt' }],
  },
}

interface TaskResult { added: number; updated: number; skipped: number; errors: string[] }
interface Video { videoId: string; channelTitle: string }
interface Report {
  runId: string
  runAttempt: string
  sourceSha: string
  mode: string
  discoveryCount: number | null
  tasks: Record<string, TaskResult>
  summary: { totalAdded: number; totalErrors: number }
}
const emptyResult = (): TaskResult => ({ added: 0, updated: 0, skipped: 0, errors: [] })
const missingTask = async (_config: typeof config): Promise<TaskResult> => { throw new Error('Task export missing') }
const missingSearch = async (_query: string, _config: typeof config): Promise<Video | null> => { throw new Error('Search export missing') }
const missingMain = async (_config: typeof config): Promise<void> => { throw new Error('Main export missing') }
const missingSummary = (_report: Report, _env: typeof environment): string => { throw new Error('Summary export missing') }

function memoryFiles(generated: object[] = []) {
  const files = new Map([
    [path.join(config.dataDir, 'exercises-generated.json'), JSON.stringify(generated)],
    [path.join(config.dataDir, 'exercise-videos.json'), '{}'],
    [path.join(config.dataDir, 'federation-discoveries.json'), '[]'],
    [path.join(config.srcDir, 'data', 'exercises.ts'), ''],
    [path.join(config.i18nDir, 'en.json'), '{}'],
    ...['lv', 'lt', 'ee'].map(country => [path.join(config.dataDir, `teams-${country}.json`), '[]'] as const),
  ])
  const fs = {
    existsSync: (file: string) => files.has(file),
    readFileSync: (file: string) => {
      const text = files.get(file)
      if (text === undefined) throw new Error(`Unexpected fixture read: ${file}`)
      return text
    },
    writeFileSync: vi.fn((file: string, text: string) => { files.set(file, text) }),
    readdirSync: vi.fn(() => [] as string[]),
  }
  return { files, fs }
}

function loadModule<T>(file: string, initialExports: T, mocks: Record<string, unknown> = {}) {
  const module = { exports: initialExports }
  const filename = path.join(maintenanceDir, file)
  const processState = { env: environment, argv: [], exitCode: 0, exit: vi.fn() }
  const require = (name: string) => {
    if (name === 'path') return path
    if (name in mocks) return mocks[name]
    throw new Error(`Unmocked dependency (real I/O forbidden): ${name}`)
  }
  vm.runInNewContext(readFileSync(filename, 'utf8'), {
    require, module, __dirname: path.dirname(filename), process: processState,
    URL, URLSearchParams, setTimeout, clearTimeout, console: { log: vi.fn(), error: vi.fn() },
  }, { filename })
  return { exports: module.exports, processState }
}

interface Reply { status?: number; body?: unknown; hang?: boolean; location?: string; networkError?: boolean }
function httpFixture(replies: Reply[]) {
  const urls: string[] = []
  const get = (url: string, optionsOrCallback: unknown, callback?: (response: EventEmitter) => void) => {
    const onResponse = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback
    if (!onResponse) throw new Error('Missing HTTP response callback')
    const reply = replies[Math.min(urls.length, replies.length - 1)]
    if (!reply) throw new Error('Unexpected HTTP request')
    urls.push(url)
    const request = Object.assign(new EventEmitter(), {
      destroy(error = new Error('Destroyed')) { request.emit('error', error) },
    })
    queueMicrotask(() => {
      if (reply.hang) return
      if (reply.networkError) { request.emit('error', new Error(`Network failed: ${url}`)); return }
      const response = Object.assign(new EventEmitter(), {
        statusCode: reply.status ?? 200,
        headers: reply.location ? { location: reply.location } : {},
        resume: vi.fn(),
      })
      onResponse(response)
      response.emit('data', typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body ?? { items: [] }))
      response.emit('end')
    })
    return request
  }
  return { client: { get }, urls }
}

async function flush<T>(promise: Promise<T>): Promise<T> {
  const outcome = promise.then(value => () => value, error => () => { throw error })
  await vi.runAllTimersAsync()
  return (await outcome)()
}

const goodVideo = {
  items: [{ id: { videoId: 'fixture-video' }, snippet: {
    title: 'Fixture drill', channelId: 'approved-channel', channelTitle: 'Fixture coach', thumbnails: {},
  } }],
}
const invalidKey: Reply = {
  status: 400,
  body: { error: { message: `Do not log ${config.youtubeApiKey}`, details: [{ reason: 'API_KEY_INVALID' }] } },
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('maintenance YouTube failure recovery', () => {
  it('stops one invalid credential from causing 39 requests while preserving every affected exercise', async () => {
    const { fs } = memoryFiles(Array.from({ length: 29 }, (_, i) => ({
      id: `fixture-${i}`, nameEn: 'Fixture drill', descEn: 'Fixture instructions',
    })))
    const http = httpFixture([invalidKey])
    const task = loadModule('tasks/exercise-registry.cjs', { run: missingTask }, { fs, https: http.client }).exports
    const result = await flush(task.run(config))
    expect(http.urls).toHaveLength(1)
    expect(result.errors).toHaveLength(39)
    expect(result.errors.join('\n')).toContain('fixture-28')
    expect(result.errors.filter(error => error.includes('gen-'))).toHaveLength(10)
    expect(result.errors.join('\n')).toContain('API_KEY_INVALID')
    expect(result.errors.join('\n')).not.toContain(config.youtubeApiKey)
    expect(result.updated).toBe(0)
    expect(result.added).toBe(10)
    expect(fs.writeFileSync).not.toHaveBeenCalled()
  })

  it('reports creation-phase failures even when there is nothing to enrich', async () => {
    const { fs } = memoryFiles()
    const http = httpFixture([invalidKey])
    const task = loadModule('tasks/exercise-registry.cjs', { run: missingTask }, { fs, https: http.client }).exports
    const result = await flush(task.run(config))
    expect(result.errors).toHaveLength(10)
    expect(http.urls).toHaveLength(1)
  })

  it('does not retry daily quota exhaustion', async () => {
    const http = httpFixture([{ status: 403, body: { error: { errors: [{ reason: 'quotaExceeded' }] } } }])
    const task = loadModule('tasks/exercise-registry.cjs', { searchYouTube: missingSearch }, { fs: {}, https: http.client }).exports
    await expect(flush(task.searchYouTube('fixture', config))).rejects.toMatchObject({ code: 'quotaExceeded' })
    expect(http.urls).toHaveLength(1)
  })

  it('recovers from a transient server failure with a bounded retry', async () => {
    const http = httpFixture([{ status: 503, body: 'Unavailable' }, { body: goodVideo }])
    const task = loadModule('tasks/exercise-registry.cjs', { searchYouTube: missingSearch }, { fs: {}, https: http.client }).exports
    expect(await flush(task.searchYouTube('fixture', config))).toMatchObject({ videoId: 'fixture-video' })
    expect(http.urls).toHaveLength(2)
  })

  it.each([
    { label: 'server failures', reply: { status: 503, body: 'Unavailable' } },
    { label: 'request timeouts', reply: { hang: true } },
    { label: 'transport errors', reply: { networkError: true } },
  ])('limits $label to three attempts without leaking request URLs', async ({ reply }) => {
    const http = httpFixture([reply])
    const task = loadModule('tasks/exercise-registry.cjs', { searchYouTube: missingSearch }, { fs: {}, https: http.client }).exports
    await expect(flush(task.searchYouTube('fixture', config))).rejects.toMatchObject({ stopBatch: true, retryable: true })
    expect(http.urls).toHaveLength(3)
  })

  it('does not overwrite malformed existing generated data', async () => {
    const { fs, files } = memoryFiles()
    files.set(path.join(config.dataDir, 'exercises-generated.json'), '{broken')
    const http = httpFixture([invalidKey])
    const task = loadModule('tasks/exercise-registry.cjs', { run: missingTask }, { fs, https: http.client }).exports
    const result = await flush(task.run({ ...config, dryRun: false }))
    expect(result.errors).toEqual(['Failed to parse exercises-generated.json — leaving existing data untouched'])
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(http.urls).toHaveLength(0)
  })

  it('does not overwrite malformed existing video mappings', async () => {
    const { fs, files } = memoryFiles()
    files.set(path.join(config.dataDir, 'exercise-videos.json'), '{broken')
    const http = httpFixture([invalidKey])
    const task = loadModule('tasks/exercise-registry.cjs', { run: missingTask }, { fs, https: http.client }).exports
    const result = await flush(task.run({ ...config, dryRun: false }))
    expect(result.errors).toEqual(['Failed to parse exercise-videos.json — leaving existing data untouched'])
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(http.urls).toHaveLength(0)
  })

  it('reuses an existing mapping instead of re-querying a generated exercise', async () => {
    const { fs, files } = memoryFiles([{ id: 'fixture-cached', nameEn: 'Previously mapped', descEn: 'Fixture instructions' }])
    files.set(path.join(config.dataDir, 'exercise-videos.json'), JSON.stringify({
      'fixture-cached': { videoUrl: 'https://www.youtube.com/watch?v=cached' },
    }))
    const http = httpFixture([{ body: goodVideo }])
    const task = loadModule('tasks/exercise-registry.cjs', { run: missingTask }, { fs, https: http.client }).exports
    const result = await flush(task.run({ ...config, dryRun: false }))
    expect(http.urls).toHaveLength(10)
    expect(http.urls.some(url => url.includes('Previously'))).toBe(false)
    expect(result.errors).toEqual([])
    expect(files.get(path.join(config.dataDir, 'exercises-generated.json'))).toContain('watch?v=cached')
  })
})

describe('current-run maintenance reporting', () => {
  function report(): Report {
    return {
      runId: environment.GITHUB_RUN_ID, runAttempt: environment.GITHUB_RUN_ATTEMPT,
      sourceSha: environment.GITHUB_SHA, mode: 'live', discoveryCount: 108,
      summary: { totalAdded: 10, totalErrors: 52 },
      tasks: {
        'exercise-registry': { ...emptyResult(), added: 10, errors: Array(39).fill('Video failed') },
        'team-registry': { ...emptyResult(), errors: Array(11).fill('Missing color') },
        'i18n-completeness': { ...emptyResult(), errors: Array(2).fill('Coverage below threshold') },
      },
    }
  }

  it('keeps the current 52-error summary when PR creation restores the previous 42-error report', () => {
    const { buildSummary } = loadModule('summary.cjs', { buildSummary: missingSummary }, { fs: {} }).exports
    let checkoutReport = report()
    const captured = buildSummary(checkoutReport, environment)
    checkoutReport = { ...report(), runId: 'last-week', summary: { totalAdded: 10, totalErrors: 42 } }
    expect(captured).toContain('52 errors')
    expect(captured).toContain('10 exercises, 0 new discoveries')
    expect(() => buildSummary(checkoutReport, environment)).toThrow('stale report')
    const workflow = readFileSync('.github/workflows/maintenance.yml', 'utf8')
    expect(workflow.indexOf('id: summary')).toBeLessThan(workflow.indexOf('id: pr'))
    expect(workflow).toContain("if: always() && steps.summary.outcome == 'success'")
  })

  it.each([
    { runAttempt: '1' }, { sourceSha: 'old-sha' }, { mode: 'dry-run' },
  ])('rejects reports from another attempt, checkout, or dry run: %j', override => {
    const { buildSummary } = loadModule('summary.cjs', { buildSummary: missingSummary }, { fs: {} }).exports
    expect(() => buildSummary({ ...report(), ...override }, environment)).toThrow('stale report')
  })

  it('rejects totals that omit task failures', () => {
    const { buildSummary } = loadModule('summary.cjs', { buildSummary: missingSummary }, { fs: {} }).exports
    const incomplete = report()
    incomplete.summary.totalErrors = 42
    expect(() => buildSummary(incomplete, environment)).toThrow('does not match')
  })

  it('fails on returned task errors but still runs later tasks and writes the current report', async () => {
    const { fs, files } = memoryFiles()
    fs.readdirSync.mockReturnValue(['i18n.cjs', 'exercise.cjs'])
    const laterTask = vi.fn(async () => emptyResult())
    const task = loadModule('maintain.cjs', { main: missingMain }, {
      fs,
      [path.join(maintenanceDir, 'tasks', 'i18n.cjs')]: {
        name: 'i18n-completeness', run: async () => ({ ...emptyResult(), errors: ['Coverage below threshold'] }),
      },
      [path.join(maintenanceDir, 'tasks', 'exercise.cjs')]: { name: 'exercise-registry', run: laterTask },
    })
    await task.exports.main({ ...config, dryRun: false })
    expect(task.processState.exitCode).toBe(1)
    expect(laterTask).toHaveBeenCalledOnce()
    const saved = files.get(path.join(config.dataDir, 'maintenance-report.json'))
    expect(saved).toContain('"totalErrors": 1')
    expect(saved).toContain('"runId": "current-run"')
    expect(saved).toContain('"runAttempt": "2"')
    expect(saved).toContain('"sourceSha": "current-sha"')
  })

  it('archives successful independent task outputs without publishing a failed maintenance PR', async () => {
    const { fs, files } = memoryFiles()
    fs.readdirSync.mockReturnValue(['i18n.cjs', 'exercise.cjs'])
    const generatedOutputs = [
      'data/exercises-generated.json', 'data/exercise-videos.json', 'data/federation-discoveries.json',
      'data/teams-lv.json', 'data/teams-ee.json', 'data/teams-lt.json', 'data/content-queue.json',
      'data/team-health-report.json', 'src/data/articles.ts', 'src/data/quizzes.ts',
      'src/data/quotes.ts', 'src/data/exercises.ts', 'src/i18n/en.json', 'src/i18n/ru.json',
      'src/i18n/lv.json', 'src/i18n/es.json', 'src/i18n/et.json', 'src/i18n/lt.json',
    ]
    const task = loadModule('maintain.cjs', { main: missingMain }, {
      fs,
      [path.join(maintenanceDir, 'tasks', 'i18n.cjs')]: {
        name: 'i18n-completeness', run: async () => ({ ...emptyResult(), errors: ['Coverage below threshold'] }),
      },
      [path.join(maintenanceDir, 'tasks', 'exercise.cjs')]: {
        name: 'exercise-registry',
        run: async () => {
          fs.writeFileSync(path.join(config.dataDir, 'exercises-generated.json'), '[{"id":"fixture-new"}]')
          fs.writeFileSync(path.join(config.dataDir, 'exercise-videos.json'), '{"fixture-new":{"videoUrl":"fixture-video"}}')
          return { ...emptyResult(), added: 1 }
        },
      },
    })
    await task.exports.main({ ...config, dryRun: false })
    expect(task.processState.exitCode).toBe(1)
    expect(files.get(path.join(config.dataDir, 'exercises-generated.json'))).toContain('fixture-new')

    const workflow = readFileSync('.github/workflows/maintenance.yml', 'utf8')
    const artifactStep = workflow.match(/      - name: Preserve generated maintenance outputs\r?\n([\s\S]*?)(?=\r?\n      - name:)/)?.[1]
    expect(artifactStep).toBeDefined()
    expect(artifactStep).toContain("if: always() && (steps.pipeline.outcome == 'success' || steps.pipeline.outcome == 'failure')")
    expect(artifactStep).toContain('uses: actions/upload-artifact@v4')
    const retainedPaths = artifactStep?.match(/          path: \|\r?\n((?:            .+\r?\n)+)/)?.[1]
      .trim().split('\n').map(line => line.trim())
    expect(retainedPaths).toEqual(generatedOutputs)
    expect(retainedPaths).not.toContain('data/maintenance-report.json')
    expect(workflow.indexOf('name: Preserve generated maintenance outputs')).toBeLessThan(workflow.indexOf('id: pr'))
    const prStep = workflow.match(/      - name: Create PR with discoveries\r?\n([\s\S]*?)(?=\r?\n      - name:)/)?.[1]
    expect(prStep).toContain("if: success() && steps.pipeline.outcome == 'success' && steps.changes.outputs.changed == 'true'")
  })

  it.each(['{}', '{invalid', null])('preserves collected task errors when discovery counts cannot be read: %j', async contents => {
    const { fs, files } = memoryFiles()
    const discoveriesPath = path.join(config.dataDir, 'federation-discoveries.json')
    if (contents === null) files.delete(discoveriesPath)
    else files.set(discoveriesPath, contents)
    fs.readdirSync.mockReturnValue(['i18n.cjs'])
    const task = loadModule('maintain.cjs', { main: missingMain }, {
      fs,
      [path.join(maintenanceDir, 'tasks', 'i18n.cjs')]: {
        name: 'i18n-completeness', run: async () => ({ ...emptyResult(), errors: ['Coverage below threshold'] }),
      },
    })
    await task.exports.main({ ...config, dryRun: false })
    expect(task.processState.exitCode).toBe(1)
    expect(fs.writeFileSync).toHaveBeenCalledOnce()
    const serialized = files.get(path.join(config.dataDir, 'maintenance-report.json'))
    expect(serialized).toBeDefined()
    if (!serialized) throw new Error('Current report was not preserved')
    const saved: Report = JSON.parse(serialized)
    expect(saved.discoveryCount).toBeNull()
    expect(saved.tasks['i18n-completeness'].errors).toEqual(['Coverage below threshold'])
    expect(saved.tasks['maintenance-report'].errors).toEqual([expect.stringContaining('Unable to count federation discoveries')])
    expect(saved.summary.totalErrors).toBe(2)
    const { buildSummary } = loadModule('summary.cjs', { buildSummary: missingSummary }, { fs: {} }).exports
    expect(buildSummary(saved, environment)).toContain('2 errors, unknown total discoveries')
  })

  it('fails when discovery counting is the only error, while still serializing the report', async () => {
    const { fs, files } = memoryFiles()
    files.set(path.join(config.dataDir, 'federation-discoveries.json'), '{}')
    fs.readdirSync.mockReturnValue(['exercise.cjs'])
    const task = loadModule('maintain.cjs', { main: missingMain }, {
      fs,
      [path.join(maintenanceDir, 'tasks', 'exercise.cjs')]: { name: 'exercise-registry', run: async () => emptyResult() },
    })
    await task.exports.main({ ...config, dryRun: false })
    expect(task.processState.exitCode).toBe(1)
    expect(files.get(path.join(config.dataDir, 'maintenance-report.json'))).toContain('"totalErrors": 1')
  })

  it('keeps a successful pipeline successful and writes its report', async () => {
    const { fs, files } = memoryFiles()
    fs.readdirSync.mockReturnValue(['exercise.cjs'])
    const task = loadModule('maintain.cjs', { main: missingMain }, {
      fs,
      [path.join(maintenanceDir, 'tasks', 'exercise.cjs')]: { name: 'exercise-registry', run: async () => emptyResult() },
    })
    await task.exports.main({ ...config, dryRun: false })
    expect(task.processState.exitCode).toBe(0)
    expect(files.get(path.join(config.dataDir, 'maintenance-report.json'))).toContain('"totalErrors": 0')
  })
})

describe('federation source failures', () => {
  it('uses the configured youth route and preserves discoveries from healthy sources after a 404', async () => {
    const { fs } = memoryFiles()
    const http = httpFixture([
      { status: 404, body: 'Missing source' },
      { body: '<a href="/wiki/FC_Fixture" title="FC Fixture">FC Fixture</a>' },
      { body: '' }, { body: '' },
    ])
    const task = loadModule('tasks/federation-scanner.cjs', { run: missingTask }, { fs, https: http.client, http: http.client }).exports
    const result = await flush(task.run(config))
    expect(http.urls[0]).toBe('https://jalgpall.ee/voistlused/noored/89/u-19-eliitliiga')
    expect(result.errors).toEqual([expect.stringContaining('EE/U-19 Eliitliiga: HTTP 404')])
    expect(result.added).toBe(1)
    expect(fs.writeFileSync).not.toHaveBeenCalled()
    const actualConfig = loadModule('config.cjs', config, { fs }).exports
    expect(actualConfig.federationSources.EE.find(league => league.id === 89)?.url).toBe(config.federationSources.EE[0].url)
  })

  it('follows relative redirects but stops a redirect loop after three hops', async () => {
    const { fs } = memoryFiles()
    const http = httpFixture([{ status: 302, location: '/loop' }])
    const task = loadModule('tasks/federation-scanner.cjs', { run: missingTask }, { fs, https: http.client, http: http.client }).exports
    const result = await flush(task.run(config))
    expect(result.errors).toHaveLength(4)
    expect(result.errors.every(error => error.includes('Too many redirects'))).toBe(true)
    expect(http.urls).toHaveLength(16)
    expect(http.urls[1]).toBe('https://jalgpall.ee/loop')
  })
})

describe('maintenance notification error handling (stubbed curl, no sends)', () => {
  it.each([0, 22])('preserves curl outcome %i and suppresses response bodies', status => {
    const bash = process.platform === 'win32'
      ? path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'bin', 'bash.exe')
      : 'bash'
    const sender = path.resolve('scripts', 'notify-telegram.sh')
    const result = spawnSync(bash, [
      '-c',
      `curl() { printf 'response-body-must-not-be-logged'; return ${status}; }; . "$1" --plain "fixture report"`,
      'offline-notification-test', sender,
    ], {
      encoding: 'utf8',
      env: { ...process.env, NAURO_BOT_TOKEN: 'offline-fixture-token', NAURO_CHAT_ID: 'offline-fixture-chat' },
      timeout: 10000,
    })
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(status === 0 ? 0 : 2)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe(status === 0 ? '' : 'notify-telegram: send failed\n')
    const workflow = readFileSync('.github/workflows/maintenance.yml', 'utf8')
    expect(workflow).not.toContain('|| echo "::warning::Telegram notification failed"')
    expect(workflow).not.toContain('api.telegram.org')
  })
})
