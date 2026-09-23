import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SquadRoster } from '../src/pages/SquadRoster'
import { TrainingPlanner } from '../src/pages/TrainingPlanner'
import { AttendanceGrid } from '../src/components/AttendanceGrid'
import { CoachStatsPage } from '../src/pages/CoachStatsPage'
import { ToastProvider } from '../src/contexts/ToastContext'
import i18n from '../src/i18n'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Academy supporting role states', () => {
  it('distinguishes a failed roster read from an empty roster and retries', async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValueOnce(new Response(JSON.stringify({ players: [{
      playerId: 'synthetic-player', playerName: 'Fictional Player 07', birthDate: '2014-04-01', positions: ['CM'], joinedAt: '2026-09-01', active: true,
    }] }), { status: 200 }))
    vi.stubGlobal('fetch', request)
    render(<SquadRoster teamId="fixture" teamName="Fictional club" onBack={vi.fn()} onEvaluate={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('academy.loadError'))
    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.retry') }))
    expect(await screen.findByText('Fictional Player 07')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('retains the coach training draft on HTTP failure instead of announcing a save', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })))
    const back = vi.fn()
    render(<ToastProvider><TrainingPlanner teamId="fixture" teamName="Fictional club" coachId="synthetic-coach" onBack={back} /></ToastProvider>)
    const title = screen.getByPlaceholderText(i18n.t('coach.training.title'))
    fireEvent.change(title, { target: { value: 'Fictional receiving session' } })
    fireEvent.click(screen.getByRole('button', { name: `✓ ${i18n.t('coach.training.saved').replace('!', '')}` }))
    expect((await screen.findAllByText(i18n.t('academy.remoteSaveError'))).length).toBeGreaterThan(0)
    expect(title).toHaveValue('Fictional receiving session')
    expect(back).not.toHaveBeenCalled()
  })

  it('does not show measured zeroes or equal-weight invented charts for unavailable coach analytics', () => {
    render(<CoachStatsPage squads={[{ teamId: 'fixture', teamName: 'Fictional club', clubName: 'Fictional club', role: 'head', claimedAt: '2026-09-01', verified: false }]} selectedIds={[]} onToggleSquad={vi.fn()} />)
    expect(screen.getByRole('heading', { name: i18n.t('academy.statisticsUnavailable') })).toBeInTheDocument()
    expect(screen.getByText(i18n.t('academy.statisticsUnavailableBody'))).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('coach.dashboard.noAlerts'))).not.toBeInTheDocument()
  })

  it('labels attendance defaults as a draft and reports HTTP save failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => init?.method === 'POST'
      ? new Response('{}', { status: 503 })
      : new Response(JSON.stringify({ players: [{ playerId: 'synthetic-player', playerName: 'Fictional Player 07', positions: ['CM'], active: true }] }), { status: 200 })))
    render(<AttendanceGrid teamId="fixture" teamName="Fictional club" coachId="synthetic-coach" onBack={vi.fn()} />)
    expect(await screen.findByText('Fictional Player 07')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('academy.attendanceDraft'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common.save'), exact: true }))
    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('academy.remoteSaveError'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
