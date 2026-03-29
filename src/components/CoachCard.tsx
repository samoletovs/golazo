import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'

interface CoachAdvice {
  recommendation: string
  drills: string[]
  focusArea: string
  weeklyGoal?: string
}

export function CoachCard() {
  const { t } = useTranslation()
  const { skillTree, matches, trainings, physicalProfile } = useApp()
  const { user } = useAuth()
  const [advice, setAdvice] = useState<CoachAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Load cached advice from localStorage
    const cached = localStorage.getItem('golazo-coach')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setAdvice(parsed.data)
          return
        }
      } catch { /* ignore */ }
    }
  }, [])

  async function fetchAdvice() {
    setLoading(true)
    setError(false)
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
      setAdvice(data)
      localStorage.setItem('golazo-coach', JSON.stringify({ data, ts: Date.now() }))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-glow animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <h2 className="text-sm font-bold">{t('coach.title')}</h2>
      </div>

      {advice ? (
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
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton" style={{ width: '100%', height: 14 }} />
          <div className="skeleton" style={{ width: '85%', height: 14 }} />
          <div className="skeleton" style={{ width: '60%', height: 14 }} />
          <div className="flex gap-2 mt-1">
            <div className="skeleton" style={{ width: 64, height: 24, borderRadius: 999 }} />
            <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 999 }} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('coach.hint')}
          </p>
          <button
            className="btn-primary text-sm py-2 px-4"
            onClick={fetchAdvice}
            disabled={loading || !user}
            aria-label={t('coach.getAdvice')}
          >
            {loading ? t('common.loading') : t('coach.getAdvice')}
          </button>
          {error && (
            <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{t('coach.error')}</p>
          )}
        </div>
      )}
    </div>
  )
}
