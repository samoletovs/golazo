import type { TrainingProgram, ProgramWeek } from '../engine/types'

/** Shared warmup/cooldown patterns */
const WARMUP_DYNAMIC = { durationMin: 5, descriptionKey: 'prog.warmup.dynamic' }
const WARMUP_BALL = { durationMin: 5, descriptionKey: 'prog.warmup.ballwork' }
const COOLDOWN_STRETCH = { durationMin: 5, descriptionKey: 'prog.cooldown.stretch' }
const WARMUP_BREATHING = { durationMin: 3, descriptionKey: 'prog.warmup.breathing' }

/** Helper: generate a standard 5-day training week from exercise patterns */
function makeWeek(weekNum: number, focusKey: string, exercises: string[], durMin: number, prefix: string, cooldown = COOLDOWN_STRETCH, warmup = WARMUP_DYNAMIC): ProgramWeek {
  return {
    weekNumber: weekNum,
    focusKey,
    days: [1, 2, 3, 4, 5].map((d) => ({
      dayNumber: d,
      titleKey: `${prefix}.w${weekNum}d${d}`,
      totalDurationMin: durMin,
      warmup,
      exercises: exercises.map((_eid, i) => {
        // Rotate exercises so each day starts from a different one
        const idx = (i + d - 1) % exercises.length
        return { exerciseId: exercises[idx], sets: 3 + Math.floor(weekNum / 2), reps: 8 + weekNum * 2 }
      }),
      cooldown,
    })),
  }
}

