import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import type { RosterPlayer, PlayerEvaluation } from '../engine/types'

interface EvaluationPageProps {
  squadId: string
  squadName: string
  coachId: string
  coachName: string
  initialPlayerId?: string
  onBack: () => void
}

const EVAL_CATEGORIES: { key: string; field: keyof Pick<PlayerEvaluation, 'technicalRating' | 'tacticalRating' | 'physicalRating' | 'mentalRating' | 'performanceRating' | 'knowledgeRating'> }[] = [
  { key: 'technical', field: 'technicalRating' },
  { key: 'tactical', field: 'tacticalRating' },
  { key: 'physical', field: 'physicalRating' },
  { key: 'mental', field: 'mentalRating' },
  { key: 'performance', field: 'performanceRating' },
  { key: 'knowledge', field: 'knowledgeRating' },
]

export function EvaluationPage({ squadId, squadName, coachId, coachName, initialPlayerId, onBack }: EvaluationPageProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [players, setPlayers] = useState<RosterPlayer[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(initialPlayerId ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form
  const [period, setPeriod] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({
    technicalRating: 5, tacticalRating: 5, physicalRating: 5,
    mentalRating: 5, performanceRating: 5, knowledgeRating: 5,
  })
  const [attendancePct, setAttendancePct] = useState(80)
  const [strengths, setStrengths] = useState<string[]>([])
  const [strengthInput, setStrengthInput] = useState('')
  const [improvements, setImprovements] = useState<string[]>([])
  const [improveInput, setImproveInput] = useState('')
  const [coachNotes, setCoachNotes] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/coach/squad/${encodeURIComponent(squadId)}/roster`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setPlayers(data.players ?? [])
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [squadId])

  function addItem(list: string[], setter: (v: string[]) => void, input: string, inputSetter: (v: string) => void) {
    if (!input.trim()) return
    setter([...list, input.trim()])
    inputSetter('')
  }

  async function save() {
    if (!selectedPlayerId || !period.trim()) return
    setSaving(true)
    try {
      const evaluation = {
        squadId,
        playerId: selectedPlayerId,
        coachId,
        coachName,
        date: new Date().toISOString().slice(0, 10),
        period: period.trim(),
        ...ratings,
        attendance: attendancePct,
        strengths,
        areasToImprove: improvements,
        coachNotes: coachNotes.trim() || undefined,
        goalsForNextPeriod: goals,
      }
      const res = await fetch(`/api/coach/squad/${encodeURIComponent(squadId)}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation),
      })
      if (res.ok) {
        showToast(t('coach.eval.saved'), 'success')
        onBack()
      }
    } catch { /* offline */ }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <div>
          <h2 className="text-lg font-extrabold heading-display">{t('coach.eval.title')}</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{squadName}</p>
        </div>
      </div>

      {/* Player selector */}
      {loading ? (
        <div className="text-center py-4">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
        </div>
      ) : (
        <div className="card">
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full text-sm font-bold p-2 rounded-lg"
          >
            <option value="">{t('coach.dashboard.players')}...</option>
            {players.map((p) => (
              <option key={p.playerId} value={p.playerId}>
                {p.playerName} {p.jerseyNumber ? `#${p.jerseyNumber}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlayerId && (
        <>
          {/* Period */}
          <div className="card">
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder={t('coach.eval.period')}
              className="w-full text-sm"
            />
          </div>

          {/* Ratings */}
          <div className="card">
            <div className="flex flex-col gap-3">
              {EVAL_CATEGORIES.map(({ key, field }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{t(`coach.eval.${key}`)}</span>
                    <span className="text-sm font-black font-data" style={{ color: 'var(--color-primary-dark)' }}>
                      {ratings[field]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ratings[field]}
                    onChange={(e) => setRatings({ ...ratings, [field]: Number(e.target.value) })}
                    className="w-full"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                </div>
              ))}

              {/* Attendance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{t('coach.eval.attendancePct')}</span>
                  <span className="text-sm font-black font-data" style={{ color: 'var(--color-primary-dark)' }}>
                    {attendancePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={attendancePct}
                  onChange={(e) => setAttendancePct(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div className="card">
            <p className="section-label mb-2">{t('coach.eval.strengths')}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {strengths.map((s, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: 'var(--color-success-bg)', color: 'var(--color-primary-dark)' }}>
                  {s}
                  <button onClick={() => setStrengths(strengths.filter((_, j) => j !== i))}
                    className="text-xs" style={{ color: 'var(--color-danger)' }}>✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={strengthInput} onChange={(e) => setStrengthInput(e.target.value)}
                placeholder={t('coach.eval.addStrength')} className="flex-1 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addItem(strengths, setStrengths, strengthInput, setStrengthInput)} />
              <button className="text-xs px-2 py-1 rounded"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-dark)' }}
                onClick={() => addItem(strengths, setStrengths, strengthInput, setStrengthInput)}>+</button>
            </div>
          </div>

          {/* Areas to improve */}
          <div className="card">
            <p className="section-label mb-2">{t('coach.eval.improve')}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {improvements.map((s, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)' }}>
                  {s}
                  <button onClick={() => setImprovements(improvements.filter((_, j) => j !== i))}
                    className="text-xs" style={{ color: 'var(--color-danger)' }}>✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={improveInput} onChange={(e) => setImproveInput(e.target.value)}
                placeholder={t('coach.eval.addImprove')} className="flex-1 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addItem(improvements, setImprovements, improveInput, setImproveInput)} />
              <button className="text-xs px-2 py-1 rounded"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-dark)' }}
                onClick={() => addItem(improvements, setImprovements, improveInput, setImproveInput)}>+</button>
            </div>
          </div>

          {/* Coach notes */}
          <div className="card">
            <p className="section-label mb-2">{t('coach.eval.notes')}</p>
            <textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)}
              className="w-full text-xs" rows={3} />
          </div>

          {/* Goals */}
          <div className="card">
            <p className="section-label mb-2">{t('coach.eval.goals')}</p>
            <div className="flex flex-col gap-1 mb-2">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-primary)' }}>🎯</span>
                  <span className="text-xs flex-1">{g}</span>
                  <button onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                    className="text-xs" style={{ color: 'var(--color-danger)' }}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                placeholder={t('coach.eval.addGoal')} className="flex-1 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && addItem(goals, setGoals, goalInput, setGoalInput)} />
              <button className="text-xs px-2 py-1 rounded"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-dark)' }}
                onClick={() => addItem(goals, setGoals, goalInput, setGoalInput)}>+</button>
            </div>
          </div>

          {/* Save */}
          <button
            className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
            onClick={save}
            disabled={saving || !selectedPlayerId || !period.trim()}
          >
            {saving ? '...' : `✓ ${t('coach.eval.save')}`}
          </button>
        </>
      )}
    </div>
  )
}
