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

export type AccountRole = 'player' | 'mentor' | 'coach'

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
  managedSquads?: ManagedSquad[] // Coach-only: squads this user manages
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
  clubName?: string  // Parent club name (e.g., "Rigas Futbola Skola")
  clubId?: string    // SharedTeam.id of the club
  birthYear?: number // e.g. 2014
  squadLabel?: string // e.g. "A", "B", "Main"
  position?: Position | Position[] // player's position(s) in this squad
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
  verifiedBy?: string[] // userIds who confirmed this entry
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
  verifiedBy?: string[] // userIds who confirmed this entry
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
  if (age < 10) return 'u8'   // U8-U10 Foundation
  if (age < 12) return 'u12'  // U10-U12 Development
  if (age < 16) return 'u16'  // U12-U16 Youth
  return 'u19plus'            // U16+
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

/* ── Skip Reasons ─────────────────────────────────────────── */

export type TrainingSkipReason = 'sick' | 'injury' | 'recovery' | 'school' | 'work' | 'family' | 'cancelled' | 'other'
export type MatchSkipReason = 'sick' | 'injury' | 'suspended' | 'notSelected' | 'otherTeam' | 'cancelled' | 'other'

export const TRAINING_SKIP_REASONS: readonly { key: TrainingSkipReason; minAge?: number }[] = [
  { key: 'sick' },
  { key: 'injury' },
  { key: 'recovery' },
  { key: 'school' },
  { key: 'work', minAge: 16 },
  { key: 'family' },
  { key: 'cancelled' },
  { key: 'other' },
]

export const MATCH_SKIP_REASONS: readonly { key: MatchSkipReason; minAge?: number }[] = [
  { key: 'sick' },
  { key: 'injury' },
  { key: 'suspended' },
  { key: 'notSelected' },
  { key: 'otherTeam' },
  { key: 'cancelled' },
  { key: 'other' },
]

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

export interface ProgramExercise {
  exerciseId: string
  sets?: number
  reps?: number
  durationMin?: number
  coachNoteKey?: string // i18n key for form tips
}

export interface ProgramDay {
  dayNumber: number     // 1-5 within the week
  titleKey: string      // i18n: "First Touch Foundation"
  totalDurationMin: number
  warmup: { durationMin: number; descriptionKey: string }
  exercises: ProgramExercise[]
  cooldown?: { durationMin: number; descriptionKey: string }
}

export interface ProgramWeek {
  weekNumber: number
  focusKey: string  // i18n: "Foundation", "Build", "Challenge", "Mastery"
  days: ProgramDay[]
}

export type ProgramDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface TrainingProgram {
  id: string
  titleKey: string
  descriptionKey: string
  category: SkillCategory
  durationWeeks: number
  ageTiers: QuizDifficulty[]
  exerciseIds: string[] // legacy — kept for backward compat
  imageEmoji?: string
  difficulty?: ProgramDifficulty
  methodology?: string
  skillImpact?: Partial<Record<SkillCategory, number>> // skill radar boost on full completion
  weeks?: ProgramWeek[] // structured daily workouts
}

export interface DayCompletion {
  week: number
  day: number
  completedAt: string
  rating?: 1 | 2 | 3 | 4 | 5
}

export type ProgramStatus = 'active' | 'paused' | 'completed' | 'abandoned'

export interface ProgramProgress {
  programId: string
  startedAt: string
  completedDays: number // legacy counter
  totalDays: number     // legacy counter
  lastActivityDate: string
  // New structured tracking
  currentWeek?: number
  currentDay?: number
  dayLog?: DayCompletion[]
  status?: ProgramStatus
  completedAt?: string
  skillsGained?: Partial<Record<SkillCategory, number>>
}

/* ── Challenge Templates (for dynamic engine) ─────────────── */

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'
export type ChallengeLocation = 'anywhere' | 'outdoor' | 'indoor' | 'pitch'

export interface ChallengeTemplate {
  id: string
  textKey: string       // i18n key for title
  descKey: string       // i18n key for description/instructions
  tipsKey?: string      // i18n key for pro tips
  emoji: string         // challenge icon
  category: SkillCategory
  difficulty: ChallengeDifficulty
  location: ChallengeLocation
  estimateMin: number   // estimated time to complete
  positions?: Position[] // position-specific (empty = all)
  ageTiers: QuizDifficulty[]
  targets: Partial<Record<QuizDifficulty, { value: number; unit: string }>>
  period: 'daily' | 'weekly'
  xpReward: number
  skillImpact: SkillCategory
  tags?: string[]       // 'no-partner', 'needs-goal', 'partner', 'video'
  shareCode?: string    // short code for sharing (future: invite friend to same challenge)
}

export type ChallengeReason = 'weakest-skill' | 'second-weakest' | 'position' | 'wildcard' | 'weekly'

export interface ActiveChallenge {
  templateId: string
  generatedAt: string
  expiresAt: string
  target: number
  unit: string
  progress: number
  status: 'active' | 'completed' | 'expired'
  completedAt?: string
  reason: ChallengeReason
  category: SkillCategory
  xpReward: number
  textKey: string
  descKey: string
  tipsKey?: string
  emoji: string
  difficulty: ChallengeDifficulty
  location: ChallengeLocation
  estimateMin: number
  shareCode?: string    // for multiplayer challenges
}

