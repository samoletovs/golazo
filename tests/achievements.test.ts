import { describe, it, expect } from 'vitest'
import { computeAchievements, ACHIEVEMENT_DEFS } from '../src/engine/achievements'
import type { TrainingEntry, MatchEntry, DiaryEntry, XpState } from '../src/engine/types'

function makeXp(overrides: Partial<XpState> = {}): XpState {
  return {
    totalXp: 0,
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: 100,
    streakDays: 0,
    lastActivityDate: '2024-01-01',
    checkInStreakDays: 0,
    lastCheckInDate: '2024-01-01',
    ...overrides,
  }
}

function makeTraining(id: string): TrainingEntry {
  return {
    id,
    playerId: 'p1',
    date: '2024-01-01',
    type: 'team',
    durationMinutes: 60,
    focusAreas: ['technical'],
    energy: 3,
    mood: 3,
    notes: '',
    exerciseIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeMatch(id: string, goals: number, assists: number): MatchEntry {
  return {
    id,
    playerId: 'p1',
    date: '2024-01-01',
    opponent: 'Rivals',
    competition: 'League',
    scoreUs: 2,
    scoreThem: 1,
    position: 'ST',
    minutesPlayed: 90,
    goals,
    assists,
    shots: 3,
    keyPasses: 1,
    tackles: 0,
    selfRating: 7,
    bestMoment: '',
    toImprove: '',
    mood: 4,
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeDiary(id: string): DiaryEntry {
  return {
    id,
    playerId: 'p1',
    date: '2024-01-01',
    text: 'Great day',
    mood: 4,
    promptsUsed: [],
    linkedTrainingIds: [],
    linkedMatchIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('computeAchievements', () => {
  it('returns all achievement defs, none unlocked when no activity', () => {
    const result = computeAchievements([], [], [], [], makeXp())
    expect(result.length).toBe(ACHIEVEMENT_DEFS.length)
    for (const a of result) {
      expect(a.unlockedAt).toBeUndefined()
    }
  })

  it('unlocks train10 exactly at 10 trainings, not at 9', () => {
    const nineTrainings = Array.from({ length: 9 }, (_, i) => makeTraining(`t${i}`))
    const under = computeAchievements([], nineTrainings, [], [], makeXp())
    expect(under.find((a) => a.id === 'train10')?.unlockedAt).toBeUndefined()

    const tenTrainings = Array.from({ length: 10 }, (_, i) => makeTraining(`t${i}`))
    const at = computeAchievements([], tenTrainings, [], [], makeXp())
    expect(at.find((a) => a.id === 'train10')?.unlockedAt).toBeDefined()
  })

  it('sums goals and assists across matches for goal/assist achievements', () => {
    const matches = [makeMatch('m1', 6, 3), makeMatch('m2', 5, 8)]
    const result = computeAchievements([], [], matches, [], makeXp())
    // total goals = 11, total assists = 11
    expect(result.find((a) => a.id === 'goal10')?.unlockedAt).toBeDefined()
    expect(result.find((a) => a.id === 'goal50')?.unlockedAt).toBeUndefined()
    expect(result.find((a) => a.id === 'assist10')?.unlockedAt).toBeDefined()
  })

  it('unlocks diary achievements based on diary length', () => {
    const diary = Array.from({ length: 5 }, (_, i) => makeDiary(`d${i}`))
    const result = computeAchievements([], [], [], diary, makeXp())
    expect(result.find((a) => a.id === 'diary5')?.unlockedAt).toBeDefined()
    expect(result.find((a) => a.id === 'diary20')?.unlockedAt).toBeUndefined()
  })

  it('unlocks xp and level achievements from xp state', () => {
    const result = computeAchievements([], [], [], [], makeXp({ totalXp: 1000, level: 10, streakDays: 7 }))
    expect(result.find((a) => a.id === 'xp1000')?.unlockedAt).toBeDefined()
    expect(result.find((a) => a.id === 'xp5000')?.unlockedAt).toBeUndefined()
    expect(result.find((a) => a.id === 'level10')?.unlockedAt).toBeDefined()
    expect(result.find((a) => a.id === 'streak7')?.unlockedAt).toBeDefined()
    expect(result.find((a) => a.id === 'streak30')?.unlockedAt).toBeUndefined()
  })

  it('preserves the original unlockedAt timestamp for already-unlocked achievements', () => {
    const existing = [
      { id: 'train10', nameKey: 'ach.train10', descriptionKey: 'ach.train10Desc', icon: '🏃', unlockedAt: '2020-01-01T00:00:00.000Z' },
    ]
    const trainings = Array.from({ length: 12 }, (_, i) => makeTraining(`t${i}`))
    const result = computeAchievements(existing, trainings, [], [], makeXp())
    expect(result.find((a) => a.id === 'train10')?.unlockedAt).toBe('2020-01-01T00:00:00.000Z')
  })

  it('does not unlock an achievement that was never previously unlocked and is still not met, even if listed in existing', () => {
    const existing = [
      { id: 'train50', nameKey: 'ach.train50', descriptionKey: 'ach.train50Desc', icon: '💪', unlockedAt: undefined },
    ]
    const result = computeAchievements(existing, [], [], [], makeXp())
    expect(result.find((a) => a.id === 'train50')?.unlockedAt).toBeUndefined()
  })
})
