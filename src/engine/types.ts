/* ── Player types ─────────────────────────────────────────── */

export const POSITIONS = {
  GK: 'GK',
  LB: 'LB',
  CB: 'CB',
  RB: 'RB',
  CDM: 'CDM',
  CM: 'CM',
  CAM: 'CAM',
  LM: 'LM',
  RM: 'RM',
  LW: 'LW',
  RW: 'RW',
  ST: 'ST',
} as const

export type Position = (typeof POSITIONS)[keyof typeof POSITIONS]

export const DOMINANT_FOOT = { right: 'right', left: 'left', both: 'both' } as const
export type DominantFoot = (typeof DOMINANT_FOOT)[keyof typeof DOMINANT_FOOT]

export type Language = 'ru' | 'lv' | 'en' | 'es'

export type AccountRole = 'player' | 'parent'

export interface PlayerProfile {
  id: string
  familyId: string
  role: AccountRole
  name: string
  birthDate: string // ISO date
  team: string
  positions: Position[]
  dominantFoot: DominantFoot
  language: Language
  photoUrl?: string
  createdAt: string
}

/* ── XP & Levels ──────────────────────────────────────────── */

export interface XpState {
  totalXp: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
  streakDays: number
  lastActivityDate: string // ISO date
}

/* ── Training ─────────────────────────────────────────────── */

export const TRAINING_TYPES = {
  team: 'team',
  individual: 'individual',
  gym: 'gym',
  futsal: 'futsal',
} as const
export type TrainingType = (typeof TRAINING_TYPES)[keyof typeof TRAINING_TYPES]

export const FOCUS_AREAS = {
  technical: 'technical',
  physical: 'physical',
  tactical: 'tactical',
  mental: 'mental',
} as const
export type FocusArea = (typeof FOCUS_AREAS)[keyof typeof FOCUS_AREAS]

/** 1-5 scale: 😴 😐 🙂 😄 🔥 */
export type EnergyLevel = 1 | 2 | 3 | 4 | 5

export interface TrainingEntry {
  id: string
  playerId: string
  date: string
  type: TrainingType
  durationMinutes: number
  focusAreas: FocusArea[]
  energy: EnergyLevel
  mood: EnergyLevel
  notes: string
  exerciseIds: string[]
  fromSchedule?: string // schedule ID if pre-filled
  createdAt: string
}

/* ── Match ────────────────────────────────────────────────── */

export interface MatchEntry {
  id: string
  playerId: string
  tournamentId?: string
  date: string
  opponent: string
  competition: string
  scoreUs: number
  scoreThem: number
  position: Position
  minutesPlayed: number
  goals: number
  assists: number
  shots: number
  keyPasses: number
  tackles: number
  selfRating: number // 1-10
  bestMoment: string
  toImprove: string
  mood: EnergyLevel
  createdAt: string
}

export type MatchResult = 'win' | 'draw' | 'loss'

export function getMatchResult(m: MatchEntry): MatchResult {
  if (m.scoreUs > m.scoreThem) return 'win'
  if (m.scoreUs < m.scoreThem) return 'loss'
  return 'draw'
}

/* ── Tournament ───────────────────────────────────────────── */

export interface Tournament {
  id: string
  playerId: string
  name: string
  startDate: string
  endDate: string
  location: string
  expectedGames: number
  selfRating?: number
  mvpMoment?: string
  completed: boolean
  createdAt: string
}

export interface TournamentSummary {
  tournament: Tournament
  matches: MatchEntry[]
  wins: number
  draws: number
  losses: number
  totalGoals: number
  totalAssists: number
  bestMatch?: MatchEntry
}

/* ── Diary ────────────────────────────────────────────────── */

export interface DiaryEntry {
  id: string
  playerId: string
  date: string
  text: string
  mood: EnergyLevel
  promptsUsed: string[]
  photoUrl?: string
  linkedTrainingIds: string[]
  linkedMatchIds: string[]
  createdAt: string
}