/* ── Coach ─────────────────────────────────────────────────── */

export const COACH_ROLES = {
  head: 'head',
  assistant: 'assistant',
  goalkeeper: 'goalkeeper',
  fitness: 'fitness',
} as const
export type CoachRole = (typeof COACH_ROLES)[keyof typeof COACH_ROLES]

export const LICENSE_LEVELS = {
  none: 'none',
  grassroots: 'grassroots',
  uefaC: 'uefaC',
  uefaB: 'uefaB',
  uefaA: 'uefaA',
  uefaPro: 'uefaPro',
} as const
export type LicenseLevel = (typeof LICENSE_LEVELS)[keyof typeof LICENSE_LEVELS]

export const COACH_SPECIALIZATIONS = {
  goalkeeping: 'goalkeeping',
  physical: 'physical',
  tactical: 'tactical',
  technical: 'technical',
  mental: 'mental',
  analytics: 'analytics',
} as const
export type CoachSpecialization = (typeof COACH_SPECIALIZATIONS)[keyof typeof COACH_SPECIALIZATIONS]

export interface ManagedSquad {
  squadId: string          // Generated UUID or SharedTeam.id
  squadName: string        // Full display: "RFS 2015 A"
  clubName: string         // Parent club: "Rigas Futbola Skola"
  clubId?: string          // SharedTeam.id of the club (if from registry)
  birthYear?: number       // e.g. 2015
  squadLabel?: string      // e.g. "A", "B", "Main", "Second"
  role: CoachRole
  claimedAt: string
  verified: boolean
}

export interface CoachProfile {
  id: string
  userId: string           // Auth identity
  name: string
  country?: string
  city?: string
  language: Language
  managedSquads: ManagedSquad[]
  licenseLevel: LicenseLevel
  specializations: CoachSpecialization[]
  photoUrl?: string
  phone?: string
  email?: string
  createdAt: string
}

/* ── Squad Roster ─────────────────────────────────────────── */

export interface RosterPlayer {
  playerId: string
  playerName: string
  jerseyNumber?: number
  positions: Position[]
  birthDate: string
  photoUrl?: string
  joinedAt: string         // When player linked to this squad
  active: boolean
}

export interface SquadRoster {
  squadId: string
  squadName: string
  players: RosterPlayer[]
  updatedAt: string
}

/* ── Announcements ────────────────────────────────────────── */

export const ANNOUNCEMENT_PRIORITY = {
  normal: 'normal',
  urgent: 'urgent',
} as const
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITY)[keyof typeof ANNOUNCEMENT_PRIORITY]

export const ANNOUNCEMENT_AUDIENCE = {
  players: 'players',
  parents: 'parents',
  all: 'all',
} as const
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCE)[keyof typeof ANNOUNCEMENT_AUDIENCE]

export interface Announcement {
  id: string
  squadId: string
  authorId: string
  authorName: string
  title: string
  body: string
  priority: AnnouncementPriority
  audience: AnnouncementAudience
  linkUrl?: string
  readBy: string[]         // playerIds who have seen it
  createdAt: string
}

/* ── Training Plan (coach-created session) ────────────────── */

export interface TrainingDrill {
  exerciseId?: string      // Link to Exercise from library (optional)
  title: string
  description?: string
  durationMinutes: number
  equipment?: Equipment[]
}

export interface TrainingPlan {
  id: string
  squadId: string
  coachId: string
  title: string
  date: string             // ISO date
  startTime?: string       // HH:mm
  location?: string
  durationMinutes: number
  objectives: string[]
  warmUp?: TrainingDrill
  drills: TrainingDrill[]
  coolDown?: TrainingDrill
  notes?: string
  createdAt: string
}

/* ── Player Evaluation ────────────────────────────────────── */

export interface PlayerEvaluation {
  id: string
  squadId: string
  playerId: string
  coachId: string
  coachName: string
  date: string
  period: string           // "2026-Q1", "March 2026", etc.
  technicalRating: number  // 1-10
  tacticalRating: number
  physicalRating: number
  mentalRating: number
  performanceRating: number
  knowledgeRating: number
  attendance: number       // 0-100 percentage
  strengths: string[]
  areasToImprove: string[]
  coachNotes?: string
  goalsForNextPeriod: string[]
  createdAt: string
}

/* ── Attendance ───────────────────────────────────────────── */

export const ATTENDANCE_STATUS = {
  present: 'present',
  absent: 'absent',
  excused: 'excused',
  late: 'late',
} as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS]

export interface AttendanceRecord {
  id: string
  squadId: string
  eventId: string          // ScheduleEvent or TrainingPlan id
  eventDate: string
  eventType: 'training' | 'match'
  playerId: string
  status: AttendanceStatus
  note?: string
  autoDetected: boolean    // true = matched from player's own training log
  markedBy: string         // coachId or 'system'
  createdAt: string
}

/* ── Camp ──────────────────────────────────────────────────── */

export interface CampDay {
  dayNumber: number
  date: string
  sessions: TrainingPlan[]
}

export interface Camp {
  id: string
  squadIds: string[]       // Can span multiple squads
  coachId: string
  name: string
  startDate: string
  endDate: string
  location: string
  description?: string
  program: CampDay[]
  participantIds: string[]
  fee?: number
  currency?: string
  createdAt: string
}
