import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import type { TrainingDrill, TrainingPlan } from '../engine/types'

interface TrainingPlannerProps {
  teamId: string
  teamName: string
  coachId: string
  onBack: () => void
}

function DrillForm({ drill, onChange, onRemove }: {
  drill: TrainingDrill
  onChange: (d: TrainingDrill) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={drill.title}
          onChange={(e) => onChange({ ...drill, title: e.target.value })}
          placeholder={t('coach.training.addDrill')}
          className="flex-1 text-sm font-bold"
        />
        <button className="text-xs tap-target" onClick={onRemove} style={{ color: 'var(--color-danger)' }}>✕</button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={drill.description ?? ''}
          onChange={(e) => onChange({ ...drill, description: e.target.value })}
          placeholder={t('coach.training.custom')}
          className="flex-1 text-xs"
        />
        <input
          type="number"
          value={drill.durationMinutes || ''}
          onChange={(e) => onChange({ ...drill, durationMinutes: Number(e.target.value) || 0 })}
          placeholder={t('coach.training.duration')}
          className="w-16 text-xs text-center"
          min={1}
          max={60}
        />
      </div>
    </div>
  )
}

export function TrainingPlanner({ teamId, teamName, coachId, onBack }: TrainingPlannerProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('18:00')
  const [location, setLocation] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [objectives, setObjectives] = useState<string[]>([])
  const [objInput, setObjInput] = useState('')
  const [drills, setDrills] = useState<TrainingDrill[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  function addObjective() {
    if (!objInput.trim()) return
    setObjectives([...objectives, objInput.trim()])
    setObjInput('')
  }

  function addDrill() {
    setDrills([...drills, { title: '', durationMinutes: 10 }])
  }

  function updateDrill(idx: number, drill: TrainingDrill) {
    setDrills(drills.map((d, i) => i === idx ? drill : d))
  }

  function removeDrill(idx: number) {
    setDrills(drills.filter((_, i) => i !== idx))
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const plan: Omit<TrainingPlan, 'id' | 'createdAt'> = {
        teamId,
        coachId,
        title: title.trim(),
        date,
        startTime,
        location: location.trim() || undefined,
        durationMinutes,
        objectives,
        drills: drills.filter((d) => d.title.trim()),
        notes: notes.trim() || undefined,
      }
      const res = await fetch('/api/coach/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
      if (res.ok) {
        showToast(t('coach.training.saved'), 'success')
        onBack()
      }
    } catch { /* offline */ }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold heading-display">{t('coach.training.new')}</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teamName}</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="card animate-fade-up">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('coach.training.title')}
            className="text-sm font-bold w-full"
          />
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 text-xs" />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-24 text-xs" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('schedule.location')}
              className="flex-1 text-xs"
            />
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 90)}
              className="w-20 text-xs text-center"
              min={15}
              max={180}
            />
            <span className="text-xs self-center" style={{ color: 'var(--color-text-muted)' }}>min</span>
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div className="card">
        <p className="section-label mb-2">{t('coach.training.objectives')}</p>
        {objectives.map((obj, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <span className="text-xs" style={{ color: 'var(--color-primary)' }}>•</span>
            <span className="text-xs flex-1">{obj}</span>
            <button className="text-xs" onClick={() => setObjectives(objectives.filter((_, j) => j !== i))}
              style={{ color: 'var(--color-danger)' }}>✕</button>
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={objInput}
            onChange={(e) => setObjInput(e.target.value)}
            placeholder={t('coach.training.addObjective')}
            className="flex-1 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && addObjective()}
          />
          <button className="text-xs px-2 py-1 rounded"
            style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-dark)' }}
            onClick={addObjective}>+</button>
        </div>
      </div>

      {/* Drills */}
      <div>
        <p className="section-label mb-2">{t('coach.training.drills')}</p>
        <div className="flex flex-col gap-2">
          {drills.map((drill, i) => (
            <DrillForm key={i} drill={drill} onChange={(d) => updateDrill(i, d)} onRemove={() => removeDrill(i)} />
          ))}
        </div>
        <button
          className="w-full text-center py-3 mt-2 rounded-xl text-xs font-bold tap-target"
          style={{ background: 'var(--color-glass-hover)', color: 'var(--color-primary-dark)' }}
          onClick={addDrill}
        >
          + {t('coach.training.addDrill')}
        </button>
      </div>

      {/* Notes */}
      <div className="card">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('coach.eval.notes')}
          className="w-full text-xs"
          rows={3}
        />
      </div>

      {/* Save */}
      <button
        className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
        onClick={save}
        disabled={saving || !title.trim()}
      >
        {saving ? '...' : `✓ ${t('coach.training.saved').replace('!', '')}`}
      </button>
    </div>
  )
}
