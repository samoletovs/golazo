import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProvider } from '../src/contexts/AppContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import { ActivityHistory } from '../src/components/academy/ActivityHistory'
import { Profile } from '../src/pages/Profile'
import { LogPage } from '../src/pages/LogPage'
import { TRAINING_SKIP_REASONS } from '../src/engine/types'
import { ChartDataTable } from '../src/components/academy/ChartDataTable'
import { createInitialXpState } from '../src/engine/xp'
import i18n from '../src/i18n'
import type { ReactNode } from 'react'

const original = {
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close'),
}
beforeAll(() => {
  // jsdom has no modal top layer; real keyboard/focus is verified in Chromium.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.open = false } })
})
afterAll(() => {
  for (const name of ['showModal', 'close'] as const) {
    const descriptor = original[name]
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  }
})
function mount(children: ReactNode) {
  render(<AppProvider><ToastProvider>{children}</ToastProvider></AppProvider>)
}
beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('golazo-state', JSON.stringify({
    profile: { id: 'synthetic-player', familyId: 'fixture', role: 'player', name: 'Fictional Player 07', birthDate: '2014-04-01', positions: ['CM'], dominantFoot: 'right', language: 'en', team: 'Fictional club', createdAt: '2026-09-01' },
    xp: { ...createInitialXpState(), totalXp: 80, currentLevelXp: 80 },
    trainings: [{ id: 'training', playerId: 'synthetic-player', date: '2026-09-22', type: 'team', durationMinutes: 60, focusAreas: ['technical'], energy: 3, mood: 4, notes: 'Looked up before passing.', exerciseIds: [], createdAt: '2026-09-22T18:00:00Z' }],
    diary: [
      { id: 'own-diary', playerId: 'synthetic-player', date: '2026-09-22', text: 'My private reflection.', mood: 4, promptsUsed: [], linkedTrainingIds: [], linkedMatchIds: [], aiConsent: false, createdAt: '2026-09-22T19:00:00Z' },
      { id: 'other-diary', playerId: 'another-player', date: '2026-09-23', text: 'ANOTHER_PLAYER_PRIVATE_ENTRY', mood: 3, promptsUsed: [], linkedTrainingIds: [], linkedMatchIds: [], createdAt: '2026-09-23T19:00:00Z' },
    ],
  }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await i18n.changeLanguage('en')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('inventoried Academy detail surfaces', () => {
  it('opens stored training fields without modifying data or awarding XP', () => {
    const before = localStorage.getItem('golazo-state')
    mount(<ActivityHistory />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(i18n.t('training.type.team')) }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Looked up before passing.')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('academy.recordReadOnly'))).toBeInTheDocument()
    expect(localStorage.getItem('golazo-state')).toBe(before)
  })

  it('shows only the current player’s diary entry in the private journal', () => {
    mount(<ActivityHistory />)
    const diaries = screen.getAllByRole('button', { name: /Diary/ })
    expect(diaries).toHaveLength(1)
    fireEvent.click(diaries[0])
    expect(screen.getByText('My private reflection.')).toBeInTheDocument()
    expect(screen.queryByText('ANOTHER_PLAYER_PRIVATE_ENTRY')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: i18n.t('diary.aiConsent') })).not.toBeChecked()
  })

  it('reviews legacy single-position match records without rewriting their shape or rewards', () => {
    const state = JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
    state.matches = [{ id: 'legacy-match', playerId: 'default', date: '2026-09-21', opponent: 'Fictional Eastbank', scoreUs: 2, scoreThem: 1, goals: 1, assists: 0, shots: 2, keyPasses: 1, tackles: 2, position: 'CM', minutesPlayed: 40, selfRating: 7, mood: 4, bestMoment: 'Found space for a teammate.', toImprove: '', competition: '', createdAt: '2026-09-21T18:00:00Z' }]
    localStorage.setItem('golazo-state', JSON.stringify(state))
    const before = localStorage.getItem('golazo-state')
    mount(<ActivityHistory />)
    fireEvent.click(screen.getByRole('button', { name: /Fictional Eastbank/ }))
    expect(screen.getByText('CM')).toBeInTheDocument()
    expect(screen.getByText('Found space for a teammate.')).toBeInTheDocument()
    expect(localStorage.getItem('golazo-state')).toBe(before)
  })

  it('edits existing identity fields through Profile, retains failure input and preserves logs and XP', () => {
    mount(<Profile />)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.editIdentity') }))
    const name = screen.getByLabelText(i18n.t('onboarding.name'))
    fireEvent.change(name, { target: { value: 'Fictional Player With A Long Name' } })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic storage failure', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.save'), exact: true }))
    expect(name).toHaveValue('Fictional Player With A Long Name')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    write.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.save'), exact: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryAllByText(i18n.t('academy.saveError'))).toHaveLength(0)
    const saved = JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
    expect(saved.profile.name).toBe('Fictional Player With A Long Name')
    expect(saved.profile.id).toBe('synthetic-player')
    expect(saved.trainings).toHaveLength(1)
    expect(saved.diary).toHaveLength(2)
    expect(saved.xp.totalXp).toBe(80)
  })

  it('offers actual chart values in a native expandable table', () => {
    mount(<ChartDataTable title="Recorded fixture sessions" rows={[{ week: '2026-09-21', sessions: 3 }]} columns={[{ key: 'week', label: 'Week' }, { key: 'sessions', label: 'Sessions' }]} />)
    fireEvent.click(screen.getByText(i18n.t('academy.viewData'), { selector: 'summary' }))
    expect(screen.getByRole('table', { name: 'Recorded fixture sessions' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '3' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '2026-09-21' })).toBeInTheDocument()
  })

  it('retains a missed-session choice and rolls back its reason when the local skip write fails', () => {
    const state = JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
    const today = new Date().toISOString().slice(0, 10)
    state.schedule = [{ id: 'skip-fixture', type: 'training', title: 'Fictional scheduled session', date: today, startTime: '17:00', endTime: '18:00', trainingType: 'team' }]
    localStorage.setItem('golazo-state', JSON.stringify(state))
    const previousReasons = JSON.stringify({ older: { reason: 'fixture', date: '2026-09-01' } })
    localStorage.setItem('golazo-skip-reasons', previousReasons)
    mount(<LogPage />)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('log.skip'), exact: true }))
    const originalWrite = Storage.prototype.setItem
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'golazo-skipped-events') throw new DOMException('Synthetic storage failure', 'QuotaExceededError')
      originalWrite.call(this, key, value)
    })
    const reason = TRAINING_SKIP_REASONS[0].key
    fireEvent.click(screen.getByRole('button', { name: i18n.t(`log.reason.${reason}`), exact: true }))
    expect(screen.getByText('Fictional scheduled session')).toBeInTheDocument()
    expect(localStorage.getItem('golazo-skipped-events')).toBeNull()
    expect(localStorage.getItem('golazo-skip-reasons')).toBe(previousReasons)
    writes.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('training.retry'), exact: true }))
    expect(JSON.parse(localStorage.getItem('golazo-skipped-events') ?? '[]')).toEqual(['skip-fixture'])
    expect(JSON.parse(localStorage.getItem('golazo-skip-reasons') ?? '{}')['skip-fixture'].reason).toBe(reason)
    expect(JSON.parse(localStorage.getItem('golazo-state') ?? '{}').xp.totalXp).toBe(80)
    expect(JSON.parse(localStorage.getItem('golazo-state') ?? '{}').trainings).toHaveLength(1)
  })
})
