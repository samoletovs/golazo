import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProgramDay, ProgramExercise } from '../engine/types'
import { exercises as exerciseLibrary } from '../data/exercises'

/** Look up exercise name from the curated exercise library */
function getExerciseName(exerciseId: string, t: ReturnType<typeof import('react-i18next').useTranslation>['t']): string {
  const ex = exerciseLibrary.find((e) => e.id === exerciseId)
  if (ex) return t(ex.nameKey, { defaultValue: ex.nameKey })
  return exerciseId
}

interface WorkoutViewProps {
  weekNumber: number
  weekFocusKey?: string
  day: ProgramDay
  onComplete: (rating?: 1 | 2 | 3 | 4 | 5) => void
  isCompleted: boolean
  alreadyLoggedToday: boolean
}

/** Full daily workout view — shows warmup, exercises, cooldown, and complete button */
export function WorkoutView({ weekNumber, weekFocusKey, day, onComplete, isCompleted, alreadyLoggedToday }: WorkoutViewProps) {
  const { t } = useTranslation()
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)

  function handleComplete() {
    if (rating) {
      onComplete(rating)
    } else {
      setShowRating(true)
    }
  }

  function handleRate(r: 1 | 2 | 3 | 4 | 5) {
    setRating(r)
    onComplete(r)
  }

  function handleSkipRating() {
    onComplete()
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
          {t('prog.weekLabel', { n: weekNumber })} · {t('prog.dayLabel', { n: day.dayNumber })}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {day.totalDurationMin} {t('learn.minutes')}
        </span>
      </div>

      <h3 className="text-base font-bold heading-display">
        {weekFocusKey ? t(weekFocusKey) : ''} — {t('prog.dayLabel', { n: day.dayNumber })}
      </h3>

      {/* Warmup */}
      <div className="card flex items-center gap-3" style={{ background: 'var(--color-primary-bg-subtle)' }}>
        <span className="text-lg">🔥</span>
        <div className="flex-1">
          <p className="text-xs font-bold">{t('prog.warmup')} · {day.warmup.durationMin} {t('learn.minutes')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t(day.warmup.descriptionKey)}</p>
        </div>
      </div>

      {/* Exercises */}
      {day.exercises.map((ex, i) => (
        <ExerciseCard key={`${ex.exerciseId}-${i}`} exercise={ex} index={i + 1} />
      ))}

      {/* Cooldown */}
      {day.cooldown && (
        <div className="card flex items-center gap-3" style={{ background: 'var(--color-success-bg)' }}>
          <span className="text-lg">🧊</span>
          <div className="flex-1">
            <p className="text-xs font-bold">{t('prog.cooldown')} · {day.cooldown.durationMin} {t('learn.minutes')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t(day.cooldown.descriptionKey)}</p>
          </div>
        </div>
      )}

      {/* Complete / Rating */}
      {isCompleted || alreadyLoggedToday ? (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-primary-bg-subtle)' }}>
          <span className="text-lg">✅</span>
          <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>
            {t('prog.workoutDone')}
          </p>
        </div>
      ) : showRating ? (
        <div className="card flex flex-col items-center gap-2">
          <p className="text-xs font-bold">{t('prog.rateWorkout')}</p>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((r) => (
              <button
                key={r}
                className="tap-target text-xl w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: rating === r ? 'var(--color-primary)' : '#f3f4f6', color: rating === r ? '#fff' : undefined }}
                onClick={() => handleRate(r)}
              >
                {['😴', '😐', '🙂', '😄', '🔥'][r - 1]}
              </button>
            ))}
          </div>
          <button className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }} onClick={handleSkipRating}>
            {t('prog.skipRating')}
          </button>
        </div>
      ) : (
        <button className="btn-primary tap-target w-full text-sm" onClick={handleComplete}>
          {t('prog.completeWorkout')} (+20 XP)
        </button>
      )}
    </div>
  )
}

function ExerciseCard({ exercise, index }: { exercise: ProgramExercise; index: number }) {
  const { t } = useTranslation()

  const detail = exercise.sets && exercise.reps
    ? `${exercise.sets} × ${exercise.reps}`
    : exercise.durationMin
      ? `${exercise.durationMin} ${t('learn.minutes')}`
      : ''

  return (
    <div className="card flex items-start gap-3">
      <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{getExerciseName(exercise.exerciseId, t)}</p>
        {detail && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{detail}</p>
        )}
        {exercise.coachNoteKey && (
          <p className="text-xs mt-1 italic" style={{ color: 'var(--color-primary-dark)' }}>
            💡 {t(exercise.coachNoteKey)}
          </p>
        )}
      </div>
    </div>
  )
}
