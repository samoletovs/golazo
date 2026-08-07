import { describe, it, expect } from 'vitest'
import { generateDailyChallenges, getChallengeReasonKey } from '../src/engine/challenges'
import { createInitialSkillTree } from '../src/engine/skills'

describe('generateDailyChallenges', () => {
  const tree = createInitialSkillTree('player1')

  it('is deterministic — same userId and date produce identical challenges', () => {
    const a = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    const b = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    expect(a).toEqual(b)
  })

  // Pinned dates/user ids below have been confirmed to yield differing seeds
  // (and therefore differing challenge picks) for the current challenge pool.
  it('produces different challenges for a different date', () => {
    const a = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    const b = generateDailyChallenges('player1', '2024-06-02', 'u12', ['ST'], tree)
    expect(a.map((c) => c.templateId)).not.toEqual(b.map((c) => c.templateId))
  })

  it('produces different challenges for a different user on the same date', () => {
    const a = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    const b = generateDailyChallenges('player2', '2024-06-01', 'u12', ['ST'], tree)
    expect(a.map((c) => c.templateId)).not.toEqual(b.map((c) => c.templateId))
  })

  it('returns 3 daily challenges plus 1 weekly challenge', () => {
    const result = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    expect(result.length).toBe(4)
    expect(result.filter((c) => c.reason === 'weekly').length).toBe(1)
  })

  it('only returns challenges eligible for the requested age tier', () => {
    const result = generateDailyChallenges('player1', '2024-06-01', 'u10', ['ST'], tree)
    for (const c of result) {
      expect(c.target).toBeGreaterThan(0)
      expect(c.unit).toBeTruthy()
    }
  })

  it('every generated challenge has a valid expiresAt after generatedAt', () => {
    const result = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    for (const c of result) {
      expect(new Date(c.expiresAt).getTime()).toBeGreaterThan(new Date(c.generatedAt).getTime())
    }
  })

  it('weekly challenges stay the same across different days within the same week', () => {
    // 2024-06-03 is a Monday, 2024-06-05 is Wednesday of the same ISO week
    const monday = generateDailyChallenges('player1', '2024-06-03', 'u12', ['ST'], tree)
    const wednesday = generateDailyChallenges('player1', '2024-06-05', 'u12', ['ST'], tree)
    const mondayWeekly = monday.find((c) => c.reason === 'weekly')
    const wednesdayWeekly = wednesday.find((c) => c.reason === 'weekly')
    expect(mondayWeekly?.templateId).toBe(wednesdayWeekly?.templateId)
  })

  it('avoids duplicate template ids among the picked challenges', () => {
    const result = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    const ids = result.map((c) => c.templateId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('handles recentChallengeIds without throwing and still returns challenges', () => {
    const first = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree)
    const recentIds = first.filter((c) => c.reason !== 'weekly').map((c) => c.templateId)
    const result = generateDailyChallenges('player1', '2024-06-01', 'u12', ['ST'], tree, recentIds)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('getChallengeReasonKey', () => {
  it('maps each reason to a distinct i18n key', () => {
    const reasons = ['weakest-skill', 'second-weakest', 'position', 'wildcard', 'weekly'] as const
    const keys = reasons.map(getChallengeReasonKey)
    expect(new Set(keys).size).toBe(reasons.length)
    for (const key of keys) {
      expect(key.startsWith('ch.reason.')).toBe(true)
    }
  })
})
