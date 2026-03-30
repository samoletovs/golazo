import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { weakestCategory } from '../engine/skills'

/** Weekly summary card — locally generated, no API call. */
export function WeeklySummary() {
  const { t } = useTranslation()
  const { trainings, matches, checkIns, skillTree } = useApp()

  const summary = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const inRange = (date: string) => new Date(date) >= weekAgo && new Date(date) <= now

    const weekTrainings = trainings.filter((tr) => inRange(tr.date))
    const weekMatches = matches.filter((m) => inRange(m.date))
    const weekCheckIns = checkIns.filter((c) => inRange(c.date))

    if (weekTrainings.length === 0 && weekMatches.length === 0 && weekCheckIns.length === 0) {
      return null // no data this week
    }

    const avgMood = weekCheckIns.length > 0
      ? (weekCheckIns.reduce((s, c) => s + c.mood, 0) / weekCheckIns.length).toFixed(1)
      : null

    const focus = weakestCategory(skillTree)

    return {
      trainings: weekTrainings.length,
      matches: weekMatches.length,
      goals: weekMatches.reduce((s, m) => s + m.goals, 0),
      avgMood,
      focus,
    }
  }, [trainings, matches, checkIns, skillTree])

  if (!summary) return null

  return (
    <div className="card animate-fade-up">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📊</span>
        <p className="section-label">{t('weeklySummary.title')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="stat-pill stat-pill-green">
          ⚽ {t('weeklySummary.trainings', { count: summary.trainings })}
        </span>
        <span className="stat-pill stat-pill-cyan">
          🏟️ {t('weeklySummary.matches', { count: summary.matches })}
        </span>
        {summary.avgMood && (
          <span className="stat-pill stat-pill-gold">
            {t('weeklySummary.avgMood', { mood: summary.avgMood })}
          </span>
        )}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
        🎯 {t('weeklySummary.focus', { area: summary.focus })}
      </p>
    </div>
  )
}