/** Structured training programs with full daily workouts. */
export const programs: TrainingProgram[] = [
  {
    id: 'prog-ball-mastery',
    titleKey: 'prog.ballMastery.title',
    descriptionKey: 'prog.ballMastery.desc',
    category: 'technical',
    durationWeeks: 4,
    ageTiers: ['u10', 'u12', 'u14'],
    exerciseIds: ['tech-01', 'tech-02', 'tech-04', 'tech-03', 'tech-05'],
    imageEmoji: '⚽',
    difficulty: 'beginner',
    methodology: 'coerver',
    skillImpact: { technical: 2.0, physical: 0.5 },
    weeks: [
      makeWeek(1, 'prog.week.foundation', ['tech-01', 'tech-02', 'tech-04', 'tech-03', 'tech-05'], 20, 'prog.bm', COOLDOWN_STRETCH, WARMUP_DYNAMIC),
      makeWeek(2, 'prog.week.build', ['tech-01', 'tech-02', 'tech-04', 'tech-03', 'tech-05'], 25, 'prog.bm', COOLDOWN_STRETCH, WARMUP_BALL),
      makeWeek(3, 'prog.week.challenge', ['tech-01', 'tech-02', 'tech-04', 'tech-03', 'tech-05'], 30, 'prog.bm'),
      makeWeek(4, 'prog.week.mastery', ['tech-01', 'tech-02', 'tech-04', 'tech-03', 'tech-05'], 25, 'prog.bm'),
    ],
  },
  {
    id: 'prog-speed-agility',
    titleKey: 'prog.speedAgility.title',
    descriptionKey: 'prog.speedAgility.desc',
    category: 'physical',
    durationWeeks: 4,
    ageTiers: ['u12', 'u14', 'u16'],
    exerciseIds: ['phys-01', 'phys-02', 'phys-03', 'phys-04', 'phys-05'],
    imageEmoji: '🏃',
    difficulty: 'intermediate',
    methodology: 'sport-science',
    skillImpact: { physical: 2.0, technical: 0.5 },
    weeks: [
      makeWeek(1, 'prog.week.foundation', ['phys-01', 'phys-02', 'phys-03', 'phys-04', 'phys-05'], 20, 'prog.sa'),
      makeWeek(2, 'prog.week.build', ['phys-01', 'phys-02', 'phys-03', 'phys-04', 'phys-05'], 25, 'prog.sa'),
      makeWeek(3, 'prog.week.challenge', ['phys-01', 'phys-02', 'phys-03', 'phys-04', 'phys-05'], 30, 'prog.sa'),
      makeWeek(4, 'prog.week.mastery', ['phys-01', 'phys-02', 'phys-03', 'phys-04', 'phys-05'], 25, 'prog.sa'),
    ],
  },
  {
    id: 'prog-game-iq',
    titleKey: 'prog.gameIQ.title',
    descriptionKey: 'prog.gameIQ.desc',
    category: 'tactical',
    durationWeeks: 4,
    ageTiers: ['u12', 'u14', 'u16'],
    exerciseIds: ['tact-01', 'tact-02', 'tact-03', 'tact-04', 'tact-05'],
    imageEmoji: '🧠',
    difficulty: 'intermediate',
    methodology: 'horst-wein',
    skillImpact: { tactical: 2.0, mental: 0.5 },
    weeks: [
      makeWeek(1, 'prog.week.foundation', ['tact-01', 'tact-02', 'tact-03', 'tact-04', 'tact-05'], 20, 'prog.gi', COOLDOWN_STRETCH, WARMUP_BALL),
      makeWeek(2, 'prog.week.build', ['tact-01', 'tact-02', 'tact-03', 'tact-04', 'tact-05'], 25, 'prog.gi', COOLDOWN_STRETCH, WARMUP_BALL),
      makeWeek(3, 'prog.week.challenge', ['tact-01', 'tact-02', 'tact-03', 'tact-04', 'tact-05'], 30, 'prog.gi', COOLDOWN_STRETCH, WARMUP_BALL),
      makeWeek(4, 'prog.week.mastery', ['tact-01', 'tact-02', 'tact-03', 'tact-04', 'tact-05'], 25, 'prog.gi', COOLDOWN_STRETCH, WARMUP_BALL),
    ],
  },
  {
    id: 'prog-mental-strength',
    titleKey: 'prog.mentalStrength.title',
    descriptionKey: 'prog.mentalStrength.desc',
    category: 'mental',
    durationWeeks: 3,
    ageTiers: ['u12', 'u14', 'u16'],
    exerciseIds: ['ment-01', 'ment-02', 'ment-03', 'ment-04', 'ment-05'],
    imageEmoji: '🧘',
    difficulty: 'beginner',
    methodology: 'dan-abrahams',
    skillImpact: { mental: 2.0, knowledge: 0.5 },
    weeks: [
      makeWeek(1, 'prog.week.foundation', ['ment-01', 'ment-02', 'ment-03', 'ment-04', 'ment-05'], 15, 'prog.ms', undefined, WARMUP_BREATHING),
      makeWeek(2, 'prog.week.build', ['ment-01', 'ment-02', 'ment-03', 'ment-04', 'ment-05'], 20, 'prog.ms', undefined, WARMUP_BREATHING),
      makeWeek(3, 'prog.week.mastery', ['ment-01', 'ment-02', 'ment-03', 'ment-04', 'ment-05'], 20, 'prog.ms', undefined, WARMUP_BREATHING),
    ],
  },
  {
    id: 'prog-shooting',
    titleKey: 'prog.shooting.title',
    descriptionKey: 'prog.shooting.desc',
    category: 'technical',
    durationWeeks: 4,
    ageTiers: ['u12', 'u14', 'u16'],
    exerciseIds: ['tech-05', 'tech-01', 'tech-03', 'deep-02', 'deep-03'],
    imageEmoji: '🥅',
    difficulty: 'intermediate',
    methodology: 'uefa',
    skillImpact: { technical: 1.5, mental: 0.5, physical: 0.5 },
    weeks: [
      makeWeek(1, 'prog.week.foundation', ['tech-05', 'tech-01', 'tech-03'], 25, 'prog.sh'),
      makeWeek(2, 'prog.week.build', ['tech-05', 'tech-01', 'tech-03'], 30, 'prog.sh'),
      makeWeek(3, 'prog.week.challenge', ['tech-05', 'tech-01', 'tech-03'], 30, 'prog.sh'),
      makeWeek(4, 'prog.week.mastery', ['tech-05', 'tech-01', 'tech-03'], 25, 'prog.sh'),
    ],
  },
]
