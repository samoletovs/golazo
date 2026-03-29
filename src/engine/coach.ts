import type { SkillTree, SkillCategory, Exercise, TrainingEntry, MatchEntry } from './types'
import { categoryAverage, weakestCategory, SUB_SKILLS } from './skills'
import { exercises } from '../data/exercises'

export interface CoachAdvice {
  recommendation: string
  drills: string[]
  drillKeys: string[] // i18n nameKeys for linking to exercises
  focusArea: SkillCategory
  weeklyGoal: string
}

/** Find the weakest sub-skill within a category */
function weakestSubSkill(tree: SkillTree, category: SkillCategory): string {
  const catRatings = tree.ratings.filter((r) => r.category === category)
  if (catRatings.length === 0) return SUB_SKILLS[category][0]
  let weakest = catRatings[0]
  for (const r of catRatings) {
    if (r.rating < weakest.rating) weakest = r
  }
  return weakest.subSkill
}

/** Pick exercises matching a category, preferring those targeting the weakest sub-skill */
function pickDrills(category: SkillCategory, weakSub: string, count: number): Exercise[] {
  const catExercises = exercises.filter((e) => e.category === category)
  if (catExercises.length === 0) return []

  // Prioritize exercises targeting the weakest sub-skill
  const targeted = catExercises.filter((e) => e.subSkill === weakSub)
  const others = catExercises.filter((e) => e.subSkill !== weakSub)

  const result: Exercise[] = []
  for (const ex of targeted) {
    if (result.length >= count) break
    result.push(ex)
  }
  for (const ex of others) {
    if (result.length >= count) break
    result.push(ex)
  }
  return result
}

/** Count training days in the last 7 days */
function recentTrainingDays(trainings: TrainingEntry[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return trainings.filter((t) => new Date(t.date).getTime() > weekAgo).length
}

/** Generate a weekly goal based on training frequency and focus area */
function generateWeeklyGoal(
  focusArea: SkillCategory,
  _weakSub: string,
  _avgRating: number,
  recentDays: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const sessionsTarget = Math.max(3, recentDays + 1)
  return t('coach.goalTemplate', { sessions: Math.min(sessionsTarget, 5), area: t(`skills.${focusArea}`) })
}

/** Build a recommendation text based on skill analysis */
function generateRecommendation(
  focusArea: SkillCategory,
  _weakSub: string,
  avgRating: number,
  recentMatches: MatchEntry[],
  recentTrainings: TrainingEntry[],
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const catLabel = t(`skills.${focusArea}`)
  const ratingText = avgRating.toFixed(1)

  if (recentTrainings.length === 0 && recentMatches.length === 0) {
    return t('coach.recNewPlayer', { area: catLabel })
  }

  if (avgRating <= 3) {
    return t('coach.recBeginner', { area: catLabel, rating: ratingText })
  }

  if (avgRating <= 6) {
    return t('coach.recIntermediate', { area: catLabel, rating: ratingText })
  }

  return t('coach.recAdvanced', { area: catLabel, rating: ratingText })
}

/** Generate coaching advice purely from local data — no API call needed */
export function generateLocalAdvice(
  skillTree: SkillTree,
  matches: MatchEntry[],
  trainings: TrainingEntry[],
  t: (key: string, opts?: Record<string, unknown>) => string,
): CoachAdvice {
  const focusArea = weakestCategory(skillTree)
  const avgRating = categoryAverage(skillTree, focusArea)
  const weakSub = weakestSubSkill(skillTree, focusArea)
  const recentDays = recentTrainingDays(trainings)

  const drillExercises = pickDrills(focusArea, weakSub, 3)
  const drills = drillExercises.map((e) => t(e.nameKey))
  const drillKeys = drillExercises.map((e) => e.nameKey)

  const recommendation = generateRecommendation(focusArea, weakSub, avgRating, matches, trainings, t)
  const weeklyGoal = generateWeeklyGoal(focusArea, weakSub, avgRating, recentDays, t)

  return { recommendation, drills, drillKeys, focusArea, weeklyGoal }
}
