import type { Achievement, TrainingEntry, MatchEntry, DiaryEntry, XpState } from './types'

/* ── Achievement definitions ──────────────────────────────── */

interface AchievementDef {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  check: (ctx: AchievementContext) => boolean
}

interface AchievementContext {
  trainings: TrainingEntry[]
  matches: MatchEntry[]
  diary: DiaryEntry[]
  xp: XpState
  totalGoals: number
  totalAssists: number
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Training milestones
  { id: 'train10', nameKey: 'ach.train10', descriptionKey: 'ach.train10Desc', icon: '🏃', check: (c) => c.trainings.length >= 10 },
  { id: 'train50', nameKey: 'ach.train50', descriptionKey: 'ach.train50Desc', icon: '💪', check: (c) => c.trainings.length >= 50 },
  { id: 'train100', nameKey: 'ach.train100', descriptionKey: 'ach.train100Desc', icon: '🔥', check: (c) => c.trainings.length >= 100 },
  // Match milestones
  { id: 'match10', nameKey: 'ach.match10', descriptionKey: 'ach.match10Desc', icon: '⚽', check: (c) => c.matches.length >= 10 },
  { id: 'match50', nameKey: 'ach.match50', descriptionKey: 'ach.match50Desc', icon: '🏟️', check: (c) => c.matches.length >= 50 },
  // Goal milestones
  { id: 'goal10', nameKey: 'ach.goal10', descriptionKey: 'ach.goal10Desc', icon: '🥅', check: (c) => c.totalGoals >= 10 },
  { id: 'goal50', nameKey: 'ach.goal50', descriptionKey: 'ach.goal50Desc', icon: '⭐', check: (c) => c.totalGoals >= 50 },
  // Assist milestones
  { id: 'assist10', nameKey: 'ach.assist10', descriptionKey: 'ach.assist10Desc', icon: '🎯', check: (c) => c.totalAssists >= 10 },
  { id: 'assist25', nameKey: 'ach.assist25', descriptionKey: 'ach.assist25Desc', icon: '🤝', check: (c) => c.totalAssists >= 25 },
  // Diary milestones
  { id: 'diary5', nameKey: 'ach.diary5', descriptionKey: 'ach.diary5Desc', icon: '📝', check: (c) => c.diary.length >= 5 },
  { id: 'diary20', nameKey: 'ach.diary20', descriptionKey: 'ach.diary20Desc', icon: '📖', check: (c) => c.diary.length >= 20 },
  // XP milestones
  { id: 'xp1000', nameKey: 'ach.xp1000', descriptionKey: 'ach.xp1000Desc', icon: '💎', check: (c) => c.xp.totalXp >= 1000 },
  { id: 'xp5000', nameKey: 'ach.xp5000', descriptionKey: 'ach.xp5000Desc', icon: '👑', check: (c) => c.xp.totalXp >= 5000 },
  // Streak milestones
  { id: 'streak7', nameKey: 'ach.streak7', descriptionKey: 'ach.streak7Desc', icon: '🔥', check: (c) => c.xp.streakDays >= 7 },
  { id: 'streak30', nameKey: 'ach.streak30', descriptionKey: 'ach.streak30Desc', icon: '🏆', check: (c) => c.xp.streakDays >= 30 },
  // Level milestones
  { id: 'level10', nameKey: 'ach.level10', descriptionKey: 'ach.level10Desc', icon: '🌟', check: (c) => c.xp.level >= 10 },
  { id: 'level25', nameKey: 'ach.level25', descriptionKey: 'ach.level25Desc', icon: '💫', check: (c) => c.xp.level >= 25 },
]

/**
 * Compute which achievements are unlocked.
 * Returns the full list with unlockedAt set for newly unlocked ones.
 */
export function computeAchievements(
  existing: Achievement[],
  trainings: TrainingEntry[],
  matches: MatchEntry[],
  diary: DiaryEntry[],
  xp: XpState,
): Achievement[] {
  const now = new Date().toISOString()
  const ctx: AchievementContext = {
    trainings,
    matches,
    diary,
    xp,
    totalGoals: matches.reduce((s, m) => s + m.goals, 0),
    totalAssists: matches.reduce((s, m) => s + m.assists, 0),
  }

  const existingMap = new Map(existing.map((a) => [a.id, a]))

  return ACHIEVEMENT_DEFS.map((def) => {
    const prev = existingMap.get(def.id)
    const unlocked = def.check(ctx)

    return {
      id: def.id,
      nameKey: def.nameKey,
      descriptionKey: def.descriptionKey,
      icon: def.icon,
      unlockedAt: prev?.unlockedAt ?? (unlocked ? now : undefined),
    }
  })
}
