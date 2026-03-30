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

export type Language = 'ru' | 'lv' | 'en' | 'es' | 'lt' | 'et'

export type AccountRole = 'player' | 'mentor'

export interface PlayerProfile {
  id: string
  familyId: string
  role: AccountRole
  name: string
  birthDate: string // ISO date
  country?: string  // ISO 3166-1 alpha-2
  city?: string
  team: string
  jerseyNumber?: number
  teams?: PlayerTeam[]
  positions: Position[]
  dominantFoot: DominantFoot
  language: Language
  photoUrl?: string
  createdAt: string
}

/* ── Player Teams ─────────────────────────────────────────── */

export interface PlayerTeam {
  id: string
  name: string
  aliases: string[]  // alternative names (tournament names, merged names)
  website?: string   // team homepage URL
  logoUrl?: string   // team logo (fetched from website or manual)
  shortInfo?: string // brief description from website
  registryId?: string // link to SharedTeam in shared registry
  isPrimary?: boolean // main team
  colors?: string[]  // hex codes from SharedTeam (for app theming)
  active: boolean
  createdAt: string
}

/* ── Shared Team Registry ─────────────────────────────────── */

export type TeamType = 'club' | 'academy' | 'squad'

export interface SharedTeam {
  id: string
  country: string              // ISO 3166-1 alpha-2 (partition key)
  name: string                 // Official club name
  abbreviation?: string        // "RFS", "MNSS", etc.
  aliases: string[]            // Tournament names, historical names
  type?: TeamType              // 'club' (pro), 'academy' (youth school), 'squad' (year/team)
  city?: string
  website?: string
  logoUrl?: string
  colors?: string[]            // Hex codes
  foundedYear?: number
  league?: string              // "Virsliga", "Premium Liiga", etc.
  ageGroups?: string[]         // "U7","U9",..."U19","Senior","Women"
  socialMedia?: { platform: string; url: string }[]
  stadium?: string
  parentClubId?: string        // Academy → parent club, Squad → parent academy
  birthYear?: number           // Squad birth year (e.g. 2014)
  squadLabel?: string          // Squad label: "A", "B", "1", "2"
  regCode?: string             // Government registry code
  verified: boolean
  verifiedAt?: string
  addedBy: 'system' | 'user'
  createdAt: string
  updatedAt: string
}

/* ── XP & Levels ──────────────────────────────────────────── */

export interface XpState {
  totalXp: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
  streakDays: number
  lastActivityDate: string // ISO date
  checkInStreakDays: number
  lastCheckInDate: string // ISO date
}

/* ── Training ─────────────────────────────────────────────── */

export const TRAINING_TYPES = {
  team: 'team',
  individual: 'individual',
  technical: 'technical',
  tactical: 'tactical',
  physical: 'physical',
  gym: 'gym',
  recovery: 'recovery',
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
  playingFor?: string    // team name the player played for
  date: string
  opponent: string
  competition: string
  scoreUs: number
  scoreThem: number
  position: Position | Position[]
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

export interface TournamentRules {
  format?: string            // 'round-robin' | 'groups+playoff' | 'knockout'
  matchDuration?: number     // minutes
  playersPerSide?: number    // 5, 7, 8, 11
}

/** Shared tournament — visible to all players, created on first import. */
export interface SharedTournament {
  id: string
  sourceUrl: string           // tournament page URL (partition key in Cosmos)
  name: string                // "NORDIC SPRING CUP"
  classes: string[]           // ["2013A", "2014A", "2014B"]
  startDate: string
  endDate: string
  location: string
  status: 'upcoming' | 'live' | 'completed'
  rules?: TournamentRules
  organizer?: string
  games: Record<string, SharedTournamentGame[]> // keyed by class name
  participants: SharedTournamentParticipant[]
  lastScrapedAt?: string
  createdBy: string           // userId of first importer
  createdAt: string
}

export interface SharedTournamentGame {
  date: string                // DD.MM
  time: string                // HH:MM
  home: string
  away: string
  venue: string
  homeScore?: number
  awayScore?: number
  penalties?: string          // "3-4"
  stage: 'group' | 'playoff' | 'final' | 'unknown'
  finished: boolean
}

export interface SharedTournamentParticipant {
  userId: string
  playerId: string
  teamName: string            // as it appears in fixtures: "RĪGAS FS"
  className: string           // "2013A"
  joinedAt: string
}

/** Per-player tournament — links to shared + holds personal reflections. */
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
  sourceUrl?: string          // tournament page URL (enables background enrichment)
  sharedTournamentId?: string // links to SharedTournament.id
  className?: string          // age class: "2013A", "2014B"
  birthYear?: number          // parsed from class: 2013, 2014
  rules?: TournamentRules
  organizer?: string
  enrichedAt?: string         // set when background agent processes full results
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
  moodContext?: string // training, match, school, friends, family
  aiConsent?: boolean // true = AI coach can read this entry
  createdAt: string
}

/* ── Skill Tree ───────────────────────────────────────────── */

export const SKILL_CATEGORIES = {
  technical: 'technical',
  physical: 'physical',
  tactical: 'tactical',
  mental: 'mental',
  performance: 'performance',
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
  thumbnailUrl?: string
  source?: 'curated' | 'generated'
}

export interface CompletedExercise {
  exerciseId: string
  date: string // ISO date
  durationActual?: number // minutes
  rating?: 1 | 2 | 3 | 4 | 5
  completedAt: string // ISO timestamp
}

/* ── Schedule (player or mentor-created) ──────────────────── */

export const SCHEDULE_TYPE = {
  training: 'training',
  match: 'match',
  tournament: 'tournament',
  event: 'event',
} as const
export type ScheduleType = (typeof SCHEDULE_TYPE)[keyof typeof SCHEDULE_TYPE]

