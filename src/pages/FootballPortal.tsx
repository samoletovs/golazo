import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TournamentImport } from '../components/TournamentImport'
import { getMatchResult } from '../engine/types'
import type { ScheduleEvent, TournamentSummary, MatchEntry } from '../engine/types'

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
            <span className="text-[10px] font-bold uppercase" style={{ opacity: 0.7 }}>{d.weekday}</span>
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
          <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-display)' }}>{trn.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {trn.location}{trn.className ? ` · ${trn.className}` : ''}
          </p>
        </div>
        {!trn.completed && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
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
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t('progress.win')}</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data" style={{ color: '#d97706' }}>{draws}</p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t('progress.draw')}</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data" style={{ color: '#dc2626' }}>{losses}</p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t('progress.loss')}</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data">{totalGoals}</p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>⚽</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-black font-data">{totalAssists}</p>
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>🎯</p>
        </div>
      </div>

      {/* Match list (last 5) */}
      {matches.length > 0 && (
        <div className="flex flex-col gap-1 mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          {matches.slice(-5).reverse().map((m) => {
            const result = getMatchResult(m)
            return (
              <div key={m.id} className="flex items-center gap-2 py-1.5">
                <span className="w-5 text-center text-xs font-bold" style={{
                  color: result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? '#dc2626' : '#d97706',
                }}>
                  {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'}
                </span>
                <span className="text-xs flex-1 truncate">{m.opponent}</span>
                <span className="text-xs font-bold font-data">{m.scoreUs}:{m.scoreThem}</span>
                {m.goals > 0 && <span className="text-[10px]">⚽{m.goals}</span>}
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
  const bg = result === 'win' ? '#f0fdf4' : result === 'loss' ? '#fef2f2' : '#fffbeb'
  const color = result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? '#dc2626' : '#d97706'
  return (
    <div className="flex-shrink-0 rounded-2xl p-3 flex flex-col gap-1" style={{ background: bg, width: 140 }}>
      <p className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
        {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </p>
      <p className="text-xs font-bold truncate" style={{ fontFamily: 'var(--font-display)' }}>{match.opponent}</p>
      <p className="text-xl font-black font-data" style={{ color }}>{match.scoreUs}:{match.scoreThem}</p>
      <div className="flex gap-1">
        {match.goals > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--color-primary-dark)' }}>⚽{match.goals}</span>}
        {match.assists > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7' }}>🎯{match.assists}</span>}
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

/* ── Main Football Portal Page ──────────────────────────── */

export function FootballPortal() {
  const { t } = useTranslation()
  const { matches, tournaments, schedule } = useApp()
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
    <div className="flex flex-col gap-5 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{t('portal.title')}</h1>
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
          <p className="section-label mb-3">{t('portal.tournaments')}</p>
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
          <p className="section-label mb-3">{t('portal.recentResults')}</p>
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
