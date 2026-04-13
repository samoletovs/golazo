import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TeamSearch } from './TeamSearch'
import { getMatchDurationRecommendation } from '../engine/footballStandards'
import type { Tournament, ScheduleEvent, PlayerTeam } from '../engine/types'

interface ParsedGame {
  date: string  // DD.MM
  time: string  // HH:MM
  home: string
  away: string
  venue: string
  score: string
  finished: boolean
}

interface RegistryMatch {
  id: string
  name: string
  country: string
  logoUrl?: string
  verified: boolean
}

interface ImportResult {
  tournament: string
  totalGames: number
  matchedGames: number
  games: ParsedGame[]
  allTeams: string[]
  registryMatches?: Record<string, RegistryMatch | null>
  className?: string
  dateWarning?: string
}

export function TournamentImport({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { profile, addTournament, addScheduleEvent } = useApp()
  const durationRecommendation = getMatchDurationRecommendation(profile?.birthDate)

  // Player's saved teams (from profile)
  const playerTeams = (profile?.teams ?? []).filter((t: PlayerTeam) => t.active)
  const hasTeams = playerTeams.length > 0

  const [url, setUrl] = useState('')
  // The name used to search in the tournament fixtures
  const [teamName, setTeamName] = useState(profile?.teams?.find(t => t.isPrimary)?.name || profile?.teams?.[0]?.name || profile?.team || '')
  // Which of the player's teams this tournament is for
  const [selectedTeamId, setSelectedTeamId] = useState(playerTeams[0]?.id ?? '')
  const [durationMin, setDurationMin] = useState(durationRecommendation.totalMinutes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0.5: after loading teams from URL, let user pick from dropdown
  const [fetchedTeams, setFetchedTeams] = useState<string[]>([])
  const [showTeamPicker, setShowTeamPicker] = useState(false)

  // Preview state
  const [result, setResult] = useState<ImportResult | null>(null)
  const [imported, setImported] = useState(false)

  async function handleFetch() {
    if (!url || !teamName) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/tournament-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, teamName }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Show team picker if server returned team list
        if (data.allTeams?.length) {
          setFetchedTeams(data.allTeams)
          setShowTeamPicker(true)
          setError(data.error || t('import.fetchError'))
        } else {
          setError(data.error || t('import.fetchError'))
        }
        return
      }

      if (data.matchedGames === 0 && data.allTeams?.length) {
        setFetchedTeams(data.allTeams)
        setShowTeamPicker(true)
        setError(t('import.noGamesForTeam', { team: teamName }))
        return
      }

      setResult(data)
      setShowTeamPicker(false)
    } catch {
      setError(t('import.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  function handleImport() {
    if (!result || !result.games.length) return

    const currentYear = new Date().getFullYear()
    const playerId = profile?.id ?? 'local'
    const familyId = profile?.familyId ?? 'local'

    // Determine date range from parsed games
    const dates = result.games.map((g) => {
      const [day, month] = g.date.split('.')
      return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }).sort()

    // Create Tournament object
    const startDate = dates[0] || new Date().toISOString().slice(0, 10)
    const endDate = dates[dates.length - 1] || dates[0] || new Date().toISOString().slice(0, 10)
    const location = result.games[0]?.venue || ''

    const tournament: Tournament = {
      id: crypto.randomUUID(),
      playerId,
      name: result.tournament,
      startDate,
      endDate,
      location,
      expectedGames: result.games.length,
      completed: false,
      sourceUrl: url,
      className: result.className,
      rules: { matchDuration: durationMin },
      createdAt: new Date().toISOString(),
    }
    addTournament(tournament)

    // Best-effort: create/join shared tournament for teammates to discover
    createOrJoinSharedTournament(url, result.tournament, startDate, endDate, location, result.games)
      .catch(() => { /* shared creation is best-effort */ })

    // Create ScheduleEvent for each game
    for (const game of result.games) {
      const [day, month] = game.date.split('.')
      const dateStr = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

      // Calculate end time
      const [h, m] = game.time.split(':').map(Number)
      const startMin = h * 60 + m
      const endMin = startMin + durationMin
      const endH = Math.floor(endMin / 60) % 24
      const endM = endMin % 60
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

      // Determine opponent (the other team)
      const normFilter = teamName.toLowerCase()
      const isHome = game.home.toLowerCase().includes(normFilter) || normFilter.includes(game.home.toLowerCase())
      const opponent = isHome ? game.away : game.home

      const ev: ScheduleEvent = {
        id: crypto.randomUUID(),
        familyId,
        playerId,
        type: 'match',
        title: `${game.home} vs ${game.away}`,
        date: dateStr,
        startTime: game.time,
        endTime,
        location: game.venue || undefined,
        opponent,
        competition: result.tournament,
        tournamentId: tournament.id,
        createdBy: playerId,
        createdAt: new Date().toISOString(),
      }
      addScheduleEvent(ev)
    }

    setImported(true)
  }

  /** Best-effort: create a shared tournament or join existing one so teammates can discover it. */
  async function createOrJoinSharedTournament(
    sourceUrl: string, name: string, startDate: string, endDate: string,
    location: string, games: ParsedGame[],
  ) {
    try {
      const classKey = result?.className || 'default'
      const sharedGames: Record<string, unknown[]> = {}
      sharedGames[classKey] = games.map((g) => {
        const parts = g.score ? g.score.split(/\s*-\s*/) : []
        const hs = parts[0] ? parseInt(parts[0]) : undefined
        const as = parts[1] ? parseInt(parts[1]) : undefined
        return {
          date: g.date, time: g.time, home: g.home, away: g.away, venue: g.venue,
          homeScore: isNaN(hs as number) ? undefined : hs,
          awayScore: isNaN(as as number) ? undefined : as,
          stage: 'unknown', finished: g.finished,
        }
      })

      const res = await fetch('/api/shared-tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl, name, classes: [classKey], startDate, endDate, location,
          games: sharedGames, teamName, className: result?.className,
          rules: { matchDuration: durationMin },
        }),
      })

      if (res.status === 409) {
        const { id } = await res.json()
        await fetch(`/api/shared-tournaments/${id}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName, className: result?.className, playerId: profile?.id }),
        })
      }
    } catch { /* silent — shared is best-effort */ }
  }

  // Success view
  if (imported && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="app-shell w-full rounded-t-2xl p-5 pb-8 animate-fade-up" style={{ maxHeight: '80dvh', overflowY: 'auto', background: 'var(--color-bg, #fafafa)' }}>
          <div className="text-center py-8">
            <div className="text-5xl mb-3 animate-float">🏆</div>
            <h3 className="text-xl font-extrabold heading-display">{t('import.success')}</h3>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('import.addedGames', { count: result.games.length, tournament: result.tournament })}
            </p>
          </div>
          <button className="btn-primary w-full" onClick={onClose}>
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="app-shell w-full rounded-t-2xl p-5 pb-8 animate-fade-up" style={{ maxHeight: '85dvh', overflowY: 'auto', background: 'var(--color-bg, #fafafa)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg font-extrabold heading-display">{t('import.title')}</h3>
          </div>
          <button className="tap-target w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-glass-active)' }} onClick={onClose} aria-label={t('common.cancel')}>✕</button>
        </div>

        {!result ? (
          /* ── Step 1: URL + team input ── */
          <div className="flex flex-col gap-4">
            {/* URL field */}
            <div className="card p-4">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {t('import.url')}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://turniir.ee/..."
                className="w-full mt-1.5 text-sm p-2.5 rounded-lg"
                style={{ background: 'var(--color-bg-field, #f8fafc)', border: '1px solid var(--color-glass-border)' }}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                {t('import.urlHint')}
              </p>
            </div>

            {/* Team selection card */}
            <div className="card p-4">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {t('import.teamSetup')}
              </label>

              {/* Which of your teams is playing */}
              {hasTeams && (
                <div className="mt-3">
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('import.playingFor')}
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-lg mt-1"
                    style={{ background: 'var(--color-bg-field, #f8fafc)', border: '1px solid var(--color-glass-border)' }}
                  >
                    {playerTeams.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Team name in tournament */}
              <div className="mt-3">
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('import.tournamentTeamName')}
                </label>
                <TeamSearch
                  value={teamName}
                  onChange={(name) => setTeamName(name)}
                  placeholder={t('import.teamNameHint')}
                  className="w-full mt-1"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t('import.tournamentTeamHint')}
                </p>
              </div>

              {/* Team picker from fetched teams */}
              {showTeamPicker && fetchedTeams.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('import.teamsFound')}
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {fetchedTeams.map((team) => (
                      <button
                        key={team}
                        className="text-xs px-2.5 py-1.5 rounded-full font-bold transition-all"
                        style={{
                          background: teamName === team ? 'rgba(var(--color-primary-rgb), 0.12)' : 'var(--color-glass-hover)',
                          color: teamName === team ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                          border: teamName === team ? '1.5px solid var(--color-primary-dark)' : '1.5px solid transparent',
                        }}
                        onClick={() => { setTeamName(team); setError('') }}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Match duration */}
            <div className="card p-4">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                {t('import.duration')}
              </label>
              <div className="flex items-center gap-3 mt-2">
                {[40, 50, 60, 70, 80, 90].map((d) => (
                  <button
                    key={d}
                    className="btn-choice tap-target flex-1 text-center text-sm py-2"
                    aria-pressed={durationMin === d}
                    onClick={() => setDurationMin(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                {t('training.minutes', { min: durationMin })}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs p-3 rounded-xl whitespace-pre-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleFetch}
              disabled={loading || !url || !teamName}
            >
              {loading ? t('import.loading') : t('import.fetch')}
            </button>
          </div>
        ) : (
          /* ── Step 2: Preview + confirm ── */
          <div className="flex flex-col gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {result.tournament}
                  </p>
                  <p className="text-base font-extrabold heading-display" style={{ color: 'var(--color-primary-dark)' }}>
                    {t('import.foundGames', { count: result.matchedGames, total: result.totalGames })}
                  </p>
                </div>
              </div>
              {result.dateWarning && (
                <p className="text-xs mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--color-warning-bg, #FFF3CD)', color: 'var(--color-warning-text, #856404)' }}>
                  ⚠️ {result.dateWarning}
                </p>
              )}
            </div>

            {/* Registry match summary */}
            {result.registryMatches && (() => {
              const matched = Object.entries(result.registryMatches).filter(([, v]) => v !== null)
              const unmatched = Object.entries(result.registryMatches).filter(([, v]) => v === null)
              return (matched.length > 0 || unmatched.length > 0) ? (
                <div className="card p-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    {t('import.registryStatus')}
                  </p>
                  {matched.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {matched.map(([name, team]) => (
                        <span key={name} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-darker)' }}>
                          {team?.logoUrl && <img src={team.logoUrl} alt={team?.name ?? name} className="w-3 h-3 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                          ✓ {team?.name ?? name}
                        </span>
                      ))}
                    </div>
                  )}
                  {unmatched.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {unmatched.map(([name]) => (
                        <span key={name} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: '#fef9c3', color: '#92400e' }}>
                          ? {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null
            })()}

            <div className="card p-0 overflow-hidden" style={{ maxHeight: '35dvh', overflowY: 'auto' }}>
              {result.games.map((game, i) => {
                const homeMatch = result.registryMatches?.[game.home]
                const awayMatch = result.registryMatches?.[game.away]
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs"
                    style={{
                      background: game.finished ? 'var(--color-glass-hover)' : 'transparent',
                      borderBottom: i < result.games.length - 1 ? '1px solid var(--color-glass-border)' : undefined,
                    }}
                  >
                    <span className="font-data text-xs shrink-0 w-[70px]" style={{ color: 'var(--color-text-muted)' }}>
                      {game.date} {game.time}
                    </span>
                    <span className="flex-1 font-bold truncate">
                      {homeMatch?.logoUrl && <img src={homeMatch.logoUrl} alt={game.home} className="inline-block w-4 h-4 rounded mr-1 align-text-bottom object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      {game.home}
                      <span style={{ color: 'var(--color-text-muted)' }}> vs </span>
                      {awayMatch?.logoUrl && <img src={awayMatch.logoUrl} alt={game.away} className="inline-block w-4 h-4 rounded mr-1 align-text-bottom object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      {game.away}
                    </span>
                    {game.venue && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        📍
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 mt-1">
              <button
                className="flex-1 btn-secondary"
                onClick={() => { setResult(null); setError('') }}
              >
                {t('common.back')}
              </button>
              <button
                className="flex-1 btn-primary"
                onClick={handleImport}
              >
                {t('import.addToSchedule')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
