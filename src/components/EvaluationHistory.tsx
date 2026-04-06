import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import type { PlayerEvaluation } from '../engine/types'

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'var(--color-cat-technical)',
  tactical: 'var(--color-cat-tactical)',
  physical: 'var(--color-cat-physical)',
  mental: 'var(--color-cat-mental)',
  performance: 'var(--color-cat-matchplay)',
  knowledge: 'var(--color-cat-knowledge)',
}

/**
 * Shows coach evaluations received by the player.
 * Displayed on player Progress page.
 */
export function EvaluationHistory() {
  const { t } = useTranslation()
  const { profile } = useApp()
  const [evaluations, setEvaluations] = useState<PlayerEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile?.teams?.length) { setLoading(false); return }

      try {
        const teamIds = profile.teams
          .filter((t) => t.active && t.registryId)
          .map((t) => t.registryId!)

        const allEvals: PlayerEvaluation[] = []
        for (const teamId of teamIds.slice(0, 5)) {
          try {
            const res = await fetch(`/api/coach/squad/${encodeURIComponent(teamId)}/evaluations`)
            if (res.ok) {
              const data = await res.json()
              const items: PlayerEvaluation[] = data.evaluations ?? []
              // Only show evaluations for THIS player
              const mine = items.filter((e) => e.playerId === profile.id)
              allEvals.push(...mine)
            }
          } catch { /* skip */ }
        }

        if (!cancelled) {
          allEvals.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          setEvaluations(allEvals.slice(0, 10))
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.teams, profile?.id])

  if (loading || evaluations.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="section-label">📊 {t('player.evaluations')}</p>
      {evaluations.map((ev) => (
        <div key={ev.id} className="card animate-fade-up">
          <button
            className="w-full text-left"
            onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold">{ev.period}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {ev.coachName} · {new Date(ev.date).toLocaleDateString()}
              </p>
            </div>

            {/* Mini rating bars */}
            <div className="grid grid-cols-6 gap-1">
              {([
                { key: 'technical', val: ev.technicalRating },
                { key: 'tactical', val: ev.tacticalRating },
                { key: 'physical', val: ev.physicalRating },
                { key: 'mental', val: ev.mentalRating },
                { key: 'performance', val: ev.performanceRating },
                { key: 'knowledge', val: ev.knowledgeRating },
              ]).map(({ key, val }) => (
                <div key={key} className="text-center">
                  <div className="h-1.5 rounded-full mb-0.5" style={{ background: 'var(--color-glass-hover)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${val * 10}%`,
                      background: CATEGORY_COLORS[key] ?? 'var(--color-primary)',
                    }} />
                  </div>
                  <span className="text-[8px] font-bold" style={{ color: CATEGORY_COLORS[key] }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </button>

          {/* Expanded: full details */}
          {expanded === ev.id && (
            <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
              {/* Attendance */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  {t('coach.eval.attendancePct')}
                </span>
                <span className="text-xs font-black font-data">{ev.attendance}%</span>
              </div>

              {/* Strengths */}
              {ev.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-primary-dark)' }}>
                    ✓ {t('coach.eval.strengths')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ev.strengths.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-success-bg)', color: 'var(--color-primary-dark)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas to improve */}
              {ev.areasToImprove.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-amber-text)' }}>
                    ↑ {t('coach.eval.improve')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ev.areasToImprove.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {ev.goalsForNextPeriod.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    🎯 {t('coach.eval.goals')}
                  </p>
                  {ev.goalsForNextPeriod.map((g, i) => (
                    <p key={i} className="text-xs ml-4" style={{ color: 'var(--color-text-secondary)' }}>• {g}</p>
                  ))}
                </div>
              )}

              {/* Coach notes */}
              {ev.coachNotes && (
                <p className="text-xs italic mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  "{ev.coachNotes}"
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
