import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import type { SpecialChallengeProgress } from '../engine/types'

const DAILY_CHALLENGES = [
  { id: 'daily1', textKey: 'challenges.daily1', xp: 25 },
  { id: 'daily2', textKey: 'challenges.daily2', xp: 25 },
  { id: 'daily3', textKey: 'challenges.daily3', xp: 25 },
]

const SPECIAL_TRACKS = [
  { id: 'weakFoot', titleKey: 'challenges.weakFoot', descKey: 'challenges.weakFootDesc', days: 30, color: 'var(--color-primary)' },
  { id: 'mentalChamp', titleKey: 'challenges.mentalChamp', descKey: 'challenges.mentalChampDesc', days: 21, color: 'var(--color-cyan)' },
  { id: 'deepPractice', titleKey: 'challenges.deepPractice', descKey: 'challenges.deepPracticeDesc', days: 7, color: 'var(--color-gold-400)' },
]

export function Challenges() {
  const { t } = useTranslation()
  const { xp, setXp, specialChallenges, setSpecialChallenges } = useApp()

  // Persist completed challenges per day in localStorage
  const todayKey = new Date().toISOString().split('T')[0]
  const [doneIds, setDoneIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`golazo-challenges-${todayKey}`)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  function completeChallenge(id: string, xpReward: number) {
    if (doneIds.has(id)) return
    const updated = new Set(doneIds).add(id)
    setDoneIds(updated)
    localStorage.setItem(`golazo-challenges-${todayKey}`, JSON.stringify([...updated]))
    const today = new Date().toISOString().split('T')[0]
    setXp(awardXp(xp, xpReward, today))
  }

  function getSpecialProgress(id: string): SpecialChallengeProgress | undefined {
    return specialChallenges.find((sc) => sc.id === id)
  }

  function startOrLogSpecial(trackId: string, daysTarget: number) {
    const today = new Date().toISOString().split('T')[0]
    const existing = getSpecialProgress(trackId)

    if (existing) {
      // Already logged today?
      if (existing.lastLogDate === today) return
      // Log another day
      const updated = specialChallenges.map((sc) =>
        sc.id === trackId
          ? { ...sc, daysCompleted: sc.daysCompleted + 1, lastLogDate: today }
          : sc,
      )
      setSpecialChallenges(updated)
      setXp(awardXp(xp, XP_AWARDS.dailyChallenge, today))
    } else {
      // Start new challenge
      const newChallenge: SpecialChallengeProgress = {
        id: trackId,
        daysCompleted: 1,
        daysTarget,
        lastLogDate: today,
        startedAt: today,
      }
      setSpecialChallenges([...specialChallenges, newChallenge])
      setXp(awardXp(xp, XP_AWARDS.dailyChallenge, today))
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Daily */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.daily')}
        </p>
        <div className="flex flex-col gap-2">
          {DAILY_CHALLENGES.map((ch) => {
            const isDone = doneIds.has(ch.id)
            return (
              <div key={ch.id} className="card flex items-center justify-between">
                <span className="text-sm flex-1 mr-3">{t(ch.textKey)}</span>
                <button
                  className="tap-target rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap"
                  style={{
                    background: isDone ? 'var(--color-primary)' : '#fef3c7',
                    color: isDone ? '#fff' : '#b45309',
                    border: 'none',
                  }}
                  onClick={() => completeChallenge(ch.id, ch.xp)}
                  disabled={isDone}
                  aria-label={isDone ? t('challenges.complete') : `+${ch.xp} XP`}
                >
                  {isDone ? '✓' : `+${ch.xp} XP`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Special tracks */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.special')}
        </p>
        <div className="flex flex-col gap-2">
          {SPECIAL_TRACKS.map((track) => {
            const progress = getSpecialProgress(track.id)
            const pct = progress ? Math.min((progress.daysCompleted / track.days) * 100, 100) : 0
            const today = new Date().toISOString().split('T')[0]
            const loggedToday = progress?.lastLogDate === today
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
                  <p className="text-sm font-bold">
                    {t(track.titleKey)}
                  </p>
                  {progress && (
                    <span className="text-xs font-data font-bold" style={{ color: isComplete ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}>
                      {isComplete ? '✓' : `${progress.daysCompleted}/${track.days}`}
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
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%`, background: track.color }}
                  />
                </div>
                {loggedToday && !isComplete && (
                  <p className="text-[0.65rem] mt-1 font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                    ✓ {t('challenges.loggedToday')}
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
