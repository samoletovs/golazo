import type { ScheduleEvent, Tournament } from './types'

interface ImportState {
  tournaments: Tournament[]
  schedule: ScheduleEvent[]
}

export function prepareTournamentImport(state: ImportState, tournament: Tournament, events: ScheduleEvent[]) {
  const existing = state.tournaments.find(item => item.id === tournament.id)
  if (existing) return { tournaments: state.tournaments, schedule: state.schedule, addedGames: 0, alreadySaved: true }
  const ids = new Set(state.schedule.map(event => event.id))
  for (const event of events) {
    if (event.tournamentId !== tournament.id || event.playerId !== tournament.playerId || ids.has(event.id)) {
      throw new Error('Imported fixtures must have unique IDs and belong to their tournament and player')
    }
    ids.add(event.id)
  }
  return { tournaments: [...state.tournaments, tournament], schedule: [...state.schedule, ...events], addedGames: events.length, alreadySaved: false }
}
