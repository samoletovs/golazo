import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import type { TrainingType, FocusArea, EnergyLevel, TrainingEntry } from '../engine/types'

const TYPES: { key: TrainingType; labelKey: string }[] = [
  { key: 'team', labelKey: 'training.type.team' },
  { key: 'individual', labelKey: 'training.type.individual' },
  { key: 'gym', labelKey: 'training.type.gym' },
  { key: 'futsal', labelKey: 'training.type.futsal' },
]

const FOCUS: { key: FocusArea; labelKey: string }[] = [
  { key: 'technical', labelKey: 'training.focus.technical' },
  { key: 'physical', labelKey: 'training.focus.physical' },
  { key: 'tactical', labelKey: 'training.focus.tactical' },
  { key: 'mental', labelKey: 'training.focus.mental' },
]

const DURATIONS = [60, 90, 120]
const ENERGY_EMOJIS = ['😴', '😐', '🙂', '😄', '🔥']

export function TrainingLog({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()
  const { xp, setXp, addTraining } = useApp()
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [type, setType] = useState<TrainingType>('team')
  const [duration, setDuration] = useState(90)
  const [focus, setFocus] = useState<FocusArea[]>([])
  const [energy, setEnergy] = useState<EnergyLevel>(3)
  const [mood, setMood] = useState<EnergyLevel>(3)
  const [notes, setNotes] = useState('')

  function toggleFocus(f: FocusArea) {
    setFocus((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  function handleSave() {
    const entry: TrainingEntry = {
      id: crypto.randomUUID(),
      playerId: 'default',
      date: today,
      type,
      durationMinutes: duration,
      focusAreas: focus,
      energy,
      mood,
      notes,
      exerciseIds: [],
      createdAt: new Date().toISOString(),
    }
    addTraining(entry)
    setXp(awardXp(xp, XP_AWARDS.logTraining, today))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 pb-32 animate-fade-up">
        <span className="text-5xl animate-float">✅</span>
        <p className="text-lg font-bold" style={{ color: 'var(--color-green-400)' }}>
          {t('training.saved', { xp: XP_AWARDS.logTraining })}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        )}
        <h2 className="text-lg font-bold">{t('training.title')}</h2>
      </div>

      {/* Type selector */}
      <div>
        <p className="section-label mb-2">
          {t('log.training')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((tp) => (
            <button
              key={tp.key}
              className="btn-choice tap-target text-center text-sm"
              onClick={() => setType(tp.key)}
              aria-pressed={type === tp.key}
            >
              {t(tp.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="section-label mb-2">
          {t('training.duration')}
        </p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              className="btn-choice tap-target flex-1 text-center text-sm"
              onClick={() => setDuration(d)}
              aria-pressed={duration === d}
            >
              {t('training.minutes', { min: d })}
            </button>
          ))}
        </div>
      </div>

      {/* Focus areas */}
      <div>
        <p className="section-label mb-2">
          {t('training.focus')}
        </p>
        <div className="flex flex-wrap gap-2">
          {FOCUS.map((f) => (
            <button
              key={f.key}
              className="btn-choice tap-target text-sm px-4"
              onClick={() => toggleFocus(f.key)}
              aria-pressed={focus.includes(f.key)}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div>
        <p className="section-label mb-2">
          {t('training.energy')}
        </p>
        <div className="flex gap-2 justify-center">
          {ENERGY_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              className="emoji-btn"
              data-selected={energy === (i + 1)}
              onClick={() => setEnergy((i + 1) as EnergyLevel)}
              aria-label={`Energy level ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div>
        <p className="section-label mb-2">
          {t('training.mood')}
        </p>
        <div className="flex gap-2 justify-center">
          {ENERGY_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              className="emoji-btn"
              data-selected={mood === (i + 1)}
              onClick={() => setMood((i + 1) as EnergyLevel)}
              aria-label={`Mood level ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <textarea
          className="w-full rounded-xl p-3 text-sm"
          style={{ resize: 'none' }}
          rows={3}
          placeholder={t('training.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Save button */}
      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        aria-label={t('training.save')}
      >
        {t('training.save')} (+{XP_AWARDS.logTraining} XP)
      </button>
    </div>
  )
}
