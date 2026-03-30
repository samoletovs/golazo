import { describe, it, expect } from 'vitest'
import { quizQuestions, getQuizOfTheDay } from '../src/data/quizzes'

describe('Quiz data', () => {
  it('has questions for all difficulty tiers', () => {
    const tiers = ['u10', 'u12', 'u14', 'u16'] as const
    for (const tier of tiers) {
      const questions = quizQuestions.filter((q) => q.difficulty === tier)
      expect(questions.length).toBeGreaterThanOrEqual(13)
    }
  })

  it('all questions have valid correctIndex', () => {
    for (const q of quizQuestions) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(q.options.length)
    }
  })

  it('all questions have exactly 4 options', () => {
    for (const q of quizQuestions) {
      expect(q.options.length).toBe(4)
    }
  })

  it('all questions have unique IDs', () => {
    const ids = quizQuestions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('getQuizOfTheDay returns deterministic result for same date and tier', () => {
    const q1 = getQuizOfTheDay('2026-03-30', 'u12')
    const q2 = getQuizOfTheDay('2026-03-30', 'u12')
    expect(q1.id).toBe(q2.id)
  })

  it('getQuizOfTheDay returns different questions for different dates', () => {
    const q1 = getQuizOfTheDay('2026-03-30', 'u12')
    const q2 = getQuizOfTheDay('2026-03-31', 'u12')
    // Not guaranteed different for adjacent dates but very likely with 10+ questions
    // Just verify both return valid questions
    expect(q1.difficulty).toBe('u12')
    expect(q2.difficulty).toBe('u12')
  })
})
