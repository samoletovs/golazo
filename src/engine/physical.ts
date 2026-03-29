import type { AgeTier, PhysicalMeasurement, PhysicalProfile } from './types'

export type PhysicalFieldKey = keyof Omit<PhysicalMeasurement, 'measuredAt'>

export interface PhysicalFieldConfig {
  key: PhysicalFieldKey
  labelKey: string // i18n key
  unit: string
  placeholder: string
  step?: string
  min?: number
  max?: number
  group: 'body' | 'speed' | 'endurance' | 'strength' | 'skill'
  tiers: AgeTier[] // which age tiers show this field
  required?: boolean // only height/weight
}

export const PHYSICAL_FIELDS: PhysicalFieldConfig[] = [
  // ── Body ──
  {
    key: 'heightCm', labelKey: 'physical.height', unit: 'cm',
    placeholder: '150', min: 50, max: 250,
    group: 'body', tiers: ['u8', 'u12', 'u16', 'u19plus'], required: true,
  },
  {
    key: 'weightKg', labelKey: 'physical.weight', unit: 'kg',
    placeholder: '45', min: 10, max: 200, step: '0.1',
    group: 'body', tiers: ['u8', 'u12', 'u16', 'u19plus'], required: true,
  },
  {
    key: 'shoeSize', labelKey: 'physical.shoeSize', unit: 'EU',
    placeholder: '36', min: 20, max: 50, step: '0.5',
    group: 'body', tiers: ['u8', 'u12', 'u16', 'u19plus'],
  },
  {
    key: 'armSpanCm', labelKey: 'physical.armSpan', unit: 'cm',
    placeholder: '170', min: 50, max: 250,
    group: 'body', tiers: ['u16', 'u19plus'],
  },
  {
    key: 'bodyFatPct', labelKey: 'physical.bodyFat', unit: '%',
    placeholder: '15', min: 3, max: 50, step: '0.1',
    group: 'body', tiers: ['u19plus'],
  },

  // ── Speed & Power ──
  {
    key: 'sprintTime30m', labelKey: 'physical.sprint30m', unit: 'sec',
    placeholder: '5.5', step: '0.1', min: 2, max: 15,
    group: 'speed', tiers: ['u8', 'u12'],
  },
  {
    key: 'sprintTime100m', labelKey: 'physical.sprint100m', unit: 'sec',
    placeholder: '14.5', step: '0.1', min: 8, max: 30,
    group: 'speed', tiers: ['u12', 'u16', 'u19plus'],
  },
  {
    key: 'standingJumpCm', labelKey: 'physical.standingJump', unit: 'cm',
    placeholder: '180', min: 30, max: 350,
    group: 'speed', tiers: ['u12', 'u16', 'u19plus'],
  },
  {
    key: 'verticalJumpCm', labelKey: 'physical.verticalJump', unit: 'cm',
    placeholder: '40', min: 10, max: 100,
    group: 'speed', tiers: ['u16', 'u19plus'],
  },

  // ── Endurance & Agility ──
  {
    key: 'beepTestLevel', labelKey: 'physical.beepTest', unit: 'lvl',
    placeholder: '8.5', step: '0.1', min: 1, max: 21,
    group: 'endurance', tiers: ['u16', 'u19plus'],
  },
  {
    key: 'agilityCourseTime', labelKey: 'physical.agility', unit: 'sec',
    placeholder: '12.0', step: '0.1', min: 5, max: 30,
    group: 'endurance', tiers: ['u16', 'u19plus'],
  },
  {
    key: 'sitAndReachCm', labelKey: 'physical.sitAndReach', unit: 'cm',
    placeholder: '25', min: -20, max: 60,
    group: 'endurance', tiers: ['u12', 'u16', 'u19plus'],
  },
  {
    key: 'restingHeartRate', labelKey: 'physical.restingHR', unit: 'bpm',
    placeholder: '72', min: 30, max: 120,
    group: 'endurance', tiers: ['u16', 'u19plus'],
  },

  // ── Strength ──
  {
    key: 'plankTimeSec', labelKey: 'physical.plank', unit: 'sec',
    placeholder: '60', min: 1, max: 600,
    group: 'strength', tiers: ['u12', 'u16', 'u19plus'],
  },
  {
    key: 'pushUps1min', labelKey: 'physical.pushUps', unit: '×',
    placeholder: '30', min: 0, max: 200,
    group: 'strength', tiers: ['u16', 'u19plus'],
  },

  // ── Ball Control ──
  {
    key: 'juggleRecord', labelKey: 'physical.juggleRecord', unit: '×',
    placeholder: '25', min: 0, max: 10000,
    group: 'skill', tiers: ['u8', 'u12', 'u16', 'u19plus'],
  },
]

/** Get physical fields visible for a given age tier */
export function getFieldsForTier(tier: AgeTier): PhysicalFieldConfig[] {
  return PHYSICAL_FIELDS.filter((f) => f.tiers.includes(tier))
}

/** Group names for display, with i18n keys */
export const PHYSICAL_GROUPS: Record<string, { labelKey: string; emoji: string }> = {
  body: { labelKey: 'physical.groupBody', emoji: '📏' },
  speed: { labelKey: 'physical.groupSpeed', emoji: '⚡' },
  endurance: { labelKey: 'physical.groupEndurance', emoji: '🫁' },
  strength: { labelKey: 'physical.groupStrength', emoji: '💪' },
  skill: { labelKey: 'physical.groupSkill', emoji: '⚽' },
}

/** Check if a physical profile update is due (>30 days since last measurement) */
export function isPhysicalUpdateDue(measuredAt: string | undefined): boolean {
  if (!measuredAt) return true
  const last = new Date(measuredAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 30
}

/** Days since last physical measurement */
export function daysSinceLastMeasurement(measuredAt: string | undefined): number {
  if (!measuredAt) return Infinity
  const last = new Date(measuredAt)
  const now = new Date()
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}

/** Get default tracked field keys for an age tier */
export function getDefaultTrackedFields(tier: AgeTier): PhysicalFieldKey[] {
  return PHYSICAL_FIELDS.filter((f) => f.tiers.includes(tier)).map((f) => f.key)
}

/** Get field configs for the player's tracked fields (respects player choice, falls back to age tier) */
export function getTrackedFieldConfigs(physicalProfile: PhysicalProfile | null, tier: AgeTier): PhysicalFieldConfig[] {
  const tracked = physicalProfile?.trackedFields
  if (tracked && tracked.length > 0) {
    return PHYSICAL_FIELDS.filter((f) => tracked.includes(f.key))
  }
  return getFieldsForTier(tier)
}
