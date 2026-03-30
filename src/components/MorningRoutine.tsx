import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { DailyCheckIn } from './DailyCheckIn'
import { DailyQuiz } from './DailyQuiz'
import { exercises } from '../data/exercises'

type Step = 'checkin' | 'challenge' | 'quiz' | 'done'

interface MorningRoutineProps {
  onClose: () => void
}

export function MorningRoutine({ onClose }: MorningRoutineProps) {
  const { t } = useTranslation()
  const { xp, setXp, checkIns, quizAnswers } = useApp()

  const today = new Date().toISOString().slice(0, 10)
  const checkedIn = checkIns.some((c) => c.date === today)
  const quizzed = quizAnswers.some((q) => q.date === today)

  // Track XP awarded during this routine session to avoid stale state
  const [xpAwarded, setXpAwarded] = useState(0)

  // Skip already-completed steps
  const initialStep: Step = !checkedIn ? 'checkin' : 'challenge'
  const [step, setStep] = useState<Step>(initialStep)
  const [challengeDone, setChallengeDone] = useState(false)

  // Drill of the day for the challenge step
  const dayIndex = Math.floor(new Date(today).getTime() / 86400000) % exercises.length
  const drill = exercises[dayIndex]

  const stepNumber = step === 'checkin' ? 1 : step === 'challenge' ? 2 : step === 'quiz' ? 3 : 3
  const totalSteps = 3

  function handleChallengeComplete() {
    setChallengeDone(true)
    // Award daily challenge XP — use xp + accumulated awards to avoid stale state
    const currentXp = awardXp(xp, xpAwarded, today) // rebase to latest
    setXp(awardXp(currentXp, XP_AWARDS.dailyChallenge, today))
    setXpAwarded((prev) => prev + XP_AWARDS.dailyChallenge)
    setTimeout(() => {
      if (quizzed) {
        finishRoutine(XP_AWARDS.dailyChallenge)
      } else {
        setStep('quiz')
      }
    }, 800)
  }

  function finishRoutine(extraXpSoFar = 0) {
    // Award morning routine bonus — rebase from original xp + all accumulated
    const totalAccumulated = xpAwarded + extraXpSoFar
    const currentXp = awardXp(xp, totalAccumulated, today)
    setXp(awardXp(currentXp, XP_AWARDS.morningRoutineBonus, today))
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="app-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">☀️</span>
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {t('routine.title')}
          </p>
        </div>
        <button
          className="tap-target text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.05)' }}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      {step !== 'done' && (
        <div className="px-4 py-2">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${(stepNumber / totalSteps) * 100}%`,
                background: 'linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))',
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('routine.step', { step: stepNumber, total: totalSteps })}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="app-shell">
          {step === 'checkin' && (
            <div className="animate-fade-up">
              <p className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                🌤️ {t('checkin.title')}
              </p>
              <DailyCheckIn
                compact
                onComplete={() => setStep('challenge')}
              />
            </div>
          )}

          {step === 'challenge' && (
            <div className="animate-fade-up">
              <p className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                🎯 {t('routine.challengeTitle')}
              </p>
              <div className="card flex flex-col gap-3">
                <p className="text-sm font-bold">{t(drill.nameKey)}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {t(drill.descriptionKey)}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-data" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                    {drill.durationMinutes} min
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
                    {'⭐'.repeat(drill.difficulty)}
                  </span>
                </div>
                <button
                  className="btn-primary tap-target w-full"
                  onClick={handleChallengeComplete}
                  disabled={challengeDone}
                >
                  {challengeDone
                    ? `✅ ${t('routine.challengeComplete')}`
                    : t('routine.markDone')}
                </button>
              </div>
            </div>
          )}

          {step === 'quiz' && (
            <div className="animate-fade-up">
              <p className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                🧠 {t('quiz.title')}
              </p>
              <DailyQuiz compact onComplete={() => setTimeout(() => finishRoutine(), 500)} />
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 animate-fade-up">
              <span className="text-6xl animate-float">🎉</span>
              <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}>
                {t('routine.complete')}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                +{XP_AWARDS.morningRoutineBonus} XP {t('routine.bonus')}
              </p>
              <button className="btn-primary tap-target mt-4" onClick={onClose}>
                {t('routine.backHome')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
