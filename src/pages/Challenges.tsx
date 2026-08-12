import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { getAgeTier } from '../engine/types'
import { ageTierToChallengeDifficulty, generateDailyChallenges, getChallengeReasonKey, getDailyChallengeCompletionKey } from '../engine/challenges'
import { createInitialSkillTree } from '../engine/skills'
import type { SpecialChallengeProgress, ActiveChallenge, ChallengeDifficulty, Position } from '../engine/types'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  technical: { bg: '#dbeafe', text: '#1d4ed8' },
  physical: { bg: '#dcfce7', text: '#166534' },
  tactical: { bg: '#fef9c3', text: '#854d0e' },
  mental: { bg: '#f3e8ff', text: '#7c3aed' },
  knowledge: { bg: '#fff7ed', text: '#c2410c' },
}

const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { label: string; color: string; dots: number }> = {
  easy: { label: '⚡', color: '#22c55e', dots: 1 },
  medium: { label: '⚡⚡', color: '#f59e0b', dots: 2 },
  hard: { label: '⚡⚡⚡', color: '#ef4444', dots: 3 },
}

const LOCATION_EMOJI: Record<string, string> = {
  anywhere: '🌍', outdoor: '🏟️', indoor: '🏠', pitch: '⚽',
}

const SPECIAL_TRACKS = [
  { id: 'weakFoot', titleKey: 'challenges.weakFoot', descKey: 'challenges.weakFootDesc', emoji: '🦶', days: 30, color: 'var(--color-primary)' },
  { id: 'mentalChamp', titleKey: 'challenges.mentalChamp', descKey: 'challenges.mentalChampDesc', emoji: '🧠', days: 21, color: 'var(--color-primary-light)' },
  { id: 'deepPractice', titleKey: 'challenges.deepPractice', descKey: 'challenges.deepPracticeDesc', emoji: '⚡', days: 7, color: 'var(--color-gold-400)' },
]

