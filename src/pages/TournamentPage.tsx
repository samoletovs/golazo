import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import type { Tournament } from '../engine/types'

export function TournamentPage({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()
  const { xp, setXp, addTournament } = useApp()
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [games, setGames] = useState(3)
  const [startDate] = useState(today)

  function handleSave() {
    if (!name.trim()) return
    const entry: Tournament = {
      id: crypto.randomUUID(),
      playerId: 'default',
      name,
      startDate,
      endDate: startDate,
      location,
      expectedGames: games,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    addTournament(entry)
    setXp(awardXp(xp, XP_AWARDS.completeTournament, today))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 pb-32 animate-fade-up">
        <span className="text-5xl animate-float">🏆</span>
        <p className="text-lg font-bold" style={{ color: 'var(--color-green-500)' }}>
          {t('tournament.completed', { xp: 50 })}
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
        <h2 className="text-lg font-bold">{t('tournament.title')}</h2>
      </div>

      <input
        className="w-full text-sm"
        placeholder={t('tournament.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full text-sm"
        placeholder={t('tournament.location')}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      <div>
        <p className="section-label mb-2">{t('tournament.games')}</p>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              className="btn-choice tap-target flex-1 text-center text-sm"
              onClick={() => setGames(n)}
              aria-pressed={games === n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        disabled={!name.trim()}
        aria-label={t('tournament.complete')}
      >
        {t('tournament.complete')} (+50 XP)
      </button>
    </div>
  )
}
