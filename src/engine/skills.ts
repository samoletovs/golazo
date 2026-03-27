import type { SkillCategory, SkillRating, SkillTree } from './types'

/* ── Sub-skills per category ──────────────────────────────── */

export const SUB_SKILLS: Record<SkillCategory, string[]> = {
  technical: ['dribbling', 'shortPass', 'longPass', 'shooting', 'firstTouch', 'weakFoot', 'crossing', 'heading', 'freeKick', 'ballControl'],
  physical: ['speed', 'stamina', 'agility', 'strength', 'acceleration', 'balance', 'coordination', 'flexibility', 'jumping', 'recovery'],
  tactical: ['positioning', 'vision', 'decisionMaking', 'pressing', 'spaceAwareness', 'offTheBall', 'transitions', 'setPlays', 'formation', 'gameReading'],
  mental: ['confidence', 'focus', 'resilience', 'leadership', 'selfTalk', 'visualization', 'composure', 'motivation', 'teamAttitude', 'coachability'],
  matchPlay: ['goals', 'assists', 'keyPasses', 'tackles', 'interceptions', 'aerialDuels', 'successfulDribbles', 'passAccuracy', 'shotsOnTarget', 'minutesPlayed'],
  knowledge: ['rules', 'footballHistory', 'nutrition', 'recovery', 'warmUp', 'coolDown', 'injuryPrevention', 'formations', 'refereeSignals', 'fairPlay'],
}

/** Create initial skill tree with all ratings at 1 */
export function createInitialSkillTree(playerId: string): SkillTree {
  const now = new Date().toISOString()
  const ratings: SkillRating[] = []

  for (const [category, skills] of Object.entries(SUB_SKILLS)) {
    for (const subSkill of skills) {
      ratings.push({
        category: category as SkillCategory,
        subSkill,
        rating: 1,
        lastUpdated: now,
      })
    }
  }

  return { playerId, ratings, updatedAt: now }
}

/** Get average rating for a skill category */
export function categoryAverage(tree: SkillTree, category: SkillCategory): number {
  const catRatings = tree.ratings.filter((r) => r.category === category)
  if (catRatings.length === 0) return 0
  const sum = catRatings.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / catRatings.length) * 10) / 10
}

/** Get overall average rating across all categories (for FIFA card) */
export function overallRating(tree: SkillTree): number {
  const categories: SkillCategory[] = ['technical', 'physical', 'tactical', 'mental', 'matchPlay', 'knowledge']
  const avg = categories.reduce((sum, cat) => sum + categoryAverage(tree, cat), 0) / categories.length
  return Math.round(avg * 10) / 10
}

/** Get the top 6 ratings for FIFA-style card (one per category) */
export function fifaCardRatings(tree: SkillTree): { category: SkillCategory; rating: number }[] {
  const categories: SkillCategory[] = ['technical', 'physical', 'tactical', 'mental', 'matchPlay', 'knowledge']
  return categories.map((cat) => ({
    category: cat,
    rating: Math.round(categoryAverage(tree, cat)),
  }))
}

/** Update a specific sub-skill rating */
export function updateSkillRating(
  tree: SkillTree,
  category: SkillCategory,
  subSkill: string,
  newRating: number,
): SkillTree {
  const now = new Date().toISOString()
  const clamped = Math.max(1, Math.min(10, Math.round(newRating)))
  const updatedRatings = tree.ratings.map((r) =>
    r.category === category && r.subSkill === subSkill
      ? { ...r, rating: clamped, lastUpdated: now }
      : r,
  )
  return { ...tree, ratings: updatedRatings, updatedAt: now }
}

/** Identify weakest skill category for AI coach recommendations */
export function weakestCategory(tree: SkillTree): SkillCategory {
  const categories: SkillCategory[] = ['technical', 'physical', 'tactical', 'mental', 'matchPlay', 'knowledge']
  let weakest: SkillCategory = 'technical'
  let lowestAvg = 11

  for (const cat of categories) {
    const avg = categoryAverage(tree, cat)
    if (avg < lowestAvg) {
      lowestAvg = avg
      weakest = cat
    }
  }

  return weakest
}
