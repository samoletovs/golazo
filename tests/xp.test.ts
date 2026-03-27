import { describe, it, expect } from 'vitest'
import {
  levelFromXp,
  levelProgress,
  cumulativeXpForLevel,
  awardXp,
  calculateStreak,
  streakXpBonus,
  getRank,
  createInitialXpState,
  XP_AWARDS,
} from '../src/engine/xp'

describe('levelFromXp', () => {
  it('returns level 1 for 0 XP', () => {
    expect(levelFromXp(0)).toBe(1)
  })

  it('returns level 2 after 100 XP', () => {
    expect(levelFromXp(100)).toBe(2)
  })

  it('returns level 1 for 99 XP (not enough for level 2)', () => {
    expect(levelFromXp(99)).toBe(1)
  })

  it('caps at level 50', () => {
    expect(levelFromXp(999999)).toBe(50)
  })

  it('increases monotonically', () => {
    let prevLevel = 0
    for (let xp = 0; xp < 50000; xp += 500) {
      const level = levelFromXp(xp)
      expect(level).toBeGreaterThanOrEqual(prevLevel)
      prevLevel = level
    }
  })
})

describe('cumulativeXpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(cumulativeXpForLevel(1)).toBe(0)
  })

  it('returns 100 for level 2', () => {
    expect(cumulativeXpForLevel(2)).toBe(100)
  })

  it('increases with higher levels', () => {
    expect(cumulativeXpForLevel(10)).toBeGreaterThan(cumulativeXpForLevel(5))
    expect(cumulativeXpForLevel(25)).toBeGreaterThan(cumulativeXpForLevel(10))
  })
})

describe('levelProgress', () => {
  it('shows 0 progress at level boundaries', () => {
    const p = levelProgress(0)
    expect(p.currentLevelXp).toBe(0)
    expect(p.nextLevelXp).toBe(100) // XP needed for level 2
  })

  it('shows partial progress', () => {
    const p = levelProgress(50)
    expect(p.currentLevelXp).toBe(50)
    expect(p.nextLevelXp).toBe(100)
  })
})

describe('calculateStreak', () => {
  it('returns same streak for same day', () => {
    expect(calculateStreak('2024-03-15', '2024-03-15', 5)).toBe(5)
  })

  it('increments streak for consecutive day', () => {
    expect(calculateStreak('2024-03-15', '2024-03-16', 5)).toBe(6)
  })

  it('resets streak for gap > 1 day', () => {
    expect(calculateStreak('2024-03-15', '2024-03-18', 5)).toBe(1)
  })
})

describe('streakXpBonus', () => {
  it('returns 0 for 0 days', () => {
    expect(streakXpBonus(0)).toBe(0)
  })

  it('returns 5 per day', () => {
    expect(streakXpBonus(3)).toBe(15)
  })

  it('caps at 50', () => {
    expect(streakXpBonus(100)).toBe(50)
    expect(streakXpBonus(10)).toBe(50)
  })
})

describe('getRank', () => {
  it('returns rookie for level 1-10', () => {
    expect(getRank(1).key).toBe('rank.rookie')
    expect(getRank(10).key).toBe('rank.rookie')
  })

  it('returns player for level 11-20', () => {
    expect(getRank(11).key).toBe('rank.player')
    expect(getRank(20).key).toBe('rank.player')
  })

  it('returns pro for level 41-50', () => {
    expect(getRank(50).key).toBe('rank.pro')
  })
})

describe('awardXp', () => {
  it('increases total XP', () => {
    const state = createInitialXpState()
    const next = awardXp(state, 50, '2024-03-15')
    expect(next.totalXp).toBe(50)
  })

  it('levels up when threshold passed', () => {
    const state = createInitialXpState()
    const next = awardXp(state, 100, '2024-03-15')
    expect(next.level).toBe(2)
  })

  it('preserves correct XP values', () => {
    const state = createInitialXpState()
    const next = awardXp(state, XP_AWARDS.logTraining, '2024-03-15')
    expect(next.totalXp).toBe(20)
  })
})
