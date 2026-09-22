import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppProvider, useApp } from '../src/contexts/AppContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import { Clubhouse } from '../src/pages/Clubhouse'
import { TrainingLog } from '../src/pages/TrainingLog'
import { createInitialXpState } from '../src/engine/xp'
import i18n from '../src/i18n'
import type { PlayerProfile, TrainingEntry } from '../src/engine/types'

const today = new Date().toISOString().slice(0, 10)
const profile: PlayerProfile = {
  id: 'synthetic-player', familyId: 'fixture', role: 'player', name: 'Alex',
  birthDate: '2014-04-01', team: 'Synthetic club', positions: ['CM'],
  dominantFoot: 'right', language: 'en', createdAt: today,
}
const entry: TrainingEntry = {
  id: 'fixture-entry', playerId: profile.id, date: today, type: 'team',
  durationMinutes: 60, focusAreas: [], energy: 3, mood: 3, notes: '', exerciseIds: [], createdAt: today,
}
const read = () => JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
async function mount(children = <Clubhouse onNavigate={vi.fn()} />) {
  const result = render(<AppProvider><ToastProvider>{children}</ToastProvider></AppProvider>)
  await act(async () => {})
  return result
}

beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('golazo-state', JSON.stringify({
    profile, xp: { ...createInitialXpState(), totalXp: 80, currentLevelXp: 80 },
    trainings: [], onboardingComplete: true,
  }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
  await i18n.changeLanguage('en')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('real training journey', () => {
  it('completes the visible journey with local-save wording and exact real XP', async () => {
    const { container } = await mount()
    fireEvent.click(screen.getByRole('button', { name: /Log this training/ }))
    fireEvent.change(screen.getByLabelText('Duration in minutes'), { target: { value: '60' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(await screen.findByText('Training saved on this device')).toBeInTheDocument()
    expect(screen.queryAllByText(/Couldn't save on this device/)).toHaveLength(0)
    expect(read().trainings).toHaveLength(1)
    expect(read().trainings[0].playerId).toBe(profile.id)
    expect(read().xp.totalXp).toBe(100)
    expect(screen.getByText('+20 XP for this session')).toBeInTheDocument()
    expect(screen.getByText(/does not confirm a cloud save/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Finish for today' }))
    expect(screen.getByText("Today's effort, remembered.")).toBeInTheDocument()
  })

  it('retains all work after a failed local write; retry persists one entry and one award', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mount(<TrainingLog />)
    fireEvent.change(screen.getByLabelText('Duration in minutes'), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('radio', { name: /4.*Good/ }))
    fireEvent.click(screen.getByText('Add a focus or a note (optional)'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Technical' }))
    fireEvent.change(screen.getByLabelText('Notes (optional)'), { target: { value: 'I looked up before a pass.' } })
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Fixture storage full', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button', { name: 'Save training' }))
    expect(screen.getAllByText(/Couldn't save on this device/).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Notes (optional)')).toHaveValue('I looked up before a pass.')
    expect(read().trainings).toHaveLength(0)
    expect(read().xp.totalXp).toBe(80)
    expect(errorLog).toHaveBeenCalled()
    writes.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))
    expect(await screen.findByText('Training saved on this device')).toBeInTheDocument()
    expect(screen.queryAllByText(/Couldn't save on this device/)).toHaveLength(0)
    expect(read().trainings).toHaveLength(1)
    expect(read().trainings[0]).toMatchObject({ durationMinutes: 60, mood: 4, focusAreas: ['technical'], notes: 'I looked up before a pass.' })
    expect(read().xp.totalXp).toBe(100)
  })

  it('rejects missing or fractional duration without awarding XP', async () => {
    const { container } = await mount(<TrainingLog />)
    const field = screen.getByLabelText('Duration in minutes')
    for (const value of ['', '0', '1.5']) {
      fireEvent.change(field, { target: { value } })
      fireEvent.submit(container.querySelector('form')!)
      expect(field).toBeInvalid()
      expect(read().xp.totalXp).toBe(80)
      expect(read().trainings).toHaveLength(0)
    }
  })

  it('persists locally when cloud PUT fails without claiming server confirmation', async () => {
    await mount(<TrainingLog />)
    fireEvent.click(screen.getByRole('button', { name: 'Save training' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/sync', expect.objectContaining({ method: 'PUT' })), { timeout: 3500 })
    expect(read().trainings).toHaveLength(1)
    expect(read().xp.totalXp).toBe(100)
    expect(screen.getByText(/does not confirm a cloud save/)).toBeInTheDocument()
  })

  it('rest reassurance navigates to the real schedule without creating an inactivity entry or XP', async () => {
    const navigate = vi.fn()
    await mount(<Clubhouse onNavigate={navigate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }))
    expect(navigate).toHaveBeenCalledWith('schedule')
    expect(read().trainings).toHaveLength(0)
    expect(read().xp.totalXp).toBe(80)
  })

  it.each(['ru', 'lv', 'en', 'es'])('shows translated fields and completion in %s', async language => {
    await i18n.changeLanguage(language)
    await mount(<TrainingLog />)
    expect(screen.getByLabelText(i18n.t('training.durationLabel'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('training.saveLocal') }))
    expect(await screen.findByText(i18n.t('training.savedLocal'))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: i18n.t('training.onTheBoard') })).toBeInTheDocument()
  })

  it('provider serializes same-turn saves against the latest state, not a stale React closure', async () => {
    function Probe() {
      const { saveTraining, setXp, xp } = useApp()
      return <button onClick={() => {
        setXp(previous => ({ ...previous, totalXp: previous.totalXp + 5 }))
        saveTraining(entry)
        saveTraining(entry)
      }}>Atomic save {xp.totalXp}</button>
    }
    await mount(<Probe />)
    fireEvent.click(screen.getByRole('button', { name: 'Atomic save 80' }))
    expect(read().xp.totalXp).toBe(105)
    expect(read().trainings).toHaveLength(1)
  })
})
