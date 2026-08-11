import { describe, expect, it } from 'vitest'
import { computePersonalGoalProgress, getPersonalGoalStats, updatePersonalGoalCompletions } from '../src/engine/personalGoals'
import type { DiaryEntry, MatchEntry, PersonalGoal, TrainingEntry, XpState } from '../src/engine/types'

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

function makeGoal(overrides: Partial<PersonalGoal> = {}): PersonalGoal {
  return {
    id: 'g1',
    title: 'Score 10 goals',
    metric: 'goals',
    target: 10,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('personal goals', () => {
  it('calculates progress from logged player activity', () => {
    const stats = getPersonalGoalStats(
      [makeTraining('t1'), makeTraining('t2')],
      [makeMatch('m1', 3, 1), makeMatch('m2', 4, 2)],
      [makeDiary('d1')],
      makeXp({ totalXp: 750, streakDays: 4 }),
    )

    expect(computePersonalGoalProgress(makeGoal({ metric: 'trainings', target: 3 }), stats)).toMatchObject({
      current: 2,
      target: 3,
      remaining: 1,
      completed: false,
    })
    expect(computePersonalGoalProgress(makeGoal({ metric: 'goals', target: 7 }), stats)).toMatchObject({
      current: 7,
      remaining: 0,
      completed: true,
    })
    expect(computePersonalGoalProgress(makeGoal({ metric: 'xp', target: 1000 }), stats).percent).toBe(75)
  })

  it('sets completion timestamps only when a goal reaches its target', () => {
    const stats = getPersonalGoalStats([], [makeMatch('m1', 10, 0)], [], makeXp())
    const updated = updatePersonalGoalCompletions(
      [
        makeGoal({ id: 'complete', target: 10 }),
        makeGoal({ id: 'open', target: 11 }),
      ],
      stats,
      '2024-02-01T00:00:00.000Z',
    )

    expect(updated.find(goal => goal.id === 'complete')?.completedAt).toBe('2024-02-01T00:00:00.000Z')
    expect(updated.find(goal => goal.id === 'open')?.completedAt).toBeUndefined()
  })

  it('preserves completed goals even if the current metric later drops', () => {
    const goal = makeGoal({ metric: 'streak', target: 7, completedAt: '2024-02-01T00:00:00.000Z' })
    const stats = getPersonalGoalStats([], [], [], makeXp({ streakDays: 1 }))
    const updated = updatePersonalGoalCompletions(
      [goal],
      stats,
      '2024-03-01T00:00:00.000Z',
    )

    expect(updated[0].completedAt).toBe('2024-02-01T00:00:00.000Z')
    expect(computePersonalGoalProgress(goal, stats)).toMatchObject({
      current: 1,
      percent: 100,
      remaining: 0,
      completed: true,
    })
  })
})
