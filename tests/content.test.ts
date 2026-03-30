import { describe, it, expect } from 'vitest'
import { articles } from '../src/data/articles'
import { programs } from '../src/data/programs'

describe('Articles data', () => {
  it('has articles in all categories', () => {
    const categories = ['tactics', 'nutrition', 'mental', 'rules', 'stories'] as const
    for (const cat of categories) {
      expect(articles.filter((a) => a.category === cat).length).toBeGreaterThanOrEqual(2)
    }
  })

  it('all articles have unique IDs', () => {
    const ids = articles.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has at least 20 articles total', () => {
    expect(articles.length).toBeGreaterThanOrEqual(20)
  })

  it('all articles have valid reading time', () => {
    for (const a of articles) {
      expect(a.readingTimeMin).toBeGreaterThanOrEqual(1)
      expect(a.readingTimeMin).toBeLessThanOrEqual(10)
    }
  })

  it('all articles have at least one age tier', () => {
    for (const a of articles) {
      expect(a.ageTiers.length).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('Programs data', () => {
  it('has at least 3 programs', () => {
    expect(programs.length).toBeGreaterThanOrEqual(3)
  })

  it('all programs have unique IDs', () => {
    const ids = programs.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all programs have valid duration', () => {
    for (const p of programs) {
      expect(p.durationWeeks).toBeGreaterThanOrEqual(1)
      expect(p.durationWeeks).toBeLessThanOrEqual(12)
    }
  })
})
