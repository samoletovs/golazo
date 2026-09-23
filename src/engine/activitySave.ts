import { getAgeTier } from './types'
import type { DiaryEntry, MatchEntry, PlayerProfile, XpState } from './types'
import { awardXp, XP_AWARDS } from './xp'

export interface ActivityReceipt {
  awardedXp: number
  alreadySaved: boolean
}

interface ActivityState {
  profile: PlayerProfile | null
  xp: XpState
}

export function prepareMatchSave(state: ActivityState & { matches: MatchEntry[] }, entry: MatchEntry) {
  const existing = state.matches.some(item => item.id === entry.id)
  const amount = XP_AWARDS.logMatch + (entry.selfRating <= 4 && entry.toImprove.length > 0 ? XP_AWARDS.growthXp : 0)
  const xp = existing ? state.xp : awardXp(state.xp, amount, entry.date, state.profile?.birthDate ? getAgeTier(state.profile.birthDate) : undefined)
  return { matches: existing ? state.matches : [...state.matches, entry], xp, receipt: { awardedXp: xp.totalXp - state.xp.totalXp, alreadySaved: existing } }
}

export function prepareDiarySave(state: ActivityState & { diary: DiaryEntry[] }, entry: DiaryEntry) {
  const existing = state.diary.some(item => item.id === entry.id)
  const xp = existing ? state.xp : awardXp(state.xp, XP_AWARDS.diaryEntry, entry.date, state.profile?.birthDate ? getAgeTier(state.profile.birthDate) : undefined)
  return { diary: existing ? state.diary : [...state.diary, entry], xp, receipt: { awardedXp: xp.totalXp - state.xp.totalXp, alreadySaved: existing } }
}
