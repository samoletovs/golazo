import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { XpState, PlayerProfile, SkillTree, TrainingEntry, MatchEntry, Tournament, DiaryEntry, ScheduleEvent, SpecialChallengeProgress, PhysicalProfile, RecurringTraining, DailyCheckIn, QuizAnswer, ReadArticle, ProgramProgress, UserDrill } from '../engine/types'
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
  checkIns: DailyCheckIn[]
  quizAnswers: QuizAnswer[]
  readArticles: ReadArticle[]
  savedExercises: string[] // exercise IDs
  programProgress: ProgramProgress[]
  userDrills: UserDrill[]
  onboardingComplete: boolean
}

interface AppContextValue extends AppState {
  syncing: boolean
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
  addCheckIn: (c: DailyCheckIn) => void
  addQuizAnswer: (q: QuizAnswer) => void
  markArticleRead: (r: ReadArticle) => void
  toggleSavedExercise: (id: string) => void
  updateProgramProgress: (p: ProgramProgress) => void
  addUserDrill: (d: UserDrill) => void
  deleteUserDrill: (id: string) => void
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
        recurringTrainings: state.recurringTrainings,
        specialChallenges: state.specialChallenges,
        physicalProfile: state.physicalProfile,
        checkIns: state.checkIns,
        quizAnswers: state.quizAnswers,
        readArticles: state.readArticles,
        savedExercises: state.savedExercises,
        programProgress: state.programProgress,
        userDrills: state.userDrills,
        onboardingComplete: state.onboardingComplete,
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
    if (raw) {
      const parsed = JSON.parse(raw)
      // Merge with defaults to handle newly added fields
      const merged = { ...createDefaultState(), ...parsed }
      // Ensure new array fields are never undefined (old localStorage won't have them)
      merged.checkIns = merged.checkIns ?? []
      merged.quizAnswers = merged.quizAnswers ?? []
      merged.readArticles = merged.readArticles ?? []
      merged.savedExercises = merged.savedExercises ?? []
      merged.programProgress = merged.programProgress ?? []
      merged.recurringTrainings = merged.recurringTrainings ?? []
      merged.userDrills = merged.userDrills ?? []
      return merged
    }
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
    checkIns: [],
    quizAnswers: [],
    readArticles: [],
    savedExercises: [],
    programProgress: [],
    userDrills: [],
    onboardingComplete: false,
  }
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const [syncing, setSyncing] = useState(true)
  const syncTimerRef = useRef<number>(0)
  const latestStateRef = useRef(state)

  useEffect(() => {
    latestStateRef.current = state
  }, [state])

  // Try to sync from API on mount (offline-first: localStorage is always the fallback)
  useEffect(() => {
    syncFromApi().then((remote) => {
      if (remote && remote.profile) {
        setState((prev) => {
          const merged = { ...prev, ...remote, onboardingComplete: prev.onboardingComplete || !!remote.profile || (remote as Record<string, unknown>).onboardingComplete === true }
          // Preserve local arrays — use remote if available, fall back to local
          merged.checkIns = (remote.checkIns?.length ? remote.checkIns : null) ?? prev.checkIns ?? []
          merged.quizAnswers = (remote.quizAnswers?.length ? remote.quizAnswers : null) ?? prev.quizAnswers ?? []
          merged.readArticles = (remote.readArticles?.length ? remote.readArticles : null) ?? prev.readArticles ?? []
          merged.savedExercises = merged.savedExercises ?? prev.savedExercises ?? []
          merged.programProgress = (remote.programProgress?.length ? remote.programProgress : null) ?? prev.programProgress ?? []
          merged.recurringTrainings = (remote.recurringTrainings?.length ? remote.recurringTrainings : null) ?? prev.recurringTrainings ?? []
          merged.schedule = (remote.schedule?.length ? remote.schedule : null) ?? prev.schedule ?? []
          merged.trainings = (remote.trainings?.length ? remote.trainings : null) ?? prev.trainings ?? []
          merged.matches = (remote.matches?.length ? remote.matches : null) ?? prev.matches ?? []
          merged.tournaments = (remote.tournaments?.length ? remote.tournaments : null) ?? prev.tournaments ?? []
          merged.userDrills = (remote.userDrills?.length ? remote.userDrills : null) ?? prev.userDrills ?? []
          saveState(merged)
          return merged
        })
      }
    }).finally(() => setSyncing(false))
    return () => window.clearTimeout(syncTimerRef.current)
  }, [])

  // Force sync before page unload (prevents losing the last 2s of changes)
  useEffect(() => {
    function handleBeforeUnload() {
      window.clearTimeout(syncTimerRef.current)
      const latestState = latestStateRef.current
      // Use sendBeacon for reliable sync on page close
      const body = JSON.stringify({
        profile: latestState.profile,
        xp: latestState.xp,
        onboardingComplete: latestState.onboardingComplete,
      })
      navigator.sendBeacon?.('/api/sync', new Blob([body], { type: 'application/json' }))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  function update(partial: Partial<AppState>) {
    setState((prev) => {
      const next = { ...prev, ...partial }
      saveState(next)
      // Auto-sync to cloud after 2s debounce (non-blocking)
      window.clearTimeout(syncTimerRef.current)
      syncTimerRef.current = window.setTimeout(() => syncToApi(next), 2000)
      return next
    })
  }

  const syncToCloud = useCallback(async () => {
    await syncToApi(state)
  }, [state])

  const value: AppContextValue = {
    ...state,
    syncing,
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
    addCheckIn: (c) => update({ checkIns: [...state.checkIns, c] }),
    addQuizAnswer: (q) => update({ quizAnswers: [...state.quizAnswers, q] }),
    markArticleRead: (r) => update({ readArticles: [...state.readArticles.filter(a => a.articleId !== r.articleId), r] }),
    toggleSavedExercise: (id) => update({
      savedExercises: state.savedExercises.includes(id)
        ? state.savedExercises.filter(e => e !== id)
        : [...state.savedExercises, id],
    }),
    updateProgramProgress: (p) => update({
      programProgress: [
        ...state.programProgress.filter(x => x.programId !== p.programId),
        p,
      ],
    }),
    addUserDrill: (d) => update({ userDrills: [...state.userDrills, d] }),
    deleteUserDrill: (id) => update({ userDrills: state.userDrills.filter(d => d.id !== id) }),
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
