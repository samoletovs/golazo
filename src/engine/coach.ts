import type { SkillTree, SkillCategory, Exercise, TrainingEntry, MatchEntry, DiaryEntry, EnergyLevel, Tournament, DailyCheckIn } from './types'
import { categoryAverage, weakestCategory, SUB_SKILLS } from './skills'
import { exercises } from '../data/exercises'
import { getMatchResult } from './types'

/* ── Types ──────────────────────────────────────────────────── */

export interface CoachInsight {
  category: 'technical' | 'physical' | 'tactical' | 'mental' | 'knowledge' | 'wellbeing'
  icon: string
  text: string
}

export interface CoachAdvice {
  greeting: string
  recommendation: string
  insights: CoachInsight[]
  drills: string[]
  drillKeys: string[]
  focusArea: SkillCategory
  weeklyGoal: string
}

type T = (key: string, opts?: Record<string, unknown>) => string

/* ── Helpers ────────────────────────────────────────────────── */

function weekAgo(): number { return Date.now() - 7 * 24 * 60 * 60 * 1000 }
function twoWeeksAgo(): number { return Date.now() - 14 * 24 * 60 * 60 * 1000 }

function recentTrainingDays(trainings: TrainingEntry[]): number {
  const cutoff = weekAgo()
  return trainings.filter((tr) => new Date(tr.date).getTime() > cutoff).length
}

function weakestSubSkill(tree: SkillTree, category: SkillCategory): string {
  const catRatings = tree.ratings.filter((r) => r.category === category)
  if (catRatings.length === 0) return SUB_SKILLS[category][0]
  let weakest = catRatings[0]
  for (const r of catRatings) {
    if (r.rating < weakest.rating) weakest = r
  }
  return weakest.subSkill
}

function pickDrills(category: SkillCategory, weakSub: string, count: number): Exercise[] {
  const catExercises = exercises.filter((e) => e.category === category)
  if (catExercises.length === 0) return []
  const targeted = catExercises.filter((e) => e.subSkill === weakSub)
  const others = catExercises.filter((e) => e.subSkill !== weakSub)
  const result: Exercise[] = []
  for (const ex of targeted) { if (result.length >= count) break; result.push(ex) }
  for (const ex of others) { if (result.length >= count) break; result.push(ex) }
  return result
}

/* ── Mood & wellbeing analysis ──────────────────────────────── */

interface MoodSnapshot { date: string; mood: EnergyLevel; source: 'training' | 'match' | 'diary' }

function collectMoodHistory(
  trainings: TrainingEntry[],
  matches: MatchEntry[],
  diary: DiaryEntry[],
  checkIns: DailyCheckIn[] = [],
): MoodSnapshot[] {
  const all: MoodSnapshot[] = []
  for (const tr of trainings) all.push({ date: tr.date, mood: tr.mood, source: 'training' })
  for (const m of matches) all.push({ date: m.date, mood: m.mood, source: 'match' })
  for (const d of diary) all.push({ date: d.date, mood: d.mood, source: 'diary' })
  for (const c of checkIns) all.push({ date: c.date, mood: c.mood, source: 'training' })
  all.sort((a, b) => a.date.localeCompare(b.date))
  return all
}

function averageMood(snapshots: MoodSnapshot[]): number {
  if (snapshots.length === 0) return 3
  return snapshots.reduce((s, m) => s + m.mood, 0) / snapshots.length
}

function moodTrend(snapshots: MoodSnapshot[]): 'declining' | 'stable' | 'improving' {
  if (snapshots.length < 4) return 'stable'
  const half = Math.floor(snapshots.length / 2)
  const firstHalf = averageMood(snapshots.slice(0, half))
  const secondHalf = averageMood(snapshots.slice(half))
  if (secondHalf < firstHalf - 0.5) return 'declining'
  if (secondHalf > firstHalf + 0.5) return 'improving'
  return 'stable'
}

function recentLossStreak(matches: MatchEntry[]): number {
  let streak = 0
  for (let i = matches.length - 1; i >= 0; i--) {
    if (getMatchResult(matches[i]) === 'loss') streak++
    else break
  }
  return streak
}

function daysSinceLastActivity(trainings: TrainingEntry[], matches: MatchEntry[]): number {
  const dates: number[] = []
  for (const tr of trainings) dates.push(new Date(tr.date).getTime())
  for (const m of matches) dates.push(new Date(m.date).getTime())
  if (dates.length === 0) return 999
  const latest = Math.max(...dates)
  return Math.floor((Date.now() - latest) / (24 * 60 * 60 * 1000))
}

function recentAvgEnergy(trainings: TrainingEntry[]): number {
  const cutoff = twoWeeksAgo()
  const recent = trainings.filter((tr) => new Date(tr.date).getTime() > cutoff)
  if (recent.length === 0) return 3
  return recent.reduce((s, tr) => s + tr.energy, 0) / recent.length
}

/* ── Insight generators ─────────────────────────────────────── */

