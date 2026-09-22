import { getAgeTier } from './types'
import type { PlayerProfile, TrainingEntry, XpState } from './types'
import { awardXp, XP_AWARDS } from './xp'

export interface TrainingReceipt {
  entry: TrainingEntry
  previousXp: XpState
  xp: XpState
  awardedXp: number
  alreadySaved: boolean
}

interface TrainingState {
  profile: PlayerProfile | null
  trainings: TrainingEntry[]
  xp: XpState
}

export function prepareTrainingSave(state: TrainingState, entry: TrainingEntry) {
  const existing = state.trainings.find(item => item.id === entry.id || (
    entry.fromSchedule && item.fromSchedule === entry.fromSchedule && item.date === entry.date
    && (item.playerId === entry.playerId || item.playerId === 'default')
  ))
  const xp = existing ? state.xp : awardXp(
    state.xp, XP_AWARDS.logTraining, entry.date,
    state.profile?.birthDate ? getAgeTier(state.profile.birthDate) : undefined,
  )
  const receipt: TrainingReceipt = {
    entry: existing ?? entry, previousXp: state.xp, xp,
    awardedXp: xp.totalXp - state.xp.totalXp, alreadySaved: Boolean(existing),
  }
  return { trainings: existing ? state.trainings : [...state.trainings, entry], xp, receipt }
}

export function trainingSummary(trainings: TrainingEntry[], today = new Date().toISOString().slice(0, 10)) {
  const start = new Date(`${today}T12:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 6)
  const firstDay = start.toISOString().slice(0, 10)
  const recent = trainings.filter(entry => entry.date.slice(0, 10) >= firstDay && entry.date.slice(0, 10) <= today)
  return { sessions: recent.length, minutes: recent.reduce((total, entry) => total + entry.durationMinutes, 0) }
}
