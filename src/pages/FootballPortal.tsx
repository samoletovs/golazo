import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TournamentImport } from '../components/TournamentImport'
import { TeamProfile } from '../components/TeamProfile'
import { getMatchResult } from '../engine/types'
import type { ScheduleEvent, TournamentSummary, MatchEntry, SharedTeam } from '../engine/types'

/* ── Calendar Strip ─────────────────────────────────────── */

function CalendarStrip({ selected, onSelect, eventDates }: {
  selected: string
  onSelect: (date: string) => void
  eventDates: Set<string>
}) {
  const days = useMemo(() => {
    const result: { date: string; day: number; weekday: string; isToday: boolean }[] = []
    const today = new Date()
    // Show 3 days before and 10 days after today
    for (let i = -3; i <= 10; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      result.push({
        date: iso,
        day: d.getDate(),
        weekday: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        isToday: i === 0,
      })
    }
    return result
  }, [])

  return (
    <div className="h-scroll gap-2 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
      {days.map((d) => {
        const isActive = d.date === selected
        const hasEvents = eventDates.has(d.date)
        return (
          <button
            key={d.date}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl tap-target flex-shrink-0"
            style={{
              scrollSnapAlign: 'center',
              background: isActive ? 'var(--color-primary-dark)' : d.isToday ? 'var(--color-primary-bg)' : 'var(--color-bg-field)',
              color: isActive ? '#fff' : 'var(--color-text)',
              minWidth: 48,
            }}
            onClick={() => onSelect(d.date)}
          >
            <span className="text-xs font-bold uppercase" style={{ opacity: 0.7 }}>{d.weekday}</span>
            <span className="text-base font-black font-data">{d.day}</span>
            {hasEvents && (
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? '#fff' : 'var(--color-primary)' }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── Tournament Standings Card ──────────────────────────── */

function TournamentStandingsCard({ summary }: { summary: TournamentSummary }) {
  const { t } = useTranslation()
  const { tournament: trn, wins, draws, losses, totalGoals, totalAssists, matches } = summary
  const played = wins + draws + losses

  return (
    <div className="card animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏆</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate heading-display">{trn.name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {trn.location}{trn.className ? ` · ${trn.className}` : ''}
          </p>
        </div>
        {!trn.completed && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
            {t('portal.active')}
          </span>
        )}
      </div>

      {/* W/D/L bar */}
      {played > 0 && (
        <div className="flex rounded-lg overflow-hidden h-2.5 mb-2">
          {wins > 0 && <div style={{ width: `${(wins / played) * 100}%`, background: 'var(--color-primary)' }} />}
          {draws > 0 && <div style={{ width: `${(draws / played) * 100}%`, background: '#fbbf24' }} />}
          {losses > 0 && <div style={{ width: `${(losses / played) * 100}%`, background: '#ef4444' }} />}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-4 text-center">
        <div className="flex-1">
          <p className="text-lg font-black font-data" style={{ color: 'var(--color-primary-dark)' }}>{wins}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('progress.win')}</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data" style={{ color: 'var(--color-amber-text)' }}>{draws}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('progress.draw')}</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data" style={{ color: 'var(--color-danger)' }}>{losses}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('progress.loss')}</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data">{totalGoals}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>⚽</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data">{totalAssists}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>🎯</p>
        </div>
      </div>

      {/* Match list (last 5) */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-1 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-field-input)' }}>
          {matches.slice(-5).reverse().map((m) => {
            const result = getMatchResult(m)
            return (
              <div key={m.id} className="flex items-center gap-2 py-1.5">
                <span className="w-5 text-center text-xs font-bold" style={{
                  color: result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? 'var(--color-danger)' : 'var(--color-amber-text)',
                }}>
                  {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'}
                </span>
                <span className="text-xs flex-1 truncate">{m.opponent}</span>
                <span className="text-xs font-bold font-data">{m.scoreUs}:{m.scoreThem}</span>
                {m.goals > 0 && <span className="text-xs">⚽{m.goals}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Recent Result Card ─────────────────────────────────── */

function RecentResultCard({ match }: { match: MatchEntry }) {
  const result = getMatchResult(match)
  const bg = result === 'win' ? 'var(--color-success-bg)' : result === 'loss' ? 'var(--color-error-bg)' : 'var(--color-amber-bg)'
  const color = result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? 'var(--color-danger)' : 'var(--color-amber-text)'
  return (
    <div className="flex-shrink-0 rounded-2xl p-3 flex flex-col gap-1" style={{ background: bg, width: 140 }}>
      <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
        {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </p>
      <p className="text-xs font-bold truncate heading-display">{match.opponent}</p>
      <p className="text-xl font-black font-data" style={{ color }}>{match.scoreUs}:{match.scoreThem}</p>
      <div className="flex gap-1">
        {match.goals > 0 && <span className="text-[10px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--color-primary-dark)' }}>⚽{match.goals}</span>}
        {match.assists > 0 && <span className="text-[10px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary-light)' }}>🎯{match.assists}</span>}
      </div>
    </div>
  )
}

/* ── Upcoming Event Row ─────────────────────────────────── */

function UpcomingEventRow({ event }: { event: ScheduleEvent }) {
  const isMatch = event.type === 'match' || event.type === 'tournament'
  const emoji = isMatch ? '🏟️' : event.type === 'training' ? '⚽' : '📋'
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{event.title}{event.opponent ? ` vs ${event.opponent}` : ''}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          {event.startTime ? ` · ${event.startTime}` : ''}
          {event.location ? ` · ${event.location}` : ''}
        </p>
      </div>
    </div>
  )
}

/* ── Clubs & Teams Browser ───────────────────────────────── */

/** Club node with resolved children: academies → squads grouped by birth year */
interface ClubNode {
  club: SharedTeam
  academies: {
    academy: SharedTeam
    /** Squads grouped by birth year, sorted newest first. Key = birthYear or 'other' */
    byYear: { year: string; squads: SharedTeam[] }[]
  }[]
  /** Direct squads (no academy intermediary) */
  directSquads: { year: string; squads: SharedTeam[] }[]
}

function buildClubTree(allTeams: SharedTeam[]): ClubNode[] {
  const clubs = allTeams.filter((t) => t.type === 'club' || (!t.type && !t.parentClubId))
  const academies = allTeams.filter((t) => t.type === 'academy')
  const squads = allTeams.filter((t) => t.type === 'squad')

  function groupByYear(items: SharedTeam[]): { year: string; squads: SharedTeam[] }[] {
    const map = new Map<string, SharedTeam[]>()
    for (const s of items) {
      const key = s.birthYear ? String(s.birthYear) : 'other'
      const arr = map.get(key) ?? []
      arr.push(s)
      map.set(key, arr)
    }
    // Sort years newest first, 'other' last
    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === 'other') return 1
        if (b === 'other') return -1
        return Number(b) - Number(a)
      })
      .map(([year, items]) => ({
        year,
        squads: items.sort((a, b) => (a.squadLabel ?? a.name).localeCompare(b.squadLabel ?? b.name)),
      }))
  }

  return clubs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((club) => {
      const clubAcademies = academies.filter((a) => a.parentClubId === club.id)
      const directSquadList = squads.filter((s) => s.parentClubId === club.id)

      return {
        club,
        academies: clubAcademies
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((academy) => ({
            academy,
            byYear: groupByYear(squads.filter((s) => s.parentClubId === academy.id)),
          })),
        directSquads: groupByYear(directSquadList),
      }
    })
    // Only show clubs that have some structure (academies or squads) or are standalone
    .filter((n) => n.academies.length > 0 || n.directSquads.length > 0 || true)
}

function ClubCard({ node, onViewTeam }: { node: ClubNode; onViewTeam: (t: SharedTeam) => void }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { club, academies, directSquads } = node
  const primaryColor = club.colors?.[0] ?? 'var(--color-primary)'
  const hasChildren = academies.length > 0 || directSquads.length > 0

  return (
    <div className="card overflow-hidden">
      {/* Club header */}
      <button
        className="w-full flex items-center gap-3 p-3 tap-target text-left"
        onClick={() => hasChildren ? setExpanded(!expanded) : onViewTeam(club)}
        aria-expanded={hasChildren ? expanded : undefined}
      >
        {club.logoUrl ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            <img src={club.logoUrl} alt="" className="w-7 h-7 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${primaryColor}15` }}>
            <span className="text-lg">🏟️</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{club.name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {[club.city, club.league].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {club.verified && (
            <span className="text-xs" style={{ color: 'var(--color-primary)' }}>✓</span>
          )}
          {hasChildren && (
            <span className="text-xs transition-transform" style={{
              color: 'var(--color-text-muted)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>›</span>
          )}
        </div>
      </button>

      {/* Expanded: show academies + squads */}
      {expanded && (
        <div className="px-3 pb-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
          {/* View club profile link */}
          <button
            className="w-full text-xs font-bold py-2 text-center"
            style={{ color: 'var(--color-primary-dark)' }}
            onClick={() => onViewTeam(club)}
          >
            {t('teams.viewClub')} →
          </button>

          {/* Academies with their squads */}
          {academies.map(({ academy, byYear }) => (
            <div key={academy.id} className="mt-2">
              <button
                className="flex items-center gap-2 w-full text-left py-1 tap-target"
                onClick={() => onViewTeam(academy)}
              >
                <span className="text-xs">🎓</span>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {academy.name}
                </span>
              </button>
              {byYear.map(({ year, squads }) => (
                <div key={year} className="ml-5 mt-1">
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {year === 'other' ? t('teams.squads') : year}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {squads.map((squad) => (
                      <button
                        key={squad.id}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg tap-target transition-all"
                        style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text)' }}
                        onClick={() => onViewTeam(squad)}
                      >
                        {squad.squadLabel ?? squad.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {byYear.length === 0 && (
                <p className="ml-5 text-xs py-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t('teams.noSquads')}
                </p>
              )}
            </div>
          ))}

          {/* Direct squads (no academy) */}
          {directSquads.length > 0 && (
            <div className="mt-2">
              {academies.length > 0 && (
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t('teams.squads')}
                </p>
              )}
              {directSquads.map(({ year, squads }) => (
                <div key={year} className="ml-2 mt-1">
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {year === 'other' ? '' : year}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {squads.map((squad) => (
                      <button
                        key={squad.id}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg tap-target transition-all"
                        style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text)' }}
                        onClick={() => onViewTeam(squad)}
                      >
                        {squad.squadLabel ? `${squad.birthYear ?? ''} ${squad.squadLabel}`.trim() : squad.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ClubsBrowser({ country }: { country?: string }) {
  const { t } = useTranslation()
  const [allTeams, setAllTeams] = useState<SharedTeam[]>([])
  const [loading, setLoading] = useState(false)
  const [viewTeam, setViewTeam] = useState<SharedTeam | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ limit: '500' })
        if (country) params.set('country', country)
        const res = await fetch(`/api/teams?${params}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setAllTeams(data.teams || [])
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [country])

  const clubTree = useMemo(() => buildClubTree(allTeams), [allTeams])

  return (
    <div>
      <p className="section-label mb-2">{t('portal.clubs')}</p>

      {loading ? (
        <div className="text-center py-4">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
        </div>
      ) : clubTree.length > 0 ? (
        <div className="flex flex-col gap-2">
          {clubTree.map((node) => (
            <ClubCard key={node.club.id} node={node} onViewTeam={setViewTeam} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('portal.noClubs', { age: '' })}
          </p>
        </div>
      )}

      {viewTeam && (
        <TeamProfile
          team={viewTeam}
          allTeams={allTeams}
          onClose={() => setViewTeam(null)}
          onNavigate={setViewTeam}
        />
      )}
    </div>
  )
}

/* ── Main Football Portal Page ──────────────────────────── */

export function FootballPortal() {
  const { t } = useTranslation()
  const { matches, tournaments, schedule, profile } = useApp()
  const [showImport, setShowImport] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)

  // Dates with events (for calendar dots)
  const eventDates = useMemo(() => {
    return new Set(schedule.map((ev: ScheduleEvent) => ev.date))
  }, [schedule])

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    return schedule
      .filter((ev: ScheduleEvent) => ev.date === selectedDate)
      .sort((a: ScheduleEvent, b: ScheduleEvent) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  }, [schedule, selectedDate])

  // Tournament summaries (active first, then completed)
  const tournamentSummaries = useMemo((): TournamentSummary[] => {
    return tournaments
      .map((trn) => {
        const trnMatches = matches.filter((m: MatchEntry) => m.tournamentId === trn.id)
        return {
          tournament: trn,
          matches: trnMatches,
          wins: trnMatches.filter((m: MatchEntry) => getMatchResult(m) === 'win').length,
          draws: trnMatches.filter((m: MatchEntry) => getMatchResult(m) === 'draw').length,
          losses: trnMatches.filter((m: MatchEntry) => getMatchResult(m) === 'loss').length,
          totalGoals: trnMatches.reduce((s: number, m: MatchEntry) => s + m.goals, 0),
          totalAssists: trnMatches.reduce((s: number, m: MatchEntry) => s + m.assists, 0),
          bestMatch: trnMatches.sort((a: MatchEntry, b: MatchEntry) => b.goals - a.goals)[0],
        }
      })
      .sort((a, b) => {
        // Active first, then by most recent
        if (!a.tournament.completed && b.tournament.completed) return -1
        if (a.tournament.completed && !b.tournament.completed) return 1
        return b.tournament.startDate.localeCompare(a.tournament.startDate)
      })
  }, [tournaments, matches])

  // Recent results (last 5 matches, any tournament)
  const recentResults = useMemo(() => {
    return [...matches].sort((a: MatchEntry, b: MatchEntry) => b.date.localeCompare(a.date)).slice(0, 5)
  }, [matches])

  // Upcoming events (next 5 future events)
  const upcoming = useMemo(() => {
    return schedule
      .filter((ev: ScheduleEvent) => ev.date >= today)
      .sort((a: ScheduleEvent, b: ScheduleEvent) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
      .slice(0, 5)
  }, [schedule, today])

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold heading-display">{t('portal.title')}</h2>
        <button
          className="text-xs font-bold px-3 py-1.5 rounded-lg tap-target"
          style={{ background: 'var(--color-gold-glow)', color: 'var(--color-gold-500)' }}
          onClick={() => setShowImport(true)}
        >
          🏆 {t('import.addTournament')}
        </button>
      </div>

      {/* Calendar Strip */}
      <CalendarStrip
        selected={selectedDate}
        onSelect={setSelectedDate}
        eventDates={eventDates}
      />

      {/* Selected date events */}
      {selectedDateEvents.length > 0 && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">
            {selectedDate === today ? t('dashboard.today') : new Date(selectedDate + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex flex-col">
            {selectedDateEvents.map((ev: ScheduleEvent) => (
              <UpcomingEventRow key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      )}
      {selectedDateEvents.length === 0 && (
        <div className="card animate-fade-up text-center py-6">
          <span className="text-3xl mb-2 block">📭</span>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('schedule.noEvents')}</p>
        </div>
      )}

      {/* Tournament Standings */}
      {tournamentSummaries.length > 0 && (
        <div>
          <p className="section-label mb-2">{t('portal.tournaments')}</p>
          <div className="flex flex-col gap-3">
            {tournamentSummaries.map((s) => (
              <TournamentStandingsCard key={s.tournament.id} summary={s} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div>
          <p className="section-label mb-2">{t('portal.recentResults')}</p>
          <div className="h-scroll gap-3">
            {recentResults.map((m: MatchEntry) => (
              <RecentResultCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">{t('portal.upcoming')}</p>
          <div className="flex flex-col divide-y" style={{ borderColor: '#f1f5f9' }}>
            {upcoming.map((ev: ScheduleEvent) => (
              <UpcomingEventRow key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      )}

      {/* Clubs & Teams Browser */}
      <ClubsBrowser country={profile?.country} />

      {/* Empty state if nothing */}
      {tournamentSummaries.length === 0 && recentResults.length === 0 && upcoming.length === 0 && (
        <div className="card text-center py-8 animate-fade-up">
          <span className="text-5xl mb-3 block">🏟️</span>
          <p className="text-sm font-bold mb-1">{t('portal.emptyTitle')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('portal.emptyText')}</p>
        </div>
      )}

      {showImport && <TournamentImport onClose={() => setShowImport(false)} />}
    </div>
  )
}
