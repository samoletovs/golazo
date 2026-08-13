import { beforeAll, describe, expect, it } from 'vitest'

type VitestConfig = {
  test?: {
    include?: string | readonly string[]
    environment?: string
    setupFiles?: string | readonly string[]
  }
}

function asStringArray(value: string | readonly string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? [...value] : [value]
}

async function loadVitestConfig(): Promise<VitestConfig> {
  const module = await import('../vitest.config')
  const configExport: unknown = module.default

  if (typeof configExport === 'object' && configExport !== null) {
    return configExport as VitestConfig
  }

  throw new Error('vitest.config.ts must export a config object')
}

describe('Vitest configuration', () => {
  let config: VitestConfig

  beforeAll(async () => {
    config = await loadVitestConfig()
  })

  it('discovers the repository test suite explicitly', () => {
    expect(asStringArray(config.test?.include)).toContain('tests/**/*.{test,spec}.{ts,tsx}')
  })

  it('uses the jsdom setup required by component tests', () => {
    expect(config.test?.environment).toBe('jsdom')
    expect(asStringArray(config.test?.setupFiles)).toContain('./src/test-setup.ts')
  })
})
