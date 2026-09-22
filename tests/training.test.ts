import { describe, expect, it } from 'vitest'
import { prepareTrainingSave, trainingSummary } from '../src/engine/training'
import { createInitialXpState, awardXp, XP_AWARDS } from '../src/engine/xp'
import { getAgeTier } from '../src/engine/types'
import type { PlayerProfile, TrainingEntry } from '../src/engine/types'

const profile: PlayerProfile = {
  id: 'synthetic-player', familyId: 'fixture', role: 'player', name: 'Alex',
  birthDate: '2014-04-01', team: 'Fictional club', positions: ['CM'],
  dominantFoot: 'right', language: 'en', createdAt: '2026-09-22',
}
const entry: TrainingEntry = {
  id: 'training-fixture', playerId: profile.id, date: '2026-09-22', type: 'team',
  durationMinutes: 60, focusAreas: ['technical'], energy: 3, mood: 4,
  notes: 'Synthetic reflection', exerciseIds: [], fromSchedule: 'fixture-schedule', createdAt: '2026-09-22',
}

describe('transactional training preparation', () => {
  it.each(['2020-01-01', '2014-04-01', '2000-01-01'])('preserves real age-scaled XP rules for birth date %s', birthDate => {
    const xp = createInitialXpState()
    const actual = prepareTrainingSave({ profile: { ...profile, birthDate }, xp, trainings: [] }, entry)
    expect(actual.xp).toEqual(awardXp(xp, XP_AWARDS.logTraining, entry.date, getAgeTier(birthDate)))
    expect(actual.receipt.awardedXp).toBe(actual.xp.totalXp - xp.totalXp)
    expect(actual.trainings).toEqual([entry])
  })
  it('repeated submission of an entry awards nothing a second time', () => {
    const first = prepareTrainingSave({ profile, xp: createInitialXpState(), trainings: [] }, entry)
    const retry = prepareTrainingSave({ profile, ...first }, entry)
    expect(retry.trainings).toHaveLength(1)
    expect(retry.xp).toEqual(first.xp)
    expect(retry.receipt.awardedXp).toBe(0)
    expect(retry.receipt.alreadySaved).toBe(true)
  })
  it('reopening the same scheduled session cannot create another entry or reward', () => {
    const first = prepareTrainingSave({ profile, xp: createInitialXpState(), trainings: [] }, entry)
    const retry = prepareTrainingSave({ profile, ...first }, { ...entry, id: 'different-form-instance' })
    expect(retry.receipt.entry.id).toBe(entry.id)
    expect(retry.trainings).toHaveLength(1)
    expect(retry.receipt.awardedXp).toBe(0)
  })
  it('allows genuinely separate manual sessions on the same date', () => {
    const first = prepareTrainingSave({ profile, xp: createInitialXpState(), trainings: [] }, { ...entry, fromSchedule: undefined })
    const second = prepareTrainingSave({ profile, ...first }, { ...entry, id: 'second', fromSchedule: undefined })
    expect(second.trainings).toHaveLength(2)
    expect(second.receipt.awardedXp).toBe(20)
  })
  it('counts seven calendar days, including today, rather than an eight-day window', () => {
    const entries = ['2026-09-15', '2026-09-16', '2026-09-22', '2026-09-23'].map(date => ({ ...entry, id: date, date }))
    expect(trainingSummary(entries, '2026-09-22')).toEqual({ sessions: 2, minutes: 120 })
    expect(trainingSummary([], '2026-09-22')).toEqual({ sessions: 0, minutes: 0 })
  })
})