/* ── Skill Tree ───────────────────────────────────────────── */

export const SKILL_CATEGORIES = {
  technical: 'technical',
  physical: 'physical',
  tactical: 'tactical',
  mental: 'mental',
  matchPlay: 'matchPlay',
  knowledge: 'knowledge',
} as const
export type SkillCategory = (typeof SKILL_CATEGORIES)[keyof typeof SKILL_CATEGORIES]

export interface SkillRating {
  category: SkillCategory
  subSkill: string
  rating: number // 1-10
  lastUpdated: string
}

export interface SkillTree {
  playerId: string
  ratings: SkillRating[]
  updatedAt: string
}

/* ── Challenges ───────────────────────────────────────────── */

export const CHALLENGE_STATUS = {
  active: 'active',
  completed: 'completed',
  expired: 'expired',
} as const
export type ChallengeStatus = (typeof CHALLENGE_STATUS)[keyof typeof CHALLENGE_STATUS]

export const CHALLENGE_PERIOD = {
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
  special: 'special',
} as const
export type ChallengePeriod = (typeof CHALLENGE_PERIOD)[keyof typeof CHALLENGE_PERIOD]

export interface Challenge {
  id: string
  titleKey: string // i18n key
  descriptionKey: string
  period: ChallengePeriod
  xpReward: number
  status: ChallengeStatus
  progress: number
  target: number
  expiresAt: string
}

/* ── Exercise Library ─────────────────────────────────────── */

export const METHODOLOGY = {
  coerver: 'coerver',
  horstWein: 'horstWein',
  danAbrahams: 'danAbrahams',
  talentCode: 'talentCode',
  uefa: 'uefa',
} as const
export type Methodology = (typeof METHODOLOGY)[keyof typeof METHODOLOGY]

export const EQUIPMENT = {
  ballOnly: 'ballOnly',
  cones: 'cones',
  wall: 'wall',
  partner: 'partner',
  none: 'none',
} as const
export type Equipment = (typeof EQUIPMENT)[keyof typeof EQUIPMENT]

export interface Exercise {
  id: string
  nameKey: string // i18n key
  descriptionKey: string
  category: SkillCategory
  subSkill: string
  difficulty: 1 | 2 | 3 | 4 | 5
  durationMinutes: number
  equipment: Equipment[]
  positions: Position[] // empty = all positions
  methodology: Methodology
  videoUrl?: string
}

/* ── Schedule (parent-created) ────────────────────────────── */

export const SCHEDULE_TYPE = {
  training: 'training',
  match: 'match',
  tournament: 'tournament',
} as const
export type ScheduleType = (typeof SCHEDULE_TYPE)[keyof typeof SCHEDULE_TYPE]

export interface ScheduleEvent {
  id: string
  familyId: string
  playerId: string
  type: ScheduleType
  title: string
  date: string
  startTime: string // HH:mm
  endTime?: string
  location?: string
  opponent?: string
  competition?: string
  tournamentId?: string
  recurring?: {
    frequency: 'weekly'
    days: number[] // 0=Sun, 1=Mon, etc.
    until: string
  }
  createdBy: string // parent account id
  createdAt: string
}

/* ── Quotes ───────────────────────────────────────────────── */

export const QUOTE_THEMES = {
  motivation: 'motivation',
  hardWork: 'hardWork',
  technique: 'technique',
  mentalStrength: 'mentalStrength',
  teamwork: 'teamwork',
  fun: 'fun',
} as const
export type QuoteTheme = (typeof QUOTE_THEMES)[keyof typeof QUOTE_THEMES]

export interface Quote {
  id: string
  player: string
  themes: QuoteTheme[]
  text: {
    ru: string
    lv: string
    en: string
    es: string
  }
}

/* ── Achievements ─────────────────────────────────────────── */

export interface Achievement {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  unlockedAt?: string
}
