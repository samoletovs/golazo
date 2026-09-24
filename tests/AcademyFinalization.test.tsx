import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { AppProvider } from '../src/contexts/AppContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import { DailyQuiz } from '../src/components/DailyQuiz'
import { AcademyDailyPractice } from '../src/components/academy/AcademyDailyPractice'
import { WorkoutView } from '../src/components/WorkoutView'
import { FootballPortal } from '../src/pages/FootballPortal'
import { secondaryNavigation } from '../src/academy/navigation'
import { generateLocalAdvice } from '../src/engine/coach'
import { createInitialSkillTree } from '../src/engine/skills'
import { getChallengeOfDay, getDailyChallengeCompletionKey } from '../src/engine/challenges'
import type { MatchEntry } from '../src/engine/types'
import { getQuizOfTheDay } from '../src/data/quizzes'
import { programs } from '../src/data/programs'
import i18n from '../src/i18n'

beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('golazo-state', JSON.stringify({
    profile: {
      id: 'synthetic-player', familyId: 'fixture', role: 'player', name: 'Fictional Player',
      birthDate: `${new Date().getFullYear() - 11}-04-01`, positions: ['CM'], dominantFoot: 'right',
      language: 'en', country: 'LV', createdAt: '2026-09-01',
    },
  }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
  await i18n.changeLanguage('en')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Academy finalization findings', () => {
  it('exposes the existing standalone exercise library through player navigation', () => {
    expect(secondaryNavigation('player')).toContainEqual({
      page: 'exercises', label: 'learn.exercises', icon: 'learn',
    })
  })

  it('keeps the answered daily question and correct choice visible without awarding twice', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const question = getQuizOfTheDay(today, 'u12')
    await act(async () => { render(<AppProvider><DailyQuiz /></AppProvider>) })
    const answer = i18n.t(`quiz.q.${question.id}.o0`, { defaultValue: question.options[0] })
    fireEvent.click(screen.getByRole('button', { name: answer, exact: true }))
    expect(screen.getByText(i18n.t(`quiz.q.${question.id}`, { defaultValue: question.questionKey }))).toBeInTheDocument()
    const correct = screen.getByRole('button', {
      name: i18n.t(`quiz.q.${question.id}.o${question.correctIndex}`, { defaultValue: question.options[question.correctIndex] }),
      exact: true,
    })
    expect(correct).toHaveClass('correct-answer')
    expect(correct).toBeDisabled()
    const saved = localStorage.getItem('golazo-state')
    expect(JSON.parse(saved ?? '{}').quizAnswers).toHaveLength(1)
    fireEvent.click(correct)
    expect(localStorage.getItem('golazo-state')).toBe(saved)
  })

  it('shows the sum of explicitly timed workout sections rather than a contradictory estimate', () => {
    const day = programs.find(program => program.id === 'prog-speed-agility')!.weeks![0].days[0]
    render(<WorkoutView weekNumber={1} day={day} onComplete={() => {}} isCompleted={false} alreadyLoggedToday={false} />)
    expect(screen.getByText('65 min', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('20 min', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByText(/Warm-up/)).toBeInTheDocument()
    expect(screen.getByText(/Cool-down/)).toBeInTheDocument()
  })

  it('retains quiz feedback when the answer completes the real daily-practice panel', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 23, 12))
    const today = '2026-09-23'
    const state = JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
    state.profile.birthDate = '2015-04-01'
    state.skillTree = createInitialSkillTree('synthetic-player')
    state.checkIns = [{ id: 'synthetic-check-in', date: today, mood: 4, energy: 4 }]
    localStorage.setItem('golazo-state', JSON.stringify(state))
    const challenge = getChallengeOfDay('synthetic-player', today, 'u12', ['CM'], state.skillTree)
    if (!challenge) throw new Error('Daily-practice fixture requires a challenge')
    localStorage.setItem(getDailyChallengeCompletionKey(today), JSON.stringify([challenge.templateId]))
    const question = getQuizOfTheDay(today, 'u12')
    const mounted = render(<AppProvider><ToastProvider><AcademyDailyPractice /></ToastProvider></AppProvider>)
    await act(async () => {})
    const answer = i18n.t(`quiz.q.${question.id}.o${question.correctIndex}`, { defaultValue: question.options[question.correctIndex] })
    fireEvent.click(screen.getByRole('button', { name: answer, exact: true }))
    expect(screen.getByText(i18n.t(`quiz.q.${question.id}`, { defaultValue: question.questionKey }))).toBeVisible()
    expect(screen.getByRole('button', { name: answer, exact: true })).toHaveClass('correct-answer')
    expect(screen.getByRole('button', { name: answer, exact: true })).toBeDisabled()
    expect(JSON.parse(localStorage.getItem('golazo-state') ?? '{}').quizAnswers).toHaveLength(1)
    vi.setSystemTime(new Date(2026, 8, 24, 12))
    mounted.rerender(<AppProvider><ToastProvider><AcademyDailyPractice /></ToastProvider></AppProvider>)
    const nextQuestion = getQuizOfTheDay('2026-09-24', 'u12')
    for (let index = 0; index < 4; index++) {
      const nextAnswer = i18n.t(`quiz.q.${nextQuestion.id}.o${index}`, { defaultValue: nextQuestion.options[index] })
      const button = screen.getByRole('button', { name: nextAnswer, exact: true })
      expect(button).toBeEnabled()
      expect(button).not.toHaveClass('correct-answer')
    }
  })

  it.each(['en', 'lv', 'ru', 'es', 'lt', 'et'])('does not leak missing sub-skill translation keys into %s advice', async language => {
    await i18n.changeLanguage(language)
    const advice = generateLocalAdvice(createInitialSkillTree('synthetic-player'), [], [], (key, options) => i18n.t(key, options))
    expect(advice.insights.map(insight => insight.text).join(' ')).not.toContain('subSkills.')
    expect(advice.insights.find(insight => insight.category === 'technical')?.text).toContain(i18n.t('skills.technical'))
  })

  it.each(['en', 'lv', 'ru', 'es', 'lt', 'et'])('preserves confidence support after losses in %s', async language => {
    await i18n.changeLanguage(language)
    const matches: MatchEntry[] = [1, 2].map(index => ({
      id: `loss-${index}`, playerId: 'synthetic-player', date: '2026-09-22',
      opponent: 'Fictional opposition', competition: '', scoreUs: 0, scoreThem: 1,
      goals: 0, assists: 0, shots: 0, keyPasses: 0, tackles: 0, position: ['CM'],
      minutesPlayed: 30, selfRating: 3, mood: 2, bestMoment: '', toImprove: '',
      createdAt: '2026-09-22',
    }))
    const advice = generateLocalAdvice(createInitialSkillTree('synthetic-player'), matches, [], (key, options) => i18n.t(key, options))
    expect(advice.insights.find(insight => insight.category === 'mental')?.text).toBe(i18n.t('coach.insight.mentalConfidence'))
  })

  it('expands every saved tournament match rather than hiding entries after the last five', () => {
    const state = JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
    state.tournaments = [{
      id: 'synthetic-cup', playerId: 'synthetic-player', name: 'Fictional Academy Cup',
      startDate: '2026-09-01', endDate: '2026-09-03', location: 'Fictional pitch',
      matchIds: [], completed: true, createdAt: '2026-09-01',
    }]
    state.matches = Array.from({ length: 7 }, (_, index) => ({
      id: `synthetic-game-${index}`, tournamentId: 'synthetic-cup', playerId: 'synthetic-player',
      date: '2026-09-02', opponent: `Fictional Opponent ${index + 1}`,
      scoreUs: 2, scoreThem: 1, goals: 1, assists: 0, position: ['CM'],
      minutesPlayed: 40, selfRating: 7, mood: 4, createdAt: '2026-09-02',
    }))
    localStorage.setItem('golazo-state', JSON.stringify(state))
    const saved = localStorage.getItem('golazo-state')
    render(<AppProvider><ToastProvider><FootballPortal /></ToastProvider></AppProvider>)
    const disclosure = screen.getByText('Matches (7)', { selector: 'summary' })
    fireEvent.click(disclosure)
    const details = disclosure.closest('details')
    expect(details).toHaveAttribute('open')
    if (!details) throw new Error('Tournament disclosure did not render')
    for (let index = 1; index <= 7; index++) {
      expect(within(details).getByText(`Fictional Opponent ${index}`)).toBeVisible()
    }
    expect(localStorage.getItem('golazo-state')).toBe(saved)
  })
})
