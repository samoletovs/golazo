import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { XpState, PlayerProfile, SkillTree, TrainingEntry, MatchEntry, Tournament, DiaryEntry, ScheduleEvent, SpecialChallengeProgress, PhysicalProfile, RecurringTraining } from '../engine/types'
import { createInitialXpState } from '../engine/xp'
import { createInitialSkillTree } from '../engine/skills'

/* ── App state ────────────────────────────────────────────── */

interface AppState {
  profile: PlayerProfile | null
  xp: XpState
  skillTree: SkillTree
  trainings: TrainingEntry[]
  matches: MatchEntry[]
  tournaments: Tournament[]
  diary: DiaryEntry[]
  schedule: ScheduleEvent[]
  recurringTrainings: RecurringTraining[]
  specialChallenges: SpecialChallengeProgress[]
  physicalProfile: PhysicalProfile | null
  onboardingComplete: boolean
}

interface AppContextValue extends AppState {
  setProfile: (p: PlayerProfile) => void
  setXp: (xp: XpState) => void
  setSkillTree: (st: SkillTree) => void
  addTraining: (t: TrainingEntry) => void
  addMatch: (m: MatchEntry) => void
  addTournament: (t: Tournament) => void
  updateTournament: (t: Tournament) => void
  addDiary: (d: DiaryEntry) => void
  addScheduleEvent: (e: ScheduleEvent) => void
  removeScheduleEvent: (id: string) => void
  setRecurringTrainings: (rt: RecurringTraining[]) => void
  setSpecialChallenges: (sc: SpecialChallengeProgress[]) => void
  setPhysicalProfile: (pp: PhysicalProfile) => void
  setOnboardingComplete: (v: boolean) => void
  syncToCloud: () => Promise<void>
  resetState: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

/* ── API sync ─────────────────────────────────────────────── */

async function syncFromApi(): Promise<Partial<AppState> | null> {
  try {
    const res = await fetch('/api/sync')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null // Offline — use localStorage
  }
}

async function syncToApi(state: AppState): Promise<void> {
  try {
    await fetch('/api/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: state.profile,
        xp: state.xp,
        skillTree: state.skillTree,
        trainings: state.trainings,
        matches: state.matches,
        tournaments: state.tournaments,
        diary: state.diary,
        schedule: state.schedule,
        specialChallenges: state.specialChallenges,
        physicalProfile: state.physicalProfile,
      }),
    })
  } catch {
    // Offline — data saved in localStorage, will sync later
  }
}

/* ── Provider ─────────────────────────────────────────────── */

const STORAGE_KEY = 'golazo-state'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch { /* ignore corrupted storage */ }
  return createDefaultState()
}

function createDefaultState(): AppState {
  return {
    profile: null,
    xp: createInitialXpState(),
    skillTree: createInitialSkillTree('default'),
    trainings: [],
    matches: [],
    tournaments: [],
    diary: [],
    schedule: [],
    recurringTrainings: [],
    specialChallenges: [],
    physicalProfile: null,
    onboardingComplete: false,
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  // Try to sync from API on mount (offline-first: localStorage is always the fallback)
  useEffect(() => {
    syncFromApi().then((remote) => {
      if (remote && remote.profile) {
        setState((prev) => {
          const merged = { ...prev, ...remote, onboardingComplete: prev.onboardingComplete || !!remote.profile }
          saveState(merged)
          return merged
        })
      }
    })
  }, [])

  function update(partial: Partial<AppState>) {
    setState((prev) => {
      const next = { ...prev, ...partial }
      saveState(next)
      return next
    })
  }

  const syncToCloud = useCallback(async () => {
    await syncToApi(state)
  }, [state])

  const value: AppContextValue = {
    ...state,
    setProfile: (p) => update({ profile: p }),
    setXp: (xp) => update({ xp }),
    setSkillTree: (st) => update({ skillTree: st }),
    addTraining: (t) => update({ trainings: [...state.trainings, t] }),
    addMatch: (m) => update({ matches: [...state.matches, m] }),
    addTournament: (t) => update({ tournaments: [...state.tournaments, t] }),
    updateTournament: (t) => update({ tournaments: state.tournaments.map((x) => (x.id === t.id ? t : x)) }),
    addDiary: (d) => update({ diary: [...state.diary, d] }),
    addScheduleEvent: (e) => update({ schedule: [...state.schedule, e] }),
    removeScheduleEvent: (id) => update({ schedule: state.schedule.filter((e) => e.id !== id) }),
    setRecurringTrainings: (rt) => update({ recurringTrainings: rt }),
    setSpecialChallenges: (sc) => update({ specialChallenges: sc }),
    setPhysicalProfile: (pp) => update({ physicalProfile: pp }),
    setOnboardingComplete: (v) => update({ onboardingComplete: v }),
    syncToCloud,
    resetState: () => {
      const fresh = createDefaultState()
      setState(fresh)
      saveState(fresh)
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
