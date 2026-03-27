import { describe, it, expect } from 'vitest'
import {
  createInitialSkillTree,
  categoryAverage,
  overallRating,
  fifaCardRatings,
  updateSkillRating,
  weakestCategory,
  SUB_SKILLS,
} from '../src/engine/skills'

describe('createInitialSkillTree', () => {
  it('creates tree with all categories', () => {
    const tree = createInitialSkillTree('player1')
    expect(tree.playerId).toBe('player1')
    expect(tree.ratings.length).toBe(60) // 6 categories × 10 sub-skills
  })

  it('all ratings start at 1', () => {
    const tree = createInitialSkillTree('player1')
    for (const r of tree.ratings) {
      expect(r.rating).toBe(1)
    }
  })
})

describe('categoryAverage', () => {
  it('returns 1 for initial tree', () => {
    const tree = createInitialSkillTree('p')
    expect(categoryAverage(tree, 'technical')).toBe(1)
  })

  it('reflects updated ratings', () => {
    let tree = createInitialSkillTree('p')
    tree = updateSkillRating(tree, 'technical', 'dribbling', 5)
    const avg = categoryAverage(tree, 'technical')
    // 9 skills at 1 + 1 skill at 5 = 14 / 10 = 1.4
    expect(avg).toBe(1.4)
  })
})

describe('overallRating', () => {
  it('returns 1 for initial tree', () => {
    expect(overallRating(createInitialSkillTree('p'))).toBe(1)
  })
})

describe('fifaCardRatings', () => {
  it('returns 6 categories', () => {
    const ratings = fifaCardRatings(createInitialSkillTree('p'))
    expect(ratings).toHaveLength(6)
    expect(ratings.map((r) => r.category)).toEqual([
      'technical', 'physical', 'tactical', 'mental', 'matchPlay', 'knowledge',
    ])
  })
})

describe('updateSkillRating', () => {
  it('updates the correct sub-skill', () => {
    const tree = createInitialSkillTree('p')
    const updated = updateSkillRating(tree, 'physical', 'speed', 8)
    const speedRating = updated.ratings.find((r) => r.category === 'physical' && r.subSkill === 'speed')
    expect(speedRating?.rating).toBe(8)
  })

  it('clamps rating between 1 and 10', () => {
    const tree = createInitialSkillTree('p')
    const updated = updateSkillRating(tree, 'mental', 'confidence', 15)
    const r = updated.ratings.find((r) => r.category === 'mental' && r.subSkill === 'confidence')
    expect(r?.rating).toBe(10)
  })

  it('does not mutate original tree', () => {
    const tree = createInitialSkillTree('p')
    const updated = updateSkillRating(tree, 'technical', 'dribbling', 7)
    const original = tree.ratings.find((r) => r.subSkill === 'dribbling')
    const changed = updated.ratings.find((r) => r.subSkill === 'dribbling')
    expect(original?.rating).toBe(1)
    expect(changed?.rating).toBe(7)
  })
})

describe('weakestCategory', () => {
  it('returns any category for initial tree (all equal)', () => {
    const tree = createInitialSkillTree('p')
    const weakest = weakestCategory(tree)
    expect(Object.keys(SUB_SKILLS)).toContain(weakest)
  })

  it('returns the updated weakest after improvements', () => {
    let tree = createInitialSkillTree('p')
    // Boost all technical skills to 5
    for (const skill of SUB_SKILLS.technical) {
      tree = updateSkillRating(tree, 'technical', skill, 5)
    }
    // Knowledge should still be at 1, so it's the weakest (or tied)
    const weakest = weakestCategory(tree)
    expect(weakest).not.toBe('technical')
  })
})
