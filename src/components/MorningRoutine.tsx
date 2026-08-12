import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS, scaleXp } from '../engine/xp'
import { DailyCheckIn } from './DailyCheckIn'
import { DailyQuiz } from './DailyQuiz'
import { getAgeTier } from '../engine/types'
import { ageTierToChallengeDifficulty, getChallengeOfDay, getDailyChallengeCompletionKey } from '../engine/challenges'
import type { Position } from '../engine/types'

type Step = 'checkin' | 'challenge' | 'quiz' | 'done'

interface MorningRoutineProps {
  onClose: () => void
}

export function MorningRoutine({ onClose }: MorningRoutineProps) {
  const { t } = useTranslation()
  const { setXp, checkIns, quizAnswers, profile, skillTree } = useApp()
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined
  const difficulty = ageTierToChallengeDifficulty(ageTier)
  const scaledRoutineBonus = scaleXp(XP_AWARDS.morningRoutineBonus, ageTier)

  const today = new Date().toISOString().slice(0, 10)
  const checkedIn = checkIns.some((c) => c.date === today)
  const quizzed = quizAnswers.some((q) => q.date === today)
  const positionKey = (profile?.positions ?? []).join('|')
  const challenge = useMemo(() => (
    getChallengeOfDay(profile?.id || 'anonymous', today, difficulty, positionKey ? positionKey.split('|') as Position[] : [], skillTree)
  ), [profile?.id, today, difficulty, positionKey, skillTree])
  const challengeStorageKey = getDailyChallengeCompletionKey(today)

  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(challengeStorageKey)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })
  const challengeCompleted = challenge ? completedChallengeIds.has(challenge.templateId) : true

  // Skip already-completed steps
  const initialStep: Step = !checkedIn ? 'checkin' : challengeCompleted ? 'quiz' : 'challenge'
  const [step, setStep] = useState<Step>(initialStep)
  const currentStep: Step = step === 'challenge' && !challenge ? 'quiz' : step

  const stepNumber = currentStep === 'checkin' ? 1 : currentStep === 'challenge' ? 2 : currentStep === 'quiz' ? 3 : 3
  const totalSteps = 3

  function handleChallengeComplete() {
    if (!challenge || completedChallengeIds.has(challenge.templateId)) return
    const updated = new Set(completedChallengeIds).add(challenge.templateId)
    setCompletedChallengeIds(updated)
    localStorage.setItem(challengeStorageKey, JSON.stringify([...updated]))
    setXp((currentXp) => awardXp(currentXp, challenge.xpReward, today, ageTier))
    setTimeout(() => {
      if (quizzed) {
        finishRoutine()
      } else {
        setStep('quiz')
      }
    }, 800)
  }

  function finishRoutine() {
    setXp((currentXp) => awardXp(currentXp, XP_AWARDS.morningRoutineBonus, today, ageTier))
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="app-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">☀️</span>
          <p className="text-base font-bold heading-display">
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
      {currentStep !== 'done' && (
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
          {currentStep === 'checkin' && (
            <div className="animate-fade-up">
              <p className="text-lg font-bold mb-4 heading-display">
                🌤️ {t('checkin.title')}
              </p>
              <DailyCheckIn
                compact
                onComplete={() => setStep(challengeCompleted ? 'quiz' : 'challenge')}
              />
            </div>
          )}

          {currentStep === 'challenge' && challenge && (
            <div className="animate-fade-up">
              <p className="text-lg font-bold mb-4 heading-display">
                🎯 {t('routine.challengeTitle')}
              </p>
              <div className="card flex flex-col gap-3">
                <p className="text-sm font-bold">{t(challenge.textKey)}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {t(challenge.descKey)}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-data" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                    {challenge.target} {challenge.unit}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
                    +{challenge.xpReward} XP
                  </span>
                </div>
                {challenge.tipsKey && (
                  <p className="text-xs rounded-xl p-3" style={{ background: '#fffbeb', color: '#78350f' }}>
                    💡 {t(challenge.tipsKey)}
                  </p>
                )}
                <button
                  className="btn-primary tap-target w-full"
                  onClick={handleChallengeComplete}
                  disabled={completedChallengeIds.has(challenge.templateId)}
                >
                  {completedChallengeIds.has(challenge.templateId)
                    ? `✅ ${t('routine.challengeComplete')}`
                    : t('routine.markDone')}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'quiz' && (
            <div className="animate-fade-up">
              <p className="text-lg font-bold mb-4 heading-display">
                🧠 {t('quiz.title')}
              </p>
              <DailyQuiz compact onComplete={() => setTimeout(() => finishRoutine(), 500)} />
            </div>
          )}

          {currentStep === 'done' && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 animate-fade-up">
              <span className="text-6xl animate-float">🎉</span>
              <p className="text-xl font-bold heading-display" style={{ color: 'var(--color-primary-dark)' }}>
                {t('routine.complete')}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                +{scaledRoutineBonus} XP {t('routine.bonus')}
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