/* ── Recurring Training ───────────────────────────────────── */

export interface RecurringTraining {
  id: string
  name: string            // "Team training", "Individual", "Gym"
  trainingType: TrainingType
  dayOfWeek: number       // 0=Sun ... 6=Sat
  startTime: string       // "19:00"
  endTime: string         // "21:00"
  location?: string
  active: boolean
  createdAt: string
}

export const MATCH_TYPE = {
  friendly: 'friendly',
  league: 'league',
  cup: 'cup',
  tournament: 'tournament',
  playoff: 'playoff',
  futsal: 'futsal',
} as const
export type MatchType = (typeof MATCH_TYPE)[keyof typeof MATCH_TYPE]

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
  matchType?: MatchType
  trainingType?: TrainingType
  notes?: string
  tournamentId?: string
  recurring?: {
    frequency: 'weekly'
    days: number[] // 0=Sun, 1=Mon, etc.
    until: string
  }
  createdBy: string // account id (player or mentor)
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
    lt: string
    et: string
  }
}

/* ── Physical Profile (measured during onboarding & over time) */

export type AgeTier = 'u8' | 'u12' | 'u16' | 'u19plus'

export interface PhysicalMeasurement {
  heightCm: number
  weightKg: number
  sittingHeightCm?: number // sitting height for PHV tracking (U10+)
  shoeSize?: number // EU shoe size
  sprintTime10m?: number // 10m sprint in seconds (acceleration)
  sprintTime20m?: number // 20m sprint in seconds (acceleration)
  sprintTime30m?: number // 30m sprint in seconds
  standingJumpCm?: number // standing long jump distance in cm (U8-U12)
  cmjCm?: number // countermovement jump height in cm (U12+)
  verticalJumpCm?: number // vertical jump height in cm (U16+)
  yoyoIR1Level?: number // Yo-Yo IR1 level (e.g. 15.2) — football standard
  agilityCourseTime?: number // seconds (Illinois agility test)
  plankTimeSec?: number // plank hold duration in seconds
  sitAndReachCm?: number // sit & reach flexibility in cm (U10+)
  pushUps1min?: number // push-ups in 1 minute (U16+)
  restingHeartRate?: number // resting heart rate in bpm
  bodyFatPct?: number // body fat percentage (U13+)
  armSpanCm?: number // arm span in cm (U13+, GK especially)
  juggleRecord?: number // best consecutive count
  measuredAt: string // ISO date
}

export interface PhysicalProfile {
  measurements: PhysicalMeasurement[]
  latestIndex: number // index into measurements[]
  trackedFields?: string[] // player-chosen field keys (age tier sets defaults)
}

/** Calculate age tier from birth date */
export function getAgeTier(birthDate: string): AgeTier {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  if (age < 8) return 'u8'
  if (age < 12) return 'u12'
  if (age < 16) return 'u16'
  return 'u19plus'
}

/** Get age in years from birth date */
export function getAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/* ── Onboarding ───────────────────────────────────────────── */

export interface OnboardingData {
  role: AccountRole
  name: string
  birthDate: string
  yearsPlaying: number
  team: string
  positions: Position[]
  dominantFoot: DominantFoot
  physical: PhysicalMeasurement
  selfAssessment: Partial<Record<SkillCategory, number>> // 1-5 self-rating
}

/* ── Special Challenge Tracking ───────────────────────────── */

export interface SpecialChallengeProgress {
  id: string
  daysCompleted: number
  daysTarget: number
  lastLogDate: string
  startedAt: string
}

/* ── SWA Auth ─────────────────────────────────────────────── */

export interface SwaClientPrincipal {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

/* ── Achievements ─────────────────────────────────────────── */

export interface Achievement {
  id: string
  nameKey: string
  descriptionKey: string
  icon: string
  unlockedAt?: string
}

/* ── Daily Check-in ───────────────────────────────────────── */

export interface DailyCheckIn {
  id: string
  date: string // ISO date (YYYY-MM-DD)
  mood: EnergyLevel
  energy: EnergyLevel
  note?: string
  createdAt: string
}

/* ── Quiz ──────────────────────────────────────────────────── */

export type QuizDifficulty = 'u10' | 'u12' | 'u14' | 'u16'

export interface QuizQuestion {
  id: string
  questionKey: string // i18n key
  options: string[] // 4 option i18n keys (or plain text)
  correctIndex: number // 0-3
  category: 'rules' | 'history' | 'tactics' | 'nutrition' | 'players'
  difficulty: QuizDifficulty
}

export interface QuizAnswer {
  questionId: string
  date: string
  correct: boolean
  category: string
  answeredAt: string
}

/* ── Articles ─────────────────────────────────────────────── */

export type ArticleCategory = 'tactics' | 'nutrition' | 'mental' | 'rules' | 'stories'

export interface Article {
  id: string
  titleKey: string    // i18n key or plain text
  bodyKey: string     // i18n key or plain text (markdown)
  category: ArticleCategory
  ageTiers: QuizDifficulty[] // which age tiers see this article
  readingTimeMin: number
  imageEmoji?: string // emoji hero (cheaper than images)
}

export interface ReadArticle {
  articleId: string
  readAt: string
}

/* ── Training Programs ────────────────────────────────────── */

export interface TrainingProgram {
  id: string
  titleKey: string
  descriptionKey: string
  category: SkillCategory
  durationWeeks: number
  ageTiers: QuizDifficulty[]
  exerciseIds: string[] // exercises per week (repeat pattern)
  imageEmoji?: string
}

export interface ProgramProgress {
  programId: string
  startedAt: string
  completedDays: number
  totalDays: number
  lastActivityDate: string
}
