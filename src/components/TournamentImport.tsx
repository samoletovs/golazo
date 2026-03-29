import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TeamPicker } from './TeamPicker'
import type { Tournament, ScheduleEvent } from '../engine/types'

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
}

const DEFAULT_DURATION_MIN = 30

export function TournamentImport({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { profile, addTournament, addScheduleEvent } = useApp()

  // Player's saved teams (from profile)
  const playerTeams = profile?.teams?.filter((t) => t.active) ?? []
  const hasTeams = playerTeams.length > 0

  const [url, setUrl] = useState('')
  // The name used to search in the tournament fixtures
  const [teamName, setTeamName] = useState(profile?.team || '')
  // Which of the player's teams this tournament is for
  const [selectedTeamId, setSelectedTeamId] = useState(playerTeams[0]?.id ?? '')
  const [durationMin, setDurationMin] = useState(DEFAULT_DURATION_MIN)
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
    const tournament: Tournament = {
      id: crypto.randomUUID(),
      playerId,
      name: result.tournament,
      startDate: dates[0] || new Date().toISOString().slice(0, 10),
      endDate: dates[dates.length - 1] || dates[0] || new Date().toISOString().slice(0, 10),
      location: result.games[0]?.venue || '',
      expectedGames: result.games.length,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    addTournament(tournament)

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

  // Success view
  if (imported && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-lg font-extrabold">{t('import.success')}</h3>
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
      <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '85dvh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">🏆 {t('import.title')}</h3>
          <button className="tap-target text-lg" onClick={onClose} aria-label={t('common.cancel')}>✕</button>
        </div>

        {!result ? (
          /* ── Step 1: URL + team input ── */
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {t('import.url')}
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://turniir.ee/..."
                className="w-full"
              />
              <p className="text-[0.65rem] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {t('import.urlHint')}
              </p>
            </div>

            {/* Which of your teams is playing */}
            {hasTeams && (
              <div>
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('import.playingFor')}
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full text-sm p-2 rounded-lg border"
                >
                  {playerTeams.map((pt) => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Team name in tournament */}
            <div>
              <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {t('import.tournamentTeamName')}
              </label>
              <TeamPicker
                value={teamName}
                onChange={(name) => setTeamName(name)}
                placeholder={t('import.teamNameHint')}
                className="w-full"
              />
              <p className="text-[0.65rem] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {t('import.tournamentTeamHint')}
              </p>
            </div>

            {/* Team picker from fetched teams */}
            {showTeamPicker && fetchedTeams.length > 0 && (
              <div>
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('import.teamsFound')}
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {fetchedTeams.map((team) => (
                    <button
                      key={team}
                      className="text-[0.7rem] px-2.5 py-1 rounded-full"
                      style={{
                        background: teamName === team ? 'rgba(var(--color-primary-rgb), 0.12)' : 'var(--color-glass-hover)',
                        color: teamName === team ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                        border: teamName === team ? '1px solid var(--color-primary-dark)' : '1px solid transparent',
                      }}
                      onClick={() => { setTeamName(team); setError('') }}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {t('import.duration')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={durationMin}
                  onChange={(e) => setDurationMin(Math.max(10, Math.min(180, Number(e.target.value) || 30)))}
                  className="w-20 text-center"
                  min={10}
                  max={180}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>min</span>
              </div>
            </div>

            {error && (
              <div className="text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button
              className="btn-primary w-full mt-2"
              onClick={handleFetch}
              disabled={loading || !url || !teamName}
            >
              {loading ? t('import.loading') : t('import.fetch')}
            </button>
          </div>
        ) : (
          /* ── Step 2: Preview + confirm ── */
          <div className="flex flex-col gap-3">
            <div className="card p-3">
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {result.tournament}
              </p>
              <p className="text-sm font-extrabold mt-1" style={{ color: 'var(--color-primary-dark)' }}>
                {t('import.foundGames', { count: result.matchedGames, total: result.totalGames })}
              </p>
            </div>

            {/* Registry match summary */}
            {result.registryMatches && (() => {
              const matched = Object.entries(result.registryMatches).filter(([, v]) => v !== null)
              const unmatched = Object.entries(result.registryMatches).filter(([, v]) => v === null)
              return (matched.length > 0 || unmatched.length > 0) ? (
                <div className="card p-3">
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('import.registryStatus')}
                  </p>
                  {matched.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {matched.map(([name, team]) => (
                        <span key={name} className="inline-flex items-center gap-1 text-[0.6rem] px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-darker)' }}>
                          {team?.logoUrl && <img src={team.logoUrl} alt="" className="w-3 h-3 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                          ✓ {team?.name ?? name}
                        </span>
                      ))}
                    </div>
                  )}
                  {unmatched.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {unmatched.map(([name]) => (
                        <span key={name} className="text-[0.6rem] px-2 py-0.5 rounded-full"
                          style={{ background: '#fef9c3', color: '#92400e' }}>
                          ? {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null
            })()}

            <div className="flex flex-col gap-1.5" style={{ maxHeight: '35dvh', overflowY: 'auto' }}>
              {result.games.map((game, i) => {
                const homeMatch = result.registryMatches?.[game.home]
                const awayMatch = result.registryMatches?.[game.away]
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg text-xs"
                    style={{ background: game.finished ? 'var(--color-glass-hover)' : 'var(--color-glass-active)' }}
                  >
                    <span className="font-data text-[0.65rem] shrink-0" style={{ color: 'var(--color-text-muted)', width: '70px' }}>
                      {game.date} {game.time}
                    </span>
                    <span className="flex-1 font-bold truncate">
                      {homeMatch?.logoUrl && <img src={homeMatch.logoUrl} alt="" className="inline-block w-4 h-4 rounded mr-1 align-text-bottom object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      {game.home}
                      <span style={{ color: 'var(--color-text-muted)' }}> vs </span>
                      {awayMatch?.logoUrl && <img src={awayMatch.logoUrl} alt="" className="inline-block w-4 h-4 rounded mr-1 align-text-bottom object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      {game.away}
                    </span>
                    {game.venue && (
                      <span className="text-[0.6rem] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        📍 {game.venue}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 mt-2">
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
