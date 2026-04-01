import type { SkillCategory, SkillTree, Position, QuizDifficulty, ActiveChallenge, ChallengeReason } from './types'
import { categoryAverage, TRAINABLE_CATEGORIES } from './skills'
import { challengePool } from '../data/challenge-pool'

/**
 * Deterministic seed-based pseudo-random number generator.
 * Same seed → same sequence. Used so challenges stay consistent all day.
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/** Create a numeric seed from a string (userId + date) */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Rank skill categories from weakest to strongest */
function rankCategories(skillTree: SkillTree): SkillCategory[] {
  return [...TRAINABLE_CATEGORIES].sort(
    (a, b) => categoryAverage(skillTree, a) - categoryAverage(skillTree, b),
  )
}

/** Shuffle array with seeded random */
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Generate personalized daily challenges (3 daily + 1 weekly).
 *
 * Algorithm:
 * 1. Find 2 weakest skill categories from radar
 * 2. Pick 1 challenge targeting weakest, 1 targeting second-weakest, 1 wildcard
 * 3. Pick 1 weekly challenge
 * 4. Filter by age tier and position
 * 5. Avoid repeating recent challenges (last 3 days)
 *
 * Deterministic: same userId + date → same challenges all day.
 */
export function generateDailyChallenges(
  userId: string,
  date: string, // YYYY-MM-DD
  ageTier: QuizDifficulty,
  positions: Position[],
  skillTree: SkillTree,
  recentChallengeIds: string[] = [], // templateIds from last 3 days
): ActiveChallenge[] {
  const seed = hashString(`${userId}-${date}`)
  const rand = seededRandom(seed)

  const ranked = rankCategories(skillTree)
  const weakest = ranked[0]
  const secondWeakest = ranked[1]

  const recentSet = new Set(recentChallengeIds)
  const posSet = new Set(positions)

  // Filter pool by age tier and position
  const eligible = challengePool.filter((t) => {
    if (!t.ageTiers.includes(ageTier)) return false
    if (!t.targets[ageTier]) return false
    if (t.positions && t.positions.length > 0 && !t.positions.some((p) => posSet.has(p))) return false
    return true
  })

  const daily = eligible.filter((t) => t.period === 'daily')
  const weekly = eligible.filter((t) => t.period === 'weekly')

  // Avoid recent challenges (soft — if we can't avoid, allow them)
  const freshDaily = daily.filter((t) => !recentSet.has(t.id))
  const pool = freshDaily.length >= 6 ? freshDaily : daily

  // Group by category
  const byCategory = new Map<SkillCategory, typeof pool>()
  for (const t of pool) {
    const arr = byCategory.get(t.category) || []
    arr.push(t)
    byCategory.set(t.category, arr)
  }

  const picks: { template: (typeof pool)[0]; reason: ChallengeReason }[] = []

  // Pick 1 from weakest category
  const weakPool = shuffle(byCategory.get(weakest) || [], rand)
  if (weakPool.length > 0) {
    picks.push({ template: weakPool[0], reason: 'weakest-skill' })
  }

  // Pick 1 from second-weakest category (avoid same template)
  const usedIds = new Set(picks.map((p) => p.template.id))
  const secondPool = shuffle((byCategory.get(secondWeakest) || []).filter((t) => !usedIds.has(t.id)), rand)
  if (secondPool.length > 0) {
    picks.push({ template: secondPool[0], reason: 'second-weakest' })
  }

  // Pick 1 wildcard from any remaining category
  usedIds.clear()
  picks.forEach((p) => usedIds.add(p.template.id))
  const wildcardPool = shuffle(pool.filter((t) => !usedIds.has(t.id)), rand)
  if (wildcardPool.length > 0) {
    picks.push({ template: wildcardPool[0], reason: 'wildcard' })
  }

  // Ensure we have 3 daily challenges (fill with any available if needed)
  while (picks.length < 3 && pool.length > 0) {
    usedIds.clear()
    picks.forEach((p) => usedIds.add(p.template.id))
    const remaining = shuffle(pool.filter((t) => !usedIds.has(t.id)), rand)
    if (remaining.length === 0) break
    picks.push({ template: remaining[0], reason: 'wildcard' })
  }

  // Pick 1 weekly challenge
  const weekSeed = hashString(`${userId}-week-${getWeekKey(date)}`)
  const weekRand = seededRandom(weekSeed)
  const shuffledWeekly = shuffle(weekly, weekRand)
  if (shuffledWeekly.length > 0) {
    picks.push({ template: shuffledWeekly[0], reason: 'weekly' })
  }

  // Convert to ActiveChallenge
  const now = new Date(date).toISOString()
  return picks.map((p) => {
    const target = p.template.targets[ageTier]!
    const isWeekly = p.template.period === 'weekly'
    const expires = isWeekly
      ? getEndOfWeek(date)
      : `${date}T23:59:59.999Z`

    return {
      templateId: p.template.id,
      generatedAt: now,
      expiresAt: expires,
      target: target.value,
      unit: target.unit,
      progress: 0,
      status: 'active' as const,
      reason: p.reason,
      category: p.template.category,
      xpReward: p.template.xpReward,
      textKey: p.template.textKey,
    }
  })
}

/** Get ISO week key for weekly challenge consistency */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

/** Get end of current week (Sunday 23:59) */
function getEndOfWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const dayOfWeek = d.getDay()
  const sunday = new Date(d)
  sunday.setDate(d.getDate() + (7 - dayOfWeek) % 7)
  return `${sunday.toISOString().slice(0, 10)}T23:59:59.999Z`
}

/** Get the "reason" explanation for a challenge */
export function getChallengeReasonKey(reason: ChallengeReason): string {
  switch (reason) {
    case 'weakest-skill': return 'ch.reason.weakest'
    case 'second-weakest': return 'ch.reason.secondWeakest'
    case 'position': return 'ch.reason.position'
    case 'wildcard': return 'ch.reason.wildcard'
    case 'weekly': return 'ch.reason.weekly'
  }
}
