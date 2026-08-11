import type { DiaryEntry, MatchEntry, PersonalGoal, PersonalGoalMetric, TrainingEntry, XpState } from './types'

export interface PersonalGoalStats {
  trainings: number
  matches: number
  goals: number
  assists: number
  diary: number
  xp: number
  streak: number
}

export interface PersonalGoalProgress {
  goal: PersonalGoal
  current: number
  target: number
  percent: number
  remaining: number
  completed: boolean
}

export function getPersonalGoalStats(
  trainings: TrainingEntry[],
  matches: MatchEntry[],
  diary: DiaryEntry[],
  xp: XpState,
): PersonalGoalStats {
  return {
    trainings: trainings.length,
    matches: matches.length,
    goals: matches.reduce((sum, match) => sum + match.goals, 0),
    assists: matches.reduce((sum, match) => sum + match.assists, 0),
    diary: diary.length,
    xp: xp.totalXp,
    streak: xp.streakDays,
  }
}

export function getPersonalGoalCurrent(metric: PersonalGoalMetric, stats: PersonalGoalStats): number {
  return stats[metric]
}

export function computePersonalGoalProgress(goal: PersonalGoal, stats: PersonalGoalStats): PersonalGoalProgress {
  const target = Math.max(1, goal.target)
  const current = getPersonalGoalCurrent(goal.metric, stats)
  const completed = Boolean(goal.completedAt) || current >= target

  return {
    goal,
    current,
    target,
    percent: completed ? 100 : Math.min((current / target) * 100, 100),
    remaining: completed ? 0 : Math.max(target - current, 0),
    completed,
  }
}

export function updatePersonalGoalCompletions(
  goals: PersonalGoal[],
  stats: PersonalGoalStats,
  now = new Date().toISOString(),
): PersonalGoal[] {
  return goals.map((goal) => {
    const completed = computePersonalGoalProgress(goal, stats).completed
    if (completed && !goal.completedAt) return { ...goal, completedAt: now }
    return goal
  })
}