export function Challenges() {
  const { t } = useTranslation()
  const { xp, setXp, specialChallenges, setSpecialChallenges, profile, skillTree } = useApp()
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined

  const todayKey = new Date().toISOString().split('T')[0]
  const userId = profile?.id || 'anonymous'
  const positionKey = (profile?.positions ?? []).join('|')
  const challenges = useMemo(() => {
    const tree = skillTree || createInitialSkillTree(userId)
    const positions = positionKey ? positionKey.split('|') as Position[] : []
    return generateDailyChallenges(userId, todayKey, ageTierToChallengeDifficulty(ageTier), positions, tree)
  }, [userId, todayKey, ageTier, positionKey, skillTree])

  const dailyChallenges = challenges.filter((c) => c.reason !== 'weekly')
  const weeklyChallenge = challenges.find((c) => c.reason === 'weekly')
  const weeklyStorageKey = weeklyChallenge ? `golazo-weekly-${weeklyChallenge.templateId}` : null

  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(getDailyChallengeCompletionKey(todayKey))
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const [weeklyProgress, setWeeklyProgress] = useState<number>(() => {
    if (!weeklyStorageKey) return 0
    try {
      const stored = localStorage.getItem(weeklyStorageKey)
      return stored ? parseInt(stored, 10) : 0
    } catch { return 0 }
  })

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const completedCount = dailyChallenges.filter((c) => completedIds.has(c.templateId)).length

  function completeDaily(challenge: ActiveChallenge) {
    if (completedIds.has(challenge.templateId)) return
    const updated = new Set(completedIds).add(challenge.templateId)
    setCompletedIds(updated)
    localStorage.setItem(getDailyChallengeCompletionKey(todayKey), JSON.stringify([...updated]))
    setXp((currentXp) => awardXp(currentXp, challenge.xpReward, todayKey, ageTier))
  }

  function incrementWeekly() {
    if (!weeklyChallenge || !weeklyStorageKey) return
    if (weeklyProgress >= weeklyChallenge.target) return
    const newProgress = weeklyProgress + 1
    setWeeklyProgress(newProgress)
    localStorage.setItem(weeklyStorageKey, String(newProgress))
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
        sc.id === trackId ? { ...sc, daysCompleted: sc.daysCompleted + 1, lastLogDate: today } : sc,
      )
      setSpecialChallenges(updated)
      setXp(awardXp(xp, isNowComplete ? XP_AWARDS.specialTrackComplete : XP_AWARDS.specialTrackDay, today, ageTier))
    } else {
      setSpecialChallenges([...specialChallenges, { id: trackId, daysCompleted: 1, daysTarget, lastLogDate: today, startedAt: today }])
      setXp(awardXp(xp, XP_AWARDS.specialTrackDay, today, ageTier))
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Daily streak banner ── */}
      <div className="flex items-center justify-between">
        <p className="section-label">{t('challenges.daily')}</p>
        <div className="flex items-center gap-1.5">
          {dailyChallenges.map((c) => (
            <div
              key={c.templateId}
              className="w-3 h-3 rounded-full"
              style={{ background: completedIds.has(c.templateId) ? 'var(--color-primary)' : '#e5e7eb' }}
            />
          ))}
          <span className="text-xs font-bold ml-1" style={{ color: completedCount === dailyChallenges.length ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}>
            {completedCount}/{dailyChallenges.length}
          </span>
        </div>
      </div>

      {/* ── Daily challenge cards ── */}
      <div className="flex flex-col gap-3">
        {dailyChallenges.map((ch) => {
          const isDone = completedIds.has(ch.templateId)
          const isExpanded = expandedId === ch.templateId
          const catColor = CATEGORY_COLORS[ch.category] || CATEGORY_COLORS.technical
          const diff = DIFFICULTY_CONFIG[ch.difficulty]

          return (
            <div
              key={ch.templateId}
              className="card"
              style={{ opacity: isDone ? 0.65 : 1, borderLeft: `3px solid ${catColor.text}` }}
            >
              {/* Header row */}
              <button
                className="w-full text-left tap-target flex items-start gap-3"
                onClick={() => setExpandedId(isExpanded ? null : ch.templateId)}
              >
                <span className="text-2xl mt-0.5">{ch.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold flex-1">{isDone ? '✅ ' : ''}{t(ch.textKey)}</p>
                    {!isDone && (
                      <button
                        className="tap-target rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0"
                        style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)', border: 'none' }}
                        onClick={(e) => { e.stopPropagation(); completeDaily(ch) }}
                      >
                        +{ch.xpReward} XP
                      </button>
                    )}
                    {isDone && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                        ✓ {t('challenges.done')}
                      </span>
                    )}
                  </div>
                  {/* Meta row: target, difficulty, time, location */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: catColor.bg, color: catColor.text }}>
                      {ch.target} {ch.unit}
                    </span>
                    <span className="text-[10px]" title={ch.difficulty}>{diff.label}</span>
                    {ch.estimateMin > 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        ⏱ {ch.estimateMin}{t('learn.minutes')}
                      </span>
                    )}
                    <span className="text-[10px]">{LOCATION_EMOJI[ch.location]}</span>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 animate-fade-up" style={{ borderTop: '1px solid #e5e7eb' }}>
                  {/* Description / instructions */}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {t(ch.descKey)}
                  </p>

                  {/* Pro tips */}
                  {ch.tipsKey && (
                    <div className="mt-2 p-2.5 rounded-lg" style={{ background: '#fffbeb' }}>
                      <p className="text-xs font-bold" style={{ color: '#92400e' }}>💡 {t('challenges.proTip')}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#78350f' }}>{t(ch.tipsKey)}</p>
                    </div>
                  )}

                  {/* Why this challenge? */}
                  <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-muted)' }}>
                    {t(getChallengeReasonKey(ch.reason), { category: t(`learn.cat.${ch.category}`) })}
                  </p>

                  {/* Complete button (if not done) */}
                  {!isDone && (
                    <button
                      className="btn-primary tap-target w-full mt-3 text-sm"
                      onClick={() => completeDaily(ch)}
                    >
                      {t('challenges.markDone')} (+{ch.xpReward} XP)
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── All done celebration ── */}
      {completedCount === dailyChallenges.length && dailyChallenges.length > 0 && (
        <div className="card flex items-center gap-3 animate-fade-up" style={{ background: 'var(--color-primary-bg-subtle)' }}>
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>{t('challenges.allDone')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('challenges.comeBackTomorrow')}</p>
          </div>
        </div>
      )}

      {/* ── Weekly challenge ── */}
      {weeklyChallenge && (
        <>
          <p className="section-label">{t('challenges.weekly')}</p>
          <div className="card" style={{ borderLeft: `3px solid var(--color-primary)` }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{weeklyChallenge.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{t(weeklyChallenge.textKey)}</p>
                  <span className="text-xs font-data font-bold" style={{ color: weeklyProgress >= weeklyChallenge.target ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}>
                    {weeklyProgress >= weeklyChallenge.target ? '🏆' : `${weeklyProgress}/${weeklyChallenge.target}`}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t(weeklyChallenge.descKey)}</p>
                <div className="progress-track mt-2">
                  <div className="progress-fill" style={{ width: `${Math.min((weeklyProgress / weeklyChallenge.target) * 100, 100)}%`, background: 'var(--color-primary)' }} />
                </div>
                {weeklyProgress < weeklyChallenge.target && (
                  <button className="btn-primary tap-target w-full mt-2 text-xs" onClick={incrementWeekly}>
                    {t('challenges.logProgress')} (+{weeklyChallenge.xpReward} XP {t('challenges.onComplete')})
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Special tracks ── */}
      <p className="section-label">{t('challenges.special')}</p>
      <div className="flex flex-col gap-3">
        {SPECIAL_TRACKS.map((track) => {
          const progress = getSpecialProgress(track.id)
          const pct = progress ? Math.min((progress.daysCompleted / track.days) * 100, 100) : 0
          const loggedToday = progress?.lastLogDate === todayKey
          const isComplete = progress ? progress.daysCompleted >= track.days : false

          return (
            <button
              key={track.id}
              className="card text-left w-full"
              style={{ borderLeft: `3px solid ${track.color}` }}
              onClick={() => !isComplete && startOrLogSpecial(track.id, track.days)}
              disabled={loggedToday || isComplete}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{track.emoji}</span>
                <div className="flex-1">
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
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t(track.descKey)}</p>
                  <div className="progress-track mt-2">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: track.color }} />
                  </div>
                  {loggedToday && !isComplete && (
                    <p className="text-xs mt-1 font-bold" style={{ color: 'var(--color-primary-dark)' }}>✓ {t('challenges.loggedToday')}</p>
                  )}
                  {isComplete && (
                    <p className="text-xs mt-1 font-bold" style={{ color: 'var(--color-primary-dark)' }}>🏆 {t('challenges.trackComplete')}</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
