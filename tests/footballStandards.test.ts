import { describe, it, expect } from 'vitest'
import { addMinutesToTime, getMatchDurationRecommendation } from '../src/engine/footballStandards'

describe('getMatchDurationRecommendation', () => {
  it('returns 90 minutes when birth date is missing', () => {
    const rec = getMatchDurationRecommendation(undefined)
    expect(rec.totalMinutes).toBe(90)
    expect(rec.halfMinutes).toBe(45)
  })

  it('returns 50 minutes for U10 and younger', () => {
    const rec = getMatchDurationRecommendation('2016-09-10')
    expect(rec.totalMinutes).toBe(50)
    expect(rec.halfMinutes).toBe(25)
  })

  it('returns 60 minutes for U11-U12 players', () => {
    const rec = getMatchDurationRecommendation('2014-05-01')
    expect(rec.totalMinutes).toBe(60)
    expect(rec.halfMinutes).toBe(30)
  })
})

describe('addMinutesToTime', () => {
  it('adds minutes within same day', () => {
    expect(addMinutesToTime('18:00', 70)).toBe('19:10')
  })

  it('wraps around midnight', () => {
    expect(addMinutesToTime('23:30', 90)).toBe('01:00')
  })
})
