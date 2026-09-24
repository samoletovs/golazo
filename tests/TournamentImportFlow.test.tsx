import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProvider, useApp } from '../src/contexts/AppContext'
import { prepareTournamentImport } from '../src/engine/tournamentImport'
import type { ScheduleEvent, Tournament } from '../src/engine/types'

const tournament: Tournament = {
  id: 'stable-import', playerId: 'synthetic-player', name: 'Fictional Cup',
  startDate: '2026-09-27', endDate: '2026-09-27', location: 'Fictional pitch',
  expectedGames: 2, completed: false, sourceUrl: 'https://example.invalid/tournament',
  rules: { matchDuration: 40 }, createdAt: '2026-09-23',
}
const events: ScheduleEvent[] = ['10:00', '12:00'].map((startTime, index) => ({
  id: `stable-import-game-${index}`, familyId: 'fixture', playerId: 'synthetic-player',
  type: 'match', title: `Fictional fixture ${index + 1}`, date: '2026-09-27', startTime,
  opponent: `Fictional opponent ${index + 1}`, tournamentId: tournament.id,
  createdBy: 'synthetic-player', createdAt: '2026-09-23',
}))
const read = () => JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('golazo-state', JSON.stringify({ tournaments: [], schedule: [] }))
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('tournament fixture persistence', () => {
  it('keeps every imported fixture and adds no duplicate on repeated draft submission', () => {
    const first = prepareTournamentImport({ tournaments: [], schedule: [] }, tournament, events)
    expect(first.schedule.map(event => event.id)).toEqual(['stable-import-game-0', 'stable-import-game-1'])
    const repeated = prepareTournamentImport(first, tournament, events)
    expect(repeated.tournaments).toHaveLength(1)
    expect(repeated.schedule).toHaveLength(2)
    expect(repeated.alreadySaved).toBe(true)
    expect(repeated.addedGames).toBe(0)
  })

  it('rejects mismatched or duplicate fixture IDs before publishing any data', () => {
    const state = { tournaments: [], schedule: [] }
    expect(() => prepareTournamentImport(state, tournament, [{ ...events[0], tournamentId: 'wrong' }])).toThrow()
    expect(() => prepareTournamentImport(state, tournament, [events[0], events[0]])).toThrow()
    expect(state.tournaments).toHaveLength(0)
    expect(state.schedule).toHaveLength(0)
  })

  it('rolls back the whole local import on failure and retries one tournament with all its games', () => {
    function Probe() {
      const { saveTournamentImport } = useApp()
      return <button onClick={() => {
        try { saveTournamentImport(tournament, events) } catch { /* Expected synthetic storage failure. */ }
      }}>Import fixtures</button>
    }
    render(<AppProvider><Probe /></AppProvider>)
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic quota failure', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button', { name: 'Import fixtures' }))
    expect(read().tournaments).toHaveLength(0)
    expect(read().schedule).toHaveLength(0)
    writes.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: 'Import fixtures' }))
    fireEvent.click(screen.getByRole('button', { name: 'Import fixtures' }))
    expect(read().tournaments).toHaveLength(1)
    expect(read().schedule).toHaveLength(2)
    expect(read().xp.totalXp).toBe(0)
  })

  it('preserves sequential scheduled writes made in one React event instead of keeping only the last', () => {
    function Probe() {
      const { addTournament, addScheduleEvent } = useApp()
      return <button onClick={() => { addTournament(tournament); for (const event of events) addScheduleEvent(event) }}>Schedule fixtures</button>
    }
    render(<AppProvider><Probe /></AppProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Schedule fixtures' }))
    expect(read().tournaments).toHaveLength(1)
    expect(read().schedule.map((event: ScheduleEvent) => event.id)).toEqual(events.map(event => event.id))
  })
})