function generateWellbeingInsight(
  trainings: TrainingEntry[],
  matches: MatchEntry[],
  diary: DiaryEntry[],
  t: T,
  checkIns: DailyCheckIn[] = [],
): CoachInsight | null {
  const moods = collectMoodHistory(trainings, matches, diary, checkIns)
  const recentMoods = moods.filter((m) => new Date(m.date).getTime() > twoWeeksAgo())
  const trend = moodTrend(recentMoods)
  const avg = averageMood(recentMoods)
  const losses = recentLossStreak(matches)
  const inactiveDays = daysSinceLastActivity(trainings, matches)
  const energy = recentAvgEnergy(trainings)

  // Check-in specific: low energy streak from morning check-ins
  const recentCheckIns = checkIns.filter((c) => new Date(c.date).getTime() > weekAgo())
  if (recentCheckIns.length >= 3 && recentCheckIns.slice(-3).every((c) => c.energy <= 2)) {
    return { category: 'wellbeing', icon: '🧘', text: t('coach.wellbeing.burnout') }
  }

  // Priority 1: consecutive losses with low mood
  if (losses >= 2 && avg < 3) {
    return { category: 'wellbeing', icon: '💪', text: t('coach.wellbeing.afterLosses') }
  }

  // Priority 2: declining mood trend
  if (trend === 'declining' && avg < 2.8) {
    return { category: 'wellbeing', icon: '🌟', text: t('coach.wellbeing.declining') }
  }

  // Priority 3: long inactivity (might be injury, demotivation)
  if (inactiveDays >= 5) {
    return { category: 'wellbeing', icon: '👋', text: t('coach.wellbeing.inactive') }
  }

  // Priority 4: low energy but still training (possible burnout)
  if (energy < 2.5 && recentTrainingDays(trainings) >= 4) {
    return { category: 'wellbeing', icon: '🧘', text: t('coach.wellbeing.burnout') }
  }

  // Priority 5: generally low mood
  if (avg < 2.5 && recentMoods.length >= 3) {
    return { category: 'wellbeing', icon: '☀️', text: t('coach.wellbeing.lowMood') }
  }

  // Positive reinforcement if mood is improving
  if (trend === 'improving') {
    return { category: 'wellbeing', icon: '🔥', text: t('coach.wellbeing.improving') }
  }

  return null
}

function generateTechnicalInsight(tree: SkillTree, t: T): CoachInsight | null {
  const avg = categoryAverage(tree, 'technical')
  const weak = weakestSubSkill(tree, 'technical')
  if (avg === 0) return null

  if (avg <= 3) {
    return { category: 'technical', icon: '⚽', text: t('coach.insight.techBeginner', { subSkill: t(`subSkills.${weak}`) }) }
  }
  if (avg <= 6) {
    return { category: 'technical', icon: '⚽', text: t('coach.insight.techIntermediate', { subSkill: t(`subSkills.${weak}`) }) }
  }
  return { category: 'technical', icon: '⚽', text: t('coach.insight.techAdvanced', { subSkill: t(`subSkills.${weak}`) }) }
}

function generatePhysicalInsight(tree: SkillTree, trainings: TrainingEntry[], t: T): CoachInsight | null {
  const avg = categoryAverage(tree, 'physical')
  const weak = weakestSubSkill(tree, 'physical')
  const recentDays = recentTrainingDays(trainings)

  if (recentDays === 0) {
    return { category: 'physical', icon: '🏃', text: t('coach.insight.physInactive') }
  }
  if (avg <= 4) {
    return { category: 'physical', icon: '🏃', text: t('coach.insight.physBuild', { subSkill: t(`subSkills.${weak}`) }) }
  }
  if (recentDays >= 5) {
    return { category: 'physical', icon: '🏃', text: t('coach.insight.physRecovery') }
  }
  return { category: 'physical', icon: '🏃', text: t('coach.insight.physMaintain', { subSkill: t(`subSkills.${weak}`) }) }
}

function generateTacticalInsight(tree: SkillTree, matches: MatchEntry[], t: T): CoachInsight | null {
  const avg = categoryAverage(tree, 'tactical')
  const weak = weakestSubSkill(tree, 'tactical')

  if (matches.length === 0) {
    return { category: 'tactical', icon: '🧩', text: t('coach.insight.tacNoMatches') }
  }

  const recentRating = matches.slice(-5).reduce((s, m) => s + m.selfRating, 0) / Math.min(matches.length, 5)

  if (recentRating < 5) {
    return { category: 'tactical', icon: '🧩', text: t('coach.insight.tacStruggling', { subSkill: t(`subSkills.${weak}`) }) }
  }
  if (avg <= 5) {
    return { category: 'tactical', icon: '🧩', text: t('coach.insight.tacDevelop', { subSkill: t(`subSkills.${weak}`) }) }
  }
  return { category: 'tactical', icon: '🧩', text: t('coach.insight.tacRefine', { subSkill: t(`subSkills.${weak}`) }) }
}

