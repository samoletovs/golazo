import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { AppProvider, useApp } from '../src/contexts/AppContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import { MatchLog } from '../src/pages/MatchLog'
import { DiaryPage } from '../src/pages/DiaryPage'
import { createInitialXpState } from '../src/engine/xp'
import i18n from '../src/i18n'
import type { DiaryEntry, MatchEntry, PlayerProfile } from '../src/engine/types'

const today = new Date().toISOString().slice(0, 10)
const profile: PlayerProfile = {
  id: 'synthetic-player', familyId: 'fixture', role: 'player', name: 'Alex',
  birthDate: '2014-04-01', team: 'Synthetic club', positions: ['CM'],
  dominantFoot: 'right', language: 'en', createdAt: today,
}
const read = () => JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
async function mount(children: React.ReactNode) {
  render(<AppProvider><ToastProvider>{children}</ToastProvider></AppProvider>)
  await act(async () => {})
}
beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('golazo-state', JSON.stringify({ profile, xp: createInitialXpState(), matches: [], diary: [], onboardingComplete: true }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
  await i18n.changeLanguage('en')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('atomic match and reflection logs', () => {
  it('retains a match draft after local failure and saves one match and reward after retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await mount(<MatchLog prefill={{ opponent: 'Fictional Eastbank FC', date: today }} />)
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic storage failure', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button', { name: i18n.t('match.save') }))
    expect(screen.getAllByText(i18n.t('academy.saveError')).length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('Fictional Eastbank FC')).toBeInTheDocument()
    expect(read().matches).toHaveLength(0)
    expect(read().xp.totalXp).toBe(0)
    writes.mockRestore()
    const save = screen.getByRole('button', { name: i18n.t('training.retry') })
    fireEvent.click(save)
    fireEvent.click(save)
    expect(await screen.findByText(i18n.t('academy.savedLocal'))).toBeInTheDocument()
    expect(read().matches).toHaveLength(1)
    expect(read().matches[0].playerId).toBe(profile.id)
    expect(read().xp.totalXp).toBe(30)
    expect(screen.getByText(/does not confirm a cloud save/)).toBeInTheDocument()
  })

  it('retains reflection content and consent after failure without duplicating its reward', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await mount(<DiaryPage />)
    const text = 'I made room for my teammate.'
    fireEvent.change(screen.getByRole('textbox'), { target: { value: text } })
    fireEvent.click(screen.getByRole('checkbox', { name: i18n.t('diary.aiConsent') }))
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic storage failure', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button', { name: i18n.t('diary.save') }))
    expect(screen.getByRole('textbox')).toHaveValue(text)
    expect(read().diary).toHaveLength(0)
    expect(read().xp.totalXp).toBe(0)
    writes.mockRestore()
    const save = screen.getByRole('button', { name: i18n.t('training.retry') })
    fireEvent.click(save)
    fireEvent.click(save)
    expect(await screen.findByText(i18n.t('academy.savedLocal'))).toBeInTheDocument()
    expect(read().diary).toHaveLength(1)
    expect(read().diary[0]).toMatchObject({ text, aiConsent: false, playerId: profile.id })
    expect(read().xp.totalXp).toBe(15)
  })

  it('serializes double submissions against latest state and preserves the real growth bonus', async () => {
    const match: MatchEntry = { id: 'stable-match', playerId: profile.id, date: today, opponent: 'Synthetic opponent', competition: '', scoreUs: 1, scoreThem: 2, position: ['CM'], minutesPlayed: 60, goals: 0, assists: 0, shots: 0, keyPasses: 0, tackles: 0, selfRating: 4, bestMoment: '', toImprove: 'Look up before passing', mood: 3, createdAt: today }
    const diary: DiaryEntry = { id: 'stable-diary', playerId: profile.id, date: today, text: 'Learned a turn', mood: 3, promptsUsed: [], linkedTrainingIds: [], linkedMatchIds: [], createdAt: today }
    function Probe() {
      const { saveMatch, saveDiary } = useApp()
      return <button onClick={() => { saveMatch(match); saveMatch(match); saveDiary(diary); saveDiary(diary) }}>Save both</button>
    }
    await mount(<Probe />)
    fireEvent.click(screen.getByRole('button', { name: 'Save both' }))
    expect(read().matches).toHaveLength(1)
    expect(read().diary).toHaveLength(1)
    expect(read().xp.totalXp).toBe(55)
  })
})
