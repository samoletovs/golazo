import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { getAgeTier } from '../engine/types'
import { generateDailyChallenges, getChallengeReasonKey } from '../engine/challenges'
import { createInitialSkillTree } from '../engine/skills'
import type { SpecialChallengeProgress, ActiveChallenge, QuizDifficulty } from '../engine/types'

function tierToDifficulty(tier: string): QuizDifficulty {
  if (tier === 'u8') return 'u10'
  if (tier === 'u12') return 'u12'
  if (tier === 'u16') return 'u16'
  return 'u16'
}

const SPECIAL_TRACKS = [
  { id: 'weakFoot', titleKey: 'challenges.weakFoot', descKey: 'challenges.weakFootDesc', days: 30, color: 'var(--color-primary)' },
  { id: 'mentalChamp', titleKey: 'challenges.mentalChamp', descKey: 'challenges.mentalChampDesc', days: 21, color: 'var(--color-primary-light)' },
  { id: 'deepPractice', titleKey: 'challenges.deepPractice', descKey: 'challenges.deepPracticeDesc', days: 7, color: 'var(--color-gold-400)' },
]

export function Challenges() {
  const { t } = useTranslation()
  const { xp, setXp, specialChallenges, setSpecialChallenges, profile, skillTree } = useApp()
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined
  const difficulty = profile?.birthDate ? tierToDifficulty(getAgeTier(profile.birthDate)) : 'u12' as QuizDifficulty

  const todayKey = new Date().toISOString().split('T')[0]
  const userId = profile?.id || 'anonymous'

  // Generate personalized challenges using the engine
  const challenges = useMemo(() => {
    const tree = skillTree || createInitialSkillTree(userId)
    const positions = profile?.positions || []
    return generateDailyChallenges(userId, todayKey, difficulty, positions, tree)
  }, [userId, todayKey, difficulty, profile?.positions, skillTree])

  const dailyChallenges = challenges.filter((c) => c.reason !== 'weekly')
  const weeklyChallenge = challenges.find((c) => c.reason === 'weekly')

  // Track completed challenges per day in localStorage
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`golazo-challenges-${todayKey}`)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  // Weekly challenge progress from localStorage
  const [weeklyProgress, setWeeklyProgress] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`golazo-weekly-${weeklyChallenge?.templateId || 'none'}`)
      return stored ? parseInt(stored, 10) : 0
    } catch { return 0 }
  })

  const [showReason, setShowReason] = useState<string | null>(null)

  function completeDaily(challenge: ActiveChallenge) {
    if (completedIds.has(challenge.templateId)) return
    const updated = new Set(completedIds).add(challenge.templateId)
    setCompletedIds(updated)
    localStorage.setItem(`golazo-challenges-${todayKey}`, JSON.stringify([...updated]))
    setXp(awardXp(xp, XP_AWARDS.dailyChallenge, todayKey, ageTier))
  }

  function incrementWeekly() {
    if (!weeklyChallenge) return
    const newProgress = weeklyProgress + 1
    setWeeklyProgress(newProgress)
    localStorage.setItem(`golazo-weekly-${weeklyChallenge.templateId}`, String(newProgress))
    if (newProgress >= weeklyChallenge.target) {
      setXp(awardXp(xp, XP_AWARDS.weeklyChallenge, todayKey, ageTier))
    }
  }

  function getSpecialProgress(id: string): SpecialChallengeProgress | undefined {
    return specialChallenges.find((sc) => sc.id === id)
  }

  function startOrLogSpecial(trackId: string, daysTarget: number) {
    const today = todayKey
    const existing = getSpecialProgress(trackId)

    if (existing) {
      if (existing.lastLogDate === today) return
      const isNowComplete = existing.daysCompleted + 1 >= daysTarget
      const updated = specialChallenges.map((sc) =>
        sc.id === trackId
          ? { ...sc, daysCompleted: sc.daysCompleted + 1, lastLogDate: today }
          : sc,
      )
      setSpecialChallenges(updated)
      const xpAmount = isNowComplete ? XP_AWARDS.specialTrackComplete : XP_AWARDS.specialTrackDay
      setXp(awardXp(xp, xpAmount, today, ageTier))
    } else {
      const newChallenge: SpecialChallengeProgress = {
        id: trackId, daysCompleted: 1, daysTarget, lastLogDate: today, startedAt: today,
      }
      setSpecialChallenges([...specialChallenges, newChallenge])
      setXp(awardXp(xp, XP_AWARDS.specialTrackDay, today, ageTier))
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Daily — Dynamic personalized challenges */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.daily')}
        </p>
        <div className="flex flex-col gap-2">
          {dailyChallenges.map((ch) => {
            const isDone = completedIds.has(ch.templateId)
            return (
              <div key={ch.templateId} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <p className="text-sm">{t(ch.textKey)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                        {ch.target} {ch.unit}
                      </span>
                      <button
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: '#eff6ff', color: '#1d4ed8' }}
                        onClick={() => setShowReason(showReason === ch.templateId ? null : ch.templateId)}
                      >
                        {t('challenges.why')}
                      </button>
                    </div>
                    {showReason === ch.templateId && (
                      <p className="text-[10px] mt-1 italic animate-fade-up" style={{ color: 'var(--color-primary-dark)' }}>
                        💡 {t(getChallengeReasonKey(ch.reason), { category: t(`learn.cat.${ch.category}`) })}
                      </p>
                    )}
                  </div>
                  <button
                    className="tap-target rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap"
                    style={{
                      background: isDone ? 'var(--color-primary)' : 'var(--color-amber-bg)',
                      color: isDone ? '#fff' : 'var(--color-amber-text)',
                      border: 'none',
                    }}
                    onClick={() => completeDaily(ch)}
                    disabled={isDone}
                  >
                    {isDone ? '✓' : `+${ch.xpReward} XP`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly */}
      {weeklyChallenge && (
        <div>
          <p className="section-label mb-2">
            {t('challenges.weekly')}
          </p>
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">{t(weeklyChallenge.textKey)}</p>
              <span className="text-xs font-data font-bold" style={{ color: weeklyProgress >= weeklyChallenge.target ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}>
                {weeklyProgress >= weeklyChallenge.target ? '✓' : `${weeklyProgress}/${weeklyChallenge.target}`}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min((weeklyProgress / weeklyChallenge.target) * 100, 100)}%`, background: 'var(--color-primary)' }} />
            </div>
            {weeklyProgress < weeklyChallenge.target && (
              <button
                className="btn-primary tap-target w-full mt-2 text-xs"
                onClick={incrementWeekly}
              >
                {t('challenges.logProgress')} (+{weeklyChallenge.xpReward} XP {t('challenges.onComplete')})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Special tracks */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.special')}
        </p>
        <div className="flex flex-col gap-2">
          {SPECIAL_TRACKS.map((track) => {
            const progress = getSpecialProgress(track.id)
            const pct = progress ? Math.min((progress.daysCompleted / track.days) * 100, 100) : 0
            const loggedToday = progress?.lastLogDate === todayKey
            const isComplete = progress ? progress.daysCompleted >= track.days : false

            return (
              <button
                key={track.id}
                className="card-glow text-left w-full special-challenge-card"
                onClick={() => !isComplete && startOrLogSpecial(track.id, track.days)}
                disabled={loggedToday || isComplete}
                aria-label={`${t(track.titleKey)} - ${progress ? `${progress.daysCompleted}/${track.days}` : t('challenges.start')}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{t(track.titleKey)}</p>
                  {progress && (
                    <span className="text-xs font-data font-bold" style={{ color: isComplete ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}>
                      {isComplete ? '🏆' : `${progress.daysCompleted}/${track.days}`}
                    </span>
                  )}
                  {!progress && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                      {t('challenges.start')}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t(track.descKey)}
                </p>
                <div className="progress-track mt-2">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: track.color }} />
                </div>
                {loggedToday && !isComplete && (
                  <p className="text-[0.65rem] mt-1 font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                    ✓ {t('challenges.loggedToday')}
                  </p>
                )}
                {isComplete && (
                  <p className="text-[0.65rem] mt-1 font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                    🏆 {t('challenges.trackComplete')}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
