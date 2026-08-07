import { describe, it, expect } from 'vitest'
import {
  getFieldsForTier,
  getDefaultTrackedFields,
  getTrackedFieldConfigs,
  isPhysicalUpdateDue,
  daysSinceLastMeasurement,
  buildMeasurement,
  PHYSICAL_FIELDS,
} from '../src/engine/physical'

describe('getFieldsForTier', () => {
  it('returns only fields configured for u8 tier', () => {
    const fields = getFieldsForTier('u8')
    expect(fields.every((f) => f.tiers.includes('u8'))).toBe(true)
    expect(fields.length).toBeGreaterThan(0)
  })

  it('u19plus includes more advanced fields than u8', () => {
    const u8Fields = getFieldsForTier('u8')
    const u19Fields = getFieldsForTier('u19plus')
    expect(u19Fields.length).toBeGreaterThanOrEqual(u8Fields.length)
    expect(u19Fields.some((f) => f.key === 'bodyFatPct')).toBe(true)
    expect(u8Fields.some((f) => f.key === 'bodyFatPct')).toBe(false)
  })

  it('required fields (height/weight) are present for every tier', () => {
    for (const tier of ['u8', 'u12', 'u16', 'u19plus'] as const) {
      const fields = getFieldsForTier(tier)
      expect(fields.some((f) => f.key === 'heightCm' && f.required)).toBe(true)
      expect(fields.some((f) => f.key === 'weightKg' && f.required)).toBe(true)
    }
  })
})

describe('getDefaultTrackedFields', () => {
  it('matches the keys returned by getFieldsForTier', () => {
    const keys = getDefaultTrackedFields('u12')
    const fieldKeys = getFieldsForTier('u12').map((f) => f.key)
    expect(keys).toEqual(fieldKeys)
  })
})

describe('getTrackedFieldConfigs', () => {
  it('falls back to age tier fields when no profile provided', () => {
    const configs = getTrackedFieldConfigs(null, 'u8')
    expect(configs).toEqual(getFieldsForTier('u8'))
  })

  it('falls back to age tier fields when profile has empty trackedFields', () => {
    const configs = getTrackedFieldConfigs({ measurements: [], latestIndex: -1, trackedFields: [] }, 'u12')
    expect(configs).toEqual(getFieldsForTier('u12'))
  })

  it('respects player-chosen tracked fields when present', () => {
    const configs = getTrackedFieldConfigs(
      { measurements: [], latestIndex: -1, trackedFields: ['heightCm', 'juggleRecord'] },
      'u8',
    )
    expect(configs.map((c) => c.key).sort()).toEqual(['heightCm', 'juggleRecord'].sort())
  })
})

describe('isPhysicalUpdateDue', () => {
  it('is due when no measurement has ever been taken', () => {
    expect(isPhysicalUpdateDue(undefined)).toBe(true)
  })

  it('is not due right after a measurement', () => {
    expect(isPhysicalUpdateDue(new Date().toISOString())).toBe(false)
  })

  it('is due after 30+ days', () => {
    const past = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    expect(isPhysicalUpdateDue(past)).toBe(true)
  })

  it('is not due at 29 days', () => {
    const past = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
    expect(isPhysicalUpdateDue(past)).toBe(false)
  })
})

describe('daysSinceLastMeasurement', () => {
  it('returns Infinity when never measured', () => {
    expect(daysSinceLastMeasurement(undefined)).toBe(Infinity)
  })

  it('returns 0 for a measurement taken just now', () => {
    expect(daysSinceLastMeasurement(new Date().toISOString())).toBe(0)
  })

  it('returns correct day count for older measurements', () => {
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    expect(daysSinceLastMeasurement(past)).toBe(10)
  })
})

describe('buildMeasurement', () => {
  it('defaults height/weight to 0 when missing or invalid', () => {
    const m = buildMeasurement({})
    expect(m.heightCm).toBe(0)
    expect(m.weightKg).toBe(0)
  })

  it('parses required and optional float fields from strings', () => {
    const m = buildMeasurement({ heightCm: '150.5', weightKg: '45.2', sprintTime10m: '2.15' })
    expect(m.heightCm).toBe(150.5)
    expect(m.weightKg).toBe(45.2)
    expect(m.sprintTime10m).toBe(2.15)
  })

  it('parses integer-only fields with parseInt', () => {
    const m = buildMeasurement({ heightCm: '150', weightKg: '45', pushUps1min: '30.9' })
    expect(m.pushUps1min).toBe(30) // parseInt truncates, not rounds
  })

  it('omits optional fields that are not provided', () => {
    const m = buildMeasurement({ heightCm: '150', weightKg: '45' })
    expect(m.sprintTime10m).toBeUndefined()
    expect(m.juggleRecord).toBeUndefined()
  })

  it('sets measuredAt to a valid ISO timestamp', () => {
    const m = buildMeasurement({ heightCm: '150', weightKg: '45' })
    expect(() => new Date(m.measuredAt).toISOString()).not.toThrow()
  })

  it('every field defined in PHYSICAL_FIELDS is handled without throwing', () => {
    const values: Record<string, string> = {}
    for (const f of PHYSICAL_FIELDS) values[f.key] = '10'
    expect(() => buildMeasurement(values)).not.toThrow()
  })
})
