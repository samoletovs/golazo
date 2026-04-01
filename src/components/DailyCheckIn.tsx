import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardCheckInXp, XP_AWARDS, scaleXp } from '../engine/xp'
import { getAgeTier } from '../engine/types'
import type { EnergyLevel, DailyCheckIn as DailyCheckInType } from '../engine/types'

const EMOJIS = ['😴', '😐', '🙂', '😄', '🔥']

interface DailyCheckInProps {
  onComplete?: () => void
  compact?: boolean // used inside morning routine
}

export function DailyCheckIn({ onComplete, compact }: DailyCheckInProps) {
  const { t } = useTranslation()
  const { xp, setXp, checkIns, addCheckIn, profile } = useApp()
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined
  const scaledCheckInXp = scaleXp(XP_AWARDS.dailyCheckIn, ageTier)

  const today = new Date().toISOString().slice(0, 10)
  const alreadyCheckedIn = checkIns.some((c) => c.date === today)

  const [mood, setMood] = useState<EnergyLevel | null>(null)
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [saved, setSaved] = useState(alreadyCheckedIn)

  function handleSave() {
    if (mood === null || energy === null) return

    const entry: DailyCheckInType = {
      id: crypto.randomUUID(),
      date: today,
      mood,
      energy,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    addCheckIn(entry)
    setXp(awardCheckInXp(xp, XP_AWARDS.dailyCheckIn, today, ageTier))
    setSaved(true)
    onComplete?.()
  }

  if (saved) {
    return (
      <div className={compact ? 'flex items-center gap-2 p-2' : 'card flex items-center gap-3 animate-fade-up'}>
        <span className="text-xl">✅</span>
        <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>
          {t('checkin.done')} +{scaledCheckInXp} XP
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'flex flex-col gap-4' : 'card flex flex-col gap-4 animate-fade-up'}>
      {!compact && (
        <div className="flex items-center gap-2">
          <span className="text-lg">🌤️</span>
          <p className="text-base font-bold heading-display">
            {t('checkin.title')}
          </p>
        </div>
      )}

      {/* Mood */}
      <div>
        <p className="section-label mb-2">{t('checkin.mood')}</p>
        <div className="flex gap-2 justify-center">
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              className="emoji-btn"
              data-selected={mood === (i + 1)}
              onClick={() => setMood((i + 1) as EnergyLevel)}
              aria-label={`Mood ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div>
        <p className="section-label mb-2">{t('checkin.energy')}</p>
        <div className="flex gap-2 justify-center">
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              className="emoji-btn"
              data-selected={energy === (i + 1)}
              onClick={() => setEnergy((i + 1) as EnergyLevel)}
              aria-label={`Energy ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Optional note */}
      {showNote ? (
        <textarea
          className="w-full rounded-xl p-3 text-sm"
          style={{ resize: 'none' }}
          rows={2}
          placeholder={t('checkin.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      ) : (
        <button
          className="text-xs tap-target"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={() => setShowNote(true)}
        >
          + {t('checkin.addNote')}
        </button>
      )}

      {/* Save */}
      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        disabled={mood === null || energy === null}
      >
        {t('checkin.save')} (+{scaledCheckInXp} XP)
      </button>
    </div>
  )
}