function generateMentalInsight(tree: SkillTree, matches: MatchEntry[], t: T): CoachInsight | null {
  const avg = categoryAverage(tree, 'mental')
  const weak = weakestSubSkill(tree, 'mental')

  if (avg === 0) return null

  // Check for confidence issues after losses
  const losses = recentLossStreak(matches)
  if (losses >= 2 && weak === 'confidence') {
    return { category: 'mental', icon: '🎯', text: t('coach.insight.mentalConfidence') }
  }

  if (avg <= 4) {
    return { category: 'mental', icon: '🎯', text: t('coach.insight.mentalBuild', { subSkill: t(`subSkills.${weak}`) }) }
  }
  return { category: 'mental', icon: '🎯', text: t('coach.insight.mentalSharpen', { subSkill: t(`subSkills.${weak}`) }) }
}

function generateKnowledgeInsight(tree: SkillTree, matches: MatchEntry[], trainings: TrainingEntry[], t: T): CoachInsight | null {
  const avg = categoryAverage(tree, 'knowledge')
  const totalActivities = matches.length + trainings.length

  if (totalActivities < 5) {
    return { category: 'knowledge', icon: '📚', text: t('coach.insight.knowStart') }
  }
  if (avg <= 4) {
    return { category: 'knowledge', icon: '📚', text: t('coach.insight.knowLearn') }
  }
  return { category: 'knowledge', icon: '📚', text: t('coach.insight.knowDeepen') }
}

/* ── Greeting ───────────────────────────────────────────────── */

function generateGreeting(
  trainings: TrainingEntry[],
  matches: MatchEntry[],
  diary: DiaryEntry[],
  t: T,
): string {
  const moods = collectMoodHistory(trainings, matches, diary)
  const recentMoods = moods.filter((m) => new Date(m.date).getTime() > weekAgo())
  const avg = averageMood(recentMoods)
  const inactiveDays = daysSinceLastActivity(trainings, matches)

  if (inactiveDays >= 7) return t('coach.greeting.welcomeBack')
  if (avg >= 4) return t('coach.greeting.great')
  if (avg < 2.5 && recentMoods.length >= 2) return t('coach.greeting.supportive')
  return t('coach.greeting.default')
}

/* ── Main recommendation ────────────────────────────────────── */

function generateRecommendation(
  focusArea: SkillCategory,
  avgRating: number,
  recentMatches: MatchEntry[],
  recentTrainings: TrainingEntry[],
  t: T,
): string {
  const catLabel = t(`skills.${focusArea}`)
  const ratingText = avgRating.toFixed(1)

  if (recentTrainings.length === 0 && recentMatches.length === 0) {
    return t('coach.recNewPlayer', { area: catLabel })
  }
  if (avgRating <= 3) return t('coach.recBeginner', { area: catLabel, rating: ratingText })
  if (avgRating <= 6) return t('coach.recIntermediate', { area: catLabel, rating: ratingText })
  return t('coach.recAdvanced', { area: catLabel, rating: ratingText })
}

/* ── Weekly goal ────────────────────────────────────────────── */

function generateWeeklyGoal(
  focusArea: SkillCategory,
  recentDays: number,
  t: T,
): string {
  const sessionsTarget = Math.max(3, recentDays + 1)
  return t('coach.goalTemplate', { sessions: Math.min(sessionsTarget, 5), area: t(`skills.${focusArea}`) })
}

/* ── Public API ─────────────────────────────────────────────── */

export function generateLocalAdvice(
  skillTree: SkillTree,
  matches: MatchEntry[],
  trainings: TrainingEntry[],
  t: T,
  diary: DiaryEntry[] = [],
  _tournaments: Tournament[] = [],
  checkIns: DailyCheckIn[] = [],
): CoachAdvice {
  const focusArea = weakestCategory(skillTree)
  const avgRating = categoryAverage(skillTree, focusArea)
  const weakSub = weakestSubSkill(skillTree, focusArea)
  const recentDays = recentTrainingDays(trainings)

  // Drills for the main focus area
  const drillExercises = pickDrills(focusArea, weakSub, 3)
  const drills = drillExercises.map((e) => t(e.nameKey))
  const drillKeys = drillExercises.map((e) => e.nameKey)

  // Greeting adapts to mood/activity
  const greeting = generateGreeting(trainings, matches, diary, t)

  // Main recommendation
  const recommendation = generateRecommendation(focusArea, avgRating, matches, trainings, t)

  // Weekly goal
  const weeklyGoal = generateWeeklyGoal(focusArea, recentDays, t)

  // Generate insights across all areas — wellbeing first (most important)
  const insights: CoachInsight[] = []

  const wellbeing = generateWellbeingInsight(trainings, matches, diary, t, checkIns)
  if (wellbeing) insights.push(wellbeing)

  const technical = generateTechnicalInsight(skillTree, t)
  if (technical) insights.push(technical)

  const physical = generatePhysicalInsight(skillTree, trainings, t)
  if (physical) insights.push(physical)

  const tactical = generateTacticalInsight(skillTree, matches, t)
  if (tactical) insights.push(tactical)

  const mental = generateMentalInsight(skillTree, matches, t)
  if (mental) insights.push(mental)

  const knowledge = generateKnowledgeInsight(skillTree, matches, trainings, t)
  if (knowledge) insights.push(knowledge)

  return { greeting, recommendation, insights, drills, drillKeys, focusArea, weeklyGoal }
}
