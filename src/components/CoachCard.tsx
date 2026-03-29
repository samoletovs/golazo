import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { generateLocalAdvice, type CoachAdvice } from '../engine/coach'

export function CoachCard() {
  const { t } = useTranslation()
  const { skillTree, matches, trainings, physicalProfile } = useApp()
  const [aiAdvice, setAiAdvice] = useState<CoachAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null) // null = unknown

  // Generate local advice immediately from skill data
  const localAdvice = useMemo(
    () => generateLocalAdvice(skillTree, matches, trainings, t),
    [skillTree, matches, trainings, t],
  )

  // Check for cached AI advice
  useEffect(() => {
    const cached = localStorage.getItem('golazo-coach')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setAiAdvice(parsed.data)
          setAiAvailable(true)
          return
        }
      } catch { /* ignore */ }
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
          physicalProfile,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json() as CoachAdvice
      // Check if API returned the "not configured" fallback
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

  const advice = aiAdvice ?? localAdvice

  return (
    <div className="card-glow animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <h2 className="text-sm font-bold">{t('coach.title')}</h2>
        {aiAdvice && (
          <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--color-primary-light, #dcfce7)', color: 'var(--color-primary-dark, #166534)' }}>
            AI
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {advice.recommendation}
        </p>
        {advice.weeklyGoal && (
          <div className="stat-pill stat-pill-green text-xs">
            {t('coach.weeklyGoal')}: {advice.weeklyGoal}
          </div>
        )}
        {advice.drills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {advice.drills.map((drill, i) => (
              <span key={i} className="stat-pill stat-pill-cyan text-xs">{drill}</span>
            ))}
          </div>
        )}
        {/* Show AI upgrade button if AI not tried yet or available */}
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
