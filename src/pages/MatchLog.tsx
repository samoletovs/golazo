import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { XP_AWARDS, scaleXp } from '../engine/xp'
import { useToast } from '../contexts/ToastContext'
import { AcademyPage } from '../components/academy/AcademyPage'
import { AcademySaved } from '../components/academy/AcademySaved'
import type { ActivityReceipt } from '../engine/activitySave'
import { TeamSearch } from '../components/TeamSearch'
import { getMatchDurationRecommendation } from '../engine/footballStandards'
import { getAgeTier } from '../engine/types'
import type { Position, EnergyLevel, MatchEntry, PlayerTeam } from '../engine/types'

const POSITIONS: Position[] = ['CM', 'LW', 'RW', 'LM', 'RM', 'CAM', 'CDM', 'LB', 'RB', 'ST', 'CB', 'GK']

const ENERGY_EMOJIS = ['😴', '😐', '🙂', '😄', '🔥']

export interface MatchLogProps {
  onBack?: () => void
  inline?: boolean
  prefill?: { date?: string; opponent?: string; competition?: string; tournamentId?: string; matchType?: string; playingFor?: string; fromSchedule?: string }
  onSaved?: () => void
}

export function MatchLog({ onBack, inline, prefill, onSaved }: MatchLogProps) {
  const { t } = useTranslation()
  const { saveMatch, profile } = useApp()
  const { showToast, dismissToast } = useToast()
  const durationRecommendation = getMatchDurationRecommendation(profile?.birthDate)
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined
  const scaledMatchXp = scaleXp(XP_AWARDS.logMatch, ageTier)
  const [receipt, setReceipt] = useState<ActivityReceipt | null>(null)
  const [failed, setFailed] = useState(false)
  const [draftId] = useState(() => crypto.randomUUID())
  const [createdAt] = useState(() => new Date().toISOString())
  const saving = useRef(false)
  const errorToast = useRef<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(prefill?.date ?? today)
  const [opponent, setOpponent] = useState(prefill?.opponent ?? '')
  const [competition, setCompetition] = useState(prefill?.competition ?? '')
  const [playingFor, setPlayingFor] = useState(prefill?.playingFor ?? (profile?.teams?.find(t => t.isPrimary)?.name || profile?.teams?.[0]?.name || profile?.team || ''))
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

  const teamName = playingFor || profile?.teams?.find(t => t.isPrimary)?.name || profile?.teams?.[0]?.name || profile?.team || '???'

  // Player's teams for "playing for" selector
  const playerTeams = (profile?.teams ?? []).filter((team: PlayerTeam) => team.active)

  function togglePosition(pos: Position) {
    setPositions((prev) =>
      prev.includes(pos)
        ? prev.length > 1 ? prev.filter((p) => p !== pos) : prev
        : [...prev, pos]
    )
  }

  function handleSave() {
    if (saving.current || receipt) return
    if (!opponent.trim() || !date || date > today) {
      showToast(t('academy.matchRequired'), 'error')
      return
    }
    saving.current = true
    const entry: MatchEntry = {
      id: draftId,
      playerId: profile?.id ?? 'default',
      tournamentId: prefill?.tournamentId,
      playingFor: playingFor || undefined,
      date,
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
      createdAt,
    }
    try {
      const saved = saveMatch(entry)
      setFailed(false)
      if (errorToast.current !== null) dismissToast(errorToast.current)
      setReceipt(saved)
    } catch (cause) {
      console.error('Match could not be saved on this device:', cause)
      setFailed(true)
      if (errorToast.current !== null) dismissToast(errorToast.current)
      errorToast.current = showToast(t('academy.saveError'), 'error')
      saving.current = false
      return
    }
    onSaved?.()
  }

  if (receipt) return <AcademySaved receipt={receipt} title={t('match.title')} onDone={onBack} />

  return (
    <AcademyPage surface="match-log" title={t('match.title')} onBack={!inline ? onBack : undefined} backLabel={t('common.back')} className="academy-entry-form">
      {failed && <p className="academy-error" role="alert">{t('academy.saveError')}</p>}

      {/* Date */}
      <div>
        <p className="section-label mb-2">{t('log.date')}</p>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full text-sm p-2.5 rounded-lg border"
          style={{ background: 'var(--color-bg-field, #f8fafc)' }}
        />
      </div>

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
        <TeamSearch
          value={opponent}
          onChange={(name) => setOpponent(name)}
          country={profile?.country}
          placeholder={t('match.opponent')}
          className="w-full mt-1"
        />
      </div>

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

      {/* Mood — always visible (primary metric) */}
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

      {/* Details toggle */}
      <button
        className="text-xs font-bold tap-target flex items-center gap-1 justify-center"
        style={{ color: 'var(--color-primary-dark)' }}
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? t('common.lessDetails') : t('common.moreDetails')}
      </button>

      {showDetails && (
        <>
          {/* Competition */}
          <input
            className="w-full text-sm"
            placeholder={t('match.competition')}
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
          />

          {/* Position (multi-select) */}
          <div>
            <p className="section-label mb-2">{t('match.position')}</p>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  className="btn-choice tap-target text-xs px-3 py-2"
                  onClick={() => togglePosition(pos)}
                  aria-pressed={positions.includes(pos)}
                >
                  {t(`position.${pos}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats — Tap counters */}
          <div className="card">
            <p className="section-label mb-2">{t('match.stats')}</p>
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
        </>
      )}

      {/* Save */}
      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        disabled={!opponent}
        aria-label={t('match.save')}
      >
        {t(failed ? 'training.retry' : 'match.save')} (+{scaledMatchXp} XP)
      </button>
      <p className="academy-hint">{t('training.localHint')}</p>
    </AcademyPage>
  )
}
