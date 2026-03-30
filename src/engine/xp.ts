import type { XpState } from './types'

/* ── Level thresholds ─────────────────────────────────────── */

/** XP required for each level (cumulative). Level 1 = 0 XP, Level 2 = 100, etc. */
function xpForLevel(level: number): number {
  if (level <= 1) return 0
  // Gentle curve: each level needs ~15% more XP than the previous
  // Level 2: 100, Level 10: ~700, Level 25: ~3500, Level 50: ~20000
  return Math.floor(100 * Math.pow(1.12, level - 2))
}

/** Total cumulative XP needed to reach a given level */
export function cumulativeXpForLevel(level: number): number {
  let total = 0
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i)
  }
  return total
}

/** Calculate level from total XP */
export function levelFromXp(totalXp: number): number {
  let level = 1
  let remaining = totalXp
  while (level < 50) {
    const needed = xpForLevel(level + 1)
    if (remaining < needed) break
    remaining -= needed
    level++
  }
  return level
}

/** XP within current level and XP needed for next level */
export function levelProgress(totalXp: number): { currentLevelXp: number; nextLevelXp: number } {
  const level = levelFromXp(totalXp)
  if (level >= 50) return { currentLevelXp: 0, nextLevelXp: 1 }
  const cumCurrent = cumulativeXpForLevel(level)
  const needed = xpForLevel(level + 1)
  return {
    currentLevelXp: totalXp - cumCurrent,
    nextLevelXp: needed,
  }
}

/* ── XP Awards ────────────────────────────────────────────── */

export const XP_AWARDS = {
  logTraining: 20,
  logMatch: 30,
  logTournamentMatch: 35,
  completeTournament: 50,
  diaryEntry: 15,
  dailyChallenge: 25,
  weeklyChallenge: 100,
  completeExercise: 10,
  quizCorrect: 5,
  growthXp: 10, // logging bad match + writing improvement
  streakBonus: 5, // per consecutive day, capped
  streakBonusCap: 50,
  dailyCheckIn: 10,
  morningRoutineBonus: 15, // bonus for completing full check-in + challenge + quiz
} as const

/* ── Rank names (RU primary, translatable via i18n) ────── */

export const RANKS = [
  { minLevel: 1, maxLevel: 10, key: 'rank.rookie', color: 'bronze' },
  { minLevel: 11, maxLevel: 20, key: 'rank.amateur', color: 'silver' },
  { minLevel: 21, maxLevel: 30, key: 'rank.semiPro', color: 'gold' },
  { minLevel: 31, maxLevel: 40, key: 'rank.pro', color: 'diamond' },
  { minLevel: 41, maxLevel: 50, key: 'rank.elite', color: 'platinum' },
] as const

export function getRank(level: number) {
  return RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel) ?? RANKS[0]
}

/* ── Streak calculation ───────────────────────────────────── */

export function calculateStreak(lastActivityDate: string, today: string, currentStreak: number): number {
  const last = new Date(lastActivityDate)
  const now = new Date(today)
  const diffMs = now.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return currentStreak // same day
  if (diffDays === 1) return currentStreak + 1 // consecutive
  return 1 // streak broken, start new
}

export function streakXpBonus(streakDays: number): number {
  return Math.min(streakDays * XP_AWARDS.streakBonus, XP_AWARDS.streakBonusCap)
}

/* ── Award XP and recalculate state ───────────────────────── */

export function awardXp(state: XpState, xpAmount: number, today: string): XpState {
  const newTotalXp = state.totalXp + xpAmount
  const newLevel = levelFromXp(newTotalXp)
  const progress = levelProgress(newTotalXp)
  const newStreak = calculateStreak(state.lastActivityDate, today, state.streakDays)

  return {
    totalXp: newTotalXp,
    level: newLevel,
    currentLevelXp: progress.currentLevelXp,
    nextLevelXp: progress.nextLevelXp,
    streakDays: newStreak,
    lastActivityDate: today,
  }
}

export function createInitialXpState(): XpState {
  return {
    totalXp: 0,
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: xpForLevel(2),
    streakDays: 0,
    lastActivityDate: new Date().toISOString().split('T')[0],
  }
}
