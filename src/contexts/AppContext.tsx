import { useState, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { XpState, PlayerProfile, SkillTree, TrainingEntry, MatchEntry, Tournament, DiaryEntry } from '../engine/types'
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
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

/* ── Provider ─────────────────────────────────────────────── */

const STORAGE_KEY = 'golazo-state'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch { /* ignore corrupted storage */ }
  return {
    profile: null,
    xp: createInitialXpState(),
    skillTree: createInitialSkillTree('default'),
    trainings: [],
    matches: [],
    tournaments: [],
    diary: [],
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  function update(partial: Partial<AppState>) {
    setState((prev) => {
      const next = { ...prev, ...partial }
      saveState(next)
      return next
    })
  }

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
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
