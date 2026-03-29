import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { TeamPicker } from '../components/TeamPicker'
import { getMatchDurationRecommendation } from '../engine/footballStandards'
import type { Position, EnergyLevel, MatchEntry } from '../engine/types'

const POSITIONS: { key: Position; label: string }[] = [
  { key: 'CM', label: 'CM' }, { key: 'LW', label: 'LW' }, { key: 'RW', label: 'RW' },
  { key: 'LM', label: 'LM' }, { key: 'RM', label: 'RM' }, { key: 'CAM', label: 'CAM' },
  { key: 'CDM', label: 'CDM' }, { key: 'LB', label: 'LB' }, { key: 'RB', label: 'RB' },
  { key: 'ST', label: 'ST' }, { key: 'CB', label: 'CB' }, { key: 'GK', label: 'GK' },
]

const ENERGY_EMOJIS = ['😴', '😐', '🙂', '😄', '🔥']

export interface MatchLogProps {
  onBack?: () => void
  inline?: boolean
  prefill?: { opponent?: string; competition?: string; tournamentId?: string }
  onSaved?: () => void
}

export function MatchLog({ onBack, inline, prefill, onSaved }: MatchLogProps) {
  const { t } = useTranslation()
  const { xp, setXp, addMatch, profile } = useApp()
  const durationRecommendation = getMatchDurationRecommendation(profile?.birthDate)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [opponent, setOpponent] = useState(prefill?.opponent ?? '')
  const [competition, setCompetition] = useState(prefill?.competition ?? '')
  const [playingFor, setPlayingFor] = useState(profile?.team || '')
  const [scoreUs, setScoreUs] = useState(0)
  const [scoreThem, setScoreThem] = useState(0)
  const [positions, setPositions] = useState<Position[]>(profile?.positions?.length ? [profile.positions[0]] : ['CM'])
  const [minutes] = useState(durationRecommendation.totalMinutes)
  const [goals, setGoals] = useState(0)
  const [assists, setAssists] = useState(0)
  const [shots, setShots] = useState(0)
  const [keyPasses, setKeyPasses] = useState(0)
  const [tackles, setTackles] = useState(0)
  const [selfRating, setSelfRating] = useState(7)
  const [bestMoment, setBestMoment] = useState('')
  const [toImprove, setToImprove] = useState('')
  const [mood, setMood] = useState<EnergyLevel>(3)

  const teamName = playingFor || profile?.team || '???'

  // Player's teams for "playing for" selector
  const playerTeams = profile?.teams?.filter(team => team.active) ?? []

  function togglePosition(pos: Position) {
    setPositions((prev) =>
      prev.includes(pos)
        ? prev.length > 1 ? prev.filter((p) => p !== pos) : prev
        : [...prev, pos]
    )
  }

  function handleSave() {
    const entry: MatchEntry = {
      id: crypto.randomUUID(),
      playerId: 'default',
      playingFor: playingFor || undefined,
      date: today,
      opponent,
      competition,
      scoreUs,
      scoreThem,
      position: positions,
      minutesPlayed: minutes,
      goals, assists, shots, keyPasses, tackles,
      selfRating,
      bestMoment,
      toImprove,
      mood,
      createdAt: new Date().toISOString(),
    }
    addMatch(entry)

    // Growth XP: bad match + wrote improvement = bonus
    let totalXp = XP_AWARDS.logMatch
    if (selfRating <= 4 && toImprove.length > 0) {
      totalXp += XP_AWARDS.growthXp
    }
    setXp(awardXp(xp, totalXp, today))
    setSaved(true)
    onSaved?.()
    if (!inline) setTimeout(() => setSaved(false), 3000)
  }

  if (saved && !inline) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 pb-32 animate-fade-up">
        <span className="text-5xl animate-float">⚽</span>
        <p className="text-lg font-bold" style={{ color: 'var(--color-primary-dark)' }}>
          {t('match.saved', { xp: XP_AWARDS.logMatch })}
        </p>
      </div>
    )
  }

  if (saved && inline) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-primary-bg-subtle)' }}>
        <span className="text-xl">✅</span>
        <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>
          {t('match.saved', { xp: XP_AWARDS.logMatch })}
        </p>
      </div>
    )
  }

  return (
    <div className={inline ? 'flex flex-col gap-4' : 'flex flex-col gap-4 p-4 pb-32'}>
      {!inline && (
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
          )}
          <h2 className="text-lg font-bold">{t('match.title')}</h2>
        </div>
      )}

      {/* Playing for (team selector) */}
      {playerTeams.length > 1 && (
        <div>
          <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            {t('match.playingFor')}
          </label>
          <select
            value={playingFor}
            onChange={(e) => setPlayingFor(e.target.value)}
            className="w-full text-sm p-2 rounded-lg border mt-1"
          >
            {playerTeams.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name} {team.isPrimary ? '⭐' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Opponent (team search) */}
      <div>
        <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
          {t('match.opponent')}
        </label>
        <TeamPicker
          value={opponent}
          onChange={(name) => setOpponent(name)}
          country={profile?.country}
          placeholder={t('match.opponent')}
          className="w-full mt-1"
        />
      </div>

      {/* Competition */}
      <input
        className="w-full text-sm"
        placeholder={t('match.competition')}
        value={competition}
        onChange={(e) => setCompetition(e.target.value)}
      />

      {/* Score */}
      <div className="card">
        <p className="section-label mb-2">{t('match.score')}</p>
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teamName}</span>
            <div className="flex items-center gap-2">
              <button className="tap-target card px-3 py-1" onClick={() => setScoreUs(Math.max(0, scoreUs - 1))} aria-label="Decrease our score">−</button>
              <span className="text-2xl font-bold w-8 text-center">{scoreUs}</span>
              <button className="tap-target card px-3 py-1" onClick={() => setScoreUs(scoreUs + 1)} aria-label="Increase our score">+</button>
            </div>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-text-muted)' }}>:</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{opponent || '?'}</span>
            <div className="flex items-center gap-2">
              <button className="tap-target card px-3 py-1" onClick={() => setScoreThem(Math.max(0, scoreThem - 1))} aria-label="Decrease opponent score">−</button>
              <span className="text-2xl font-bold w-8 text-center">{scoreThem}</span>
              <button className="tap-target card px-3 py-1" onClick={() => setScoreThem(scoreThem + 1)} aria-label="Increase opponent score">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Position (multi-select) */}
      <div>
        <p className="section-label mb-2">{t('match.position')}</p>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.key}
              className="btn-choice tap-target text-xs px-3 py-2"
              onClick={() => togglePosition(p.key)}
              aria-pressed={positions.includes(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats — Tap counters */}
      <div className="card">
        <p className="section-label mb-3">{t('match.stats')}</p>
        {([
          { label: t('match.goals'), icon: '⚽', value: goals, set: setGoals },
          { label: t('match.assists'), icon: '🅰️', value: assists, set: setAssists },
          { label: t('match.shots'), icon: '👟', value: shots, set: setShots },
          { label: t('match.keyPasses'), icon: '🎯', value: keyPasses, set: setKeyPasses },
          { label: t('match.tackles'), icon: '🛡️', value: tackles, set: setTackles },
        ] as const).map((stat) => (
          <div key={stat.label} className="flex items-center justify-between py-2">
            <span className="text-sm">{stat.icon} {stat.label}</span>
            <div className="flex items-center gap-2">
              <button className="tap-target card px-3 py-1 text-sm" onClick={() => stat.set(Math.max(0, stat.value - 1))} aria-label={`Decrease ${stat.label}`}>−</button>
              <span className="text-lg font-bold w-6 text-center">{stat.value}</span>
              <button className="tap-target card px-3 py-1 text-sm" onClick={() => stat.set(stat.value + 1)} aria-label={`Increase ${stat.label}`}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Self rating */}
      <div className="card">
        <p className="section-label mb-2">{t('match.rating')}</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={10}
            value={selfRating}
            onChange={(e) => setSelfRating(Number(e.target.value))}
            className="flex-1"
            aria-label={t('match.rating')}
          />
          <span className="text-2xl font-black font-data w-8 text-center" style={{ color: selfRating >= 7 ? 'var(--color-primary)' : selfRating >= 4 ? 'var(--color-warn)' : 'var(--color-danger)' }}>
            {selfRating}
          </span>
        </div>
      </div>

      {/* Reflections */}
      <input
        className="w-full text-sm"
        placeholder={t('match.bestMoment')}
        value={bestMoment}
        onChange={(e) => setBestMoment(e.target.value)}
      />
      <input
        className="w-full text-sm"
        placeholder={t('match.toImprove')}
        value={toImprove}
        onChange={(e) => setToImprove(e.target.value)}
      />

      {/* Mood */}
      <div>
        <p className="section-label mb-2">{t('training.mood')}</p>
        <div className="flex gap-2 justify-center">
          {ENERGY_EMOJIS.map((emoji, i) => (
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

      {/* Save */}
      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        disabled={!opponent}
        aria-label={t('match.save')}
      >
        {t('match.save')} (+{XP_AWARDS.logMatch} XP)
      </button>
    </div>
  )
}
