import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { generateLocalAdvice, type CoachAdvice, type CoachInsight } from '../engine/coach'

function InsightRow({ insight }: { insight: CoachInsight }) {
  return (
    <div className="flex gap-2 items-start py-1.5">
      <span className="text-sm shrink-0">{insight.icon}</span>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {insight.text}
      </p>
    </div>
  )
}

export function CoachCard() {
  const { t } = useTranslation()
  const { skillTree, matches, trainings, diary, tournaments, physicalProfile, checkIns } = useApp()
  const [aiAdvice, setAiAdvice] = useState<CoachAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  const localAdvice = useMemo(
    () => generateLocalAdvice(skillTree, matches, trainings, t, diary, tournaments, checkIns),
    [skillTree, matches, trainings, t, diary, tournaments, checkIns],
  )

  // Rotate: show 1 skill focus per day (deterministic from date)
  const dailyAdvice = useMemo(() => {
    const advice = aiAdvice ?? localAdvice
    // Always keep wellbeing insight if present
    const wellbeingInsight = advice.insights.find((i) => i.category === 'wellbeing')
    const skillInsights = advice.insights.filter((i) => i.category !== 'wellbeing')

    if (skillInsights.length <= 1) return advice

    // Pick one skill category per day based on date
    const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
    const todayInsight = skillInsights[dayIndex % skillInsights.length]

    const focused: typeof advice.insights = []
    if (wellbeingInsight) focused.push(wellbeingInsight)
    if (todayInsight) focused.push(todayInsight)

    return { ...advice, insights: focused }
  }, [aiAdvice, localAdvice])

  useEffect(() => {
    const cached = localStorage.getItem('golazo-coach')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000 && parsed.data?.focusArea !== 'general') {
          setAiAdvice(parsed.data)
          setAiAvailable(true)
          return
        }
        localStorage.removeItem('golazo-coach')
      } catch { localStorage.removeItem('golazo-coach') }
    }
  }, [])

  async function fetchAiAdvice() {
    setLoading(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillTree,
          recentMatches: matches.slice(-10),
          recentTrainings: trainings.slice(-10),
          recentDiary: diary.filter((d) => d.aiConsent !== false).slice(-10).map((d) => ({ date: d.date, mood: d.mood })),
          recentCheckIns: checkIns.slice(-14).map((c) => ({ date: c.date, mood: c.mood, energy: c.energy })),
          physicalProfile,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json() as CoachAdvice
      if ((data.focusArea as string) === 'general') {
        setAiAvailable(false)
        return
      }
      setAiAdvice(data)
      setAiAvailable(true)
      localStorage.setItem('golazo-coach', JSON.stringify({ data, ts: Date.now() }))
    } catch {
      setAiAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const advice = dailyAdvice
  const visibleInsights = advice.insights

  return (
    <div className="card-glow animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🧠</span>
        <p className="text-base font-bold heading-display">{t('coach.title')}</p>
        {aiAdvice && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
            AI
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* Greeting */}
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {advice.greeting}
        </p>

        {/* Main recommendation */}
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {advice.recommendation}
        </p>

        {/* Weekly goal */}
        {advice.weeklyGoal && (
          <div className="stat-pill stat-pill-green text-xs">
            🎯 {advice.weeklyGoal}
          </div>
        )}

        {/* Insights */}
        {visibleInsights.length > 0 && (
          <div className="flex flex-col mt-1" style={{ borderTop: '1px solid var(--color-glass-border)', paddingTop: '8px' }}>
            {visibleInsights.map((insight, i) => (
              <InsightRow key={i} insight={insight} />
            ))}
          </div>
        )}

        {/* Drills */}
        {advice.drills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {advice.drills.map((drill, i) => (
              <span key={i} className="stat-pill stat-pill-cyan text-xs">{drill}</span>
            ))}
          </div>
        )}

        {/* AI upgrade button */}
        {!aiAdvice && aiAvailable !== false && (
          <button
            className="text-xs mt-1 self-start"
            style={{ color: 'var(--color-primary-dark)', opacity: loading ? 0.5 : 1 }}
            onClick={fetchAiAdvice}
            disabled={loading}
          >
            {loading ? '...' : `✨ ${t('coach.getAiAdvice')}`}
          </button>
        )}
      </div>
    </div>
  )
}
