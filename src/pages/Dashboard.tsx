import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { QuoteCard } from '../components/QuoteCard'
import { SkillRadar } from '../components/SkillRadar'
import { CoachCard } from '../components/CoachCard'
import { WeeklyGoalRing } from '../components/WeeklyGoalRing'
import { useCountUp } from '../hooks/useCountUp'
import { ConfettiBurst } from '../components/ConfettiBurst'
import { getMatchResult } from '../engine/types'
import { getRank } from '../engine/xp'
import { exercises } from '../data/exercises'
import { MatchLog } from './MatchLog'
import { TrainingLog } from './TrainingLog'
import { DiaryPage } from './DiaryPage'
import type { ScheduleEvent } from '../engine/types'
import { isPhysicalUpdateDue, daysSinceLastMeasurement } from '../engine/physical'
import { PhysicalUpdateFlow } from '../components/PhysicalUpdateFlow'
import { MorningRoutine } from '../components/MorningRoutine'
import { DailyCheckIn } from '../components/DailyCheckIn'
import { DailyQuiz } from '../components/DailyQuiz'
import { LevelUpCelebration } from '../components/LevelUpCelebration'

export function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const { matches, trainings, xp, profile, schedule, tournaments, physicalProfile, checkIns, quizAnswers } = useApp()
  const rank = getRank(xp.level)

  // Level-up detection
  const [prevLevel, setPrevLevel] = useState(xp.level)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    if (xp.level > prevLevel) {
      setShowLevelUp(true)
    }
    setPrevLevel(xp.level)
  }, [xp.level, prevLevel])

  const seasonGoals = matches.reduce((s, m) => s + m.goals, 0)
  const seasonAssists = matches.reduce((s, m) => s + m.assists, 0)
  const wins = matches.filter((m) => getMatchResult(m) === 'win').length

  // Animated count-ups for stat cards
  const animMatches = useCountUp(matches.length, 500, 100)
  const animGoals = useCountUp(seasonGoals, 500, 200)
  const animAssists = useCountUp(seasonAssists, 500, 300)
  const animWins = useCountUp(wins, 500, 400)

  // Today's activity count
  const today = new Date().toISOString().slice(0, 10)
  const todayMatches = matches.filter(m => m.date.startsWith(today)).length
  const todayTrainings = trainings.filter(tr => tr.date.startsWith(today)).length
  const todayGoals = matches.filter(m => m.date.startsWith(today)).reduce((s, m) => s + m.goals, 0)

  // Today's scheduled events (sorted by start time)
  const todayEvents = useMemo(() => {
    return schedule
      .filter((ev: ScheduleEvent) => ev.date === today)
      .sort((a: ScheduleEvent, b: ScheduleEvent) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  }, [schedule, today])

  // "vs last week" comparisons
  const vsLastWeek = useMemo(() => {
    const now = new Date()
    const weekAgoStart = new Date(now)
    weekAgoStart.setDate(weekAgoStart.getDate() - 14)
    const weekAgoEnd = new Date(now)
    weekAgoEnd.setDate(weekAgoEnd.getDate() - 7)
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)

    const inRange = (d: string, start: Date, end: Date) => {
      const dt = new Date(d)
      return dt >= start && dt < end
    }

    const lastWeekMatches = matches.filter(m => inRange(m.date, weekAgoStart, weekAgoEnd))
    const thisWeekMatches = matches.filter(m => inRange(m.date, thisWeekStart, now))
    const lastWeekTrainings = trainings.filter(tr => inRange(tr.date, weekAgoStart, weekAgoEnd))
    const thisWeekTrainings = trainings.filter(tr => inRange(tr.date, thisWeekStart, now))
    const lastWeekGoals = lastWeekMatches.reduce((s, m) => s + m.goals, 0)
    const thisWeekGoals = thisWeekMatches.reduce((s, m) => s + m.goals, 0)

    return {
      matches: thisWeekMatches.length - lastWeekMatches.length,
      goals: thisWeekGoals - lastWeekGoals,
      trainings: thisWeekTrainings.length - lastWeekTrainings.length,
    }
  }, [matches, trainings])

  // Drill of the day — deterministic pick based on today's date
  const drillOfDay = useMemo(() => {
    const dayIndex = Math.floor(new Date(today).getTime() / 86400000) % exercises.length
    return exercises[dayIndex]
  }, [today])

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.greetingMorning')
    if (hour < 17) return t('dashboard.greetingAfternoon')
    return t('dashboard.greetingEvening')
  }, [t])

  const playerName = profile?.name?.split(' ')[0] ?? ''

  function ComparisonArrow({ diff }: { diff: number }) {
    if (diff === 0) return null
    const isUp = diff > 0
    return (
      <span className="text-xs font-data font-bold" style={{ color: isUp ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
        {isUp ? '↑' : '↓'}{Math.abs(diff)}
      </span>
    )
  }

  // Confetti on streak milestones (5, 10, 20, 30, 50, 100)
  const STREAK_MILESTONES = [5, 10, 20, 30, 50, 100]
  const isStreakMilestone = STREAK_MILESTONES.includes(xp.streakDays)

  // Inline logging state
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [addingType, setAddingType] = useState<'training' | 'match' | 'diary' | null>(null)
  const [loggedEventIds, setLoggedEventIds] = useState<Set<string>>(new Set())

  // Physical update reminder
  const [showPhysicalUpdate, setShowPhysicalUpdate] = useState(false)
  const [physicalDismissed, setPhysicalDismissed] = useState(false)
  const lastMeasuredAt = physicalProfile?.measurements[physicalProfile.latestIndex]?.measuredAt
  const physicalUpdateDue = isPhysicalUpdateDue(lastMeasuredAt) && !physicalDismissed
  const daysSinceMeasurement = daysSinceLastMeasurement(lastMeasuredAt)

  // Morning routine state
  const [showRoutine, setShowRoutine] = useState(false)
  const todayCheckedIn = checkIns.some((c) => c.date === today)
  const todayQuizzed = quizAnswers.some((q) => q.date === today)
  const routineComplete = todayCheckedIn && todayQuizzed

  // Tournament discovery — find shared tournaments for player's teams
  const [discoveredTournaments, setDiscoveredTournaments] = useState<Array<{
    id: string; name: string; startDate: string; endDate: string; location: string;
    participantCount: number; teams: string[]
  }>>([])

  useEffect(() => {
    const teams = profile?.teams?.filter((t) => t.active) ?? []
    if (teams.length === 0) return

    // Check for shared tournaments matching any of the player's team names
    const teamNames = teams.flatMap((t) => [t.name, ...t.aliases])
    const uniqueNames = [...new Set(teamNames)].slice(0, 3) // limit queries

    Promise.all(
      uniqueNames.map((name) =>
        fetch(`/api/shared-tournaments?team=${encodeURIComponent(name)}&status=live`)
          .then((r) => r.ok ? r.json() : { tournaments: [] })
          .catch(() => ({ tournaments: [] }))
      )
    ).then((results) => {
      const all = results.flatMap((r) => r.tournaments || [])
      // Dedupe by id, exclude already-imported tournaments
      const existingUrls = new Set(tournaments.map((t) => t.sourceUrl).filter(Boolean))
      const fresh = all.filter((t, i, arr) =>
        arr.findIndex((x) => x.id === t.id) === i && !existingUrls.has(t.sourceUrl)
      )
      setDiscoveredTournaments(fresh)
    })
  }, [profile?.teams, tournaments])

  return (
    <div className="flex flex-col gap-5 p-4 pb-32">
      <ConfettiBurst trigger={isStreakMilestone} />
      {/* ── Level Up Celebration ── */}
      {showLevelUp && (
        <LevelUpCelebration level={xp.level} onClose={() => setShowLevelUp(false)} />
      )}
      {/* ── Morning Routine Overlay ── */}
      {showRoutine && (
        <MorningRoutine onClose={() => setShowRoutine(false)} />
      )}

      {/* ── Physical Update Flow ── */}
      {showPhysicalUpdate && (
        <PhysicalUpdateFlow onClose={() => setShowPhysicalUpdate(false)} />
      )}

      {/* ── Physical update reminder ── */}
      {physicalUpdateDue && (
        <div className="card animate-fade-up flex items-center gap-3" style={{ background: 'var(--color-primary-light, #dcfce7)', border: '1px solid var(--color-primary, #22c55e)' }}>
          <span className="text-2xl">📏</span>
          <div className="flex-1">
            <p className="text-sm font-bold">{t('physical.reminderTitle')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {daysSinceMeasurement === Infinity
                ? t('physical.reminderNever')
                : t('physical.reminderDays', { days: daysSinceMeasurement })}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              className="btn-primary text-xs px-3 py-1.5"
              onClick={() => setShowPhysicalUpdate(true)}
            >
              {t('physical.update')}
            </button>
            <button
              className="text-[10px] tap-target"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => setPhysicalDismissed(true)}
            >
              {t('physical.later')}
            </button>
          </div>
        </div>
      )}

      {/* ── Welcome greeting ── */}
      <div className="animate-fade-up">
        <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {greeting}{playerName ? `, ${playerName}` : ''} 👋
        </p>
        {xp.streakDays > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.streakMessage', { days: xp.streakDays })}
          </p>
        )}
      </div>

      {/* ── Morning Routine CTA ── */}
      {!routineComplete && (
        <button
          className="card-glow tap-target w-full flex items-center gap-3 py-4 animate-fade-up"
          onClick={() => setShowRoutine(true)}
        >
          <span className="text-2xl">☀️</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {t('routine.cta', { defaultValue: 'Start morning routine' })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('routine.ctaSub', { defaultValue: 'Check-in · Challenge · Quiz — 2 min' })}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'var(--color-primary-dark)', color: '#fff' }}>
            {t('routine.go', { defaultValue: 'Go' })}
          </span>
        </button>
      )}

      {/* ── Standalone Check-in (if routine not used but not checked in) ── */}
      {routineComplete && <DailyCheckIn />}

      {/* ── Hero: Big level + XP showcase — gradient bg ── */}
      <div className="card-hero animate-fade-up relative overflow-hidden text-center py-8 px-6">
        {/* Decorative floating icons */}
        <div className="absolute top-3 right-4 text-4xl opacity-20 animate-float">⚽</div>
        <div className="absolute bottom-3 left-4 text-3xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🏆</div>

        {/* Level + Rank */}
        <p className="section-label mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{t(rank.key)}</p>
        <p className="text-6xl font-black font-data animate-number-pop" style={{ color: '#fff' }}>
          {xp.level}
        </p>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('dashboard.level', { level: xp.level })}
        </p>

        {/* XP progress */}
        <div className="mt-4 mx-auto max-w-[240px]">
          <div className="xp-bar-track" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="xp-bar-fill" style={{
              width: `${xp.nextLevelXp > 0 ? Math.min((xp.currentLevelXp / xp.nextLevelXp) * 100, 100) : 100}%`,
              background: 'linear-gradient(90deg, #fbbf24, #fff)',
            }} />
          </div>
          <p className="text-xs font-data mt-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {xp.currentLevelXp} / {xp.nextLevelXp} XP
          </p>
        </div>

        {/* Total XP badge */}
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-3"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          ⭐ {xp.totalXp.toLocaleString()} XP
        </div>
      </div>

      {/* ── Season stats with vs-last-week arrows ── */}
      <div className="grid grid-cols-4 gap-3 animate-fade-up animate-stagger-1">
        <div className="stat-card stat-card-green">
          <p className="stat-number text-gradient-green animate-number-pop">
            {animMatches}
          </p>
          <p className="stat-label">{t('dashboard.matches')}</p>
          <ComparisonArrow diff={vsLastWeek.matches} />
        </div>
        <div className="stat-card stat-card-gold">
          <p className="stat-number text-gradient-gold animate-number-pop" style={{ animationDelay: '0.1s' }}>
            {animGoals}
          </p>
          <p className="stat-label">{t('dashboard.goals')}</p>
          <ComparisonArrow diff={vsLastWeek.goals} />
        </div>
        <div className="stat-card stat-card-cyan">
          <p className="stat-number text-gradient-green animate-number-pop" style={{ animationDelay: '0.2s' }}>
            {animAssists}
          </p>
          <p className="stat-label">{t('dashboard.assists')}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="stat-number text-gradient-green animate-number-pop" style={{ animationDelay: '0.3s' }}>
            {animWins}
          </p>
          <p className="stat-label">{t('dashboard.wins')}</p>
        </div>
      </div>

      {/* ── Weekly training goal ring ── */}
      <WeeklyGoalRing />

      {/* ── Today's Plan — Inline Logging Hub ── */}
      <div className="card animate-fade-up animate-stagger-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📅</span>
          <p className="section-label">{t('dashboard.today')}</p>
        </div>

        {/* Scheduled events */}
        {todayEvents.length > 0 ? (
          <div className="flex flex-col gap-2">
            {todayEvents.map((ev: ScheduleEvent) => {
              const isMatch = ev.type === 'match' || ev.type === 'tournament'
              const emoji = isMatch ? '🏟️' : ev.type === 'training' ? '⚽' : '📋'
              const isLogged = loggedEventIds.has(ev.id) || (isMatch
                ? matches.some(m => m.date.startsWith(today) && m.opponent === ev.opponent)
                : trainings.some(tr => tr.date.startsWith(today)))
              const isExpanded = expandedEventId === ev.id

              return (
                <div key={ev.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-field)' }}>
                  {/* Event header — tap to expand */}
                  <button
                    className="flex items-center gap-3 p-3 w-full text-left tap-target"
                    style={{ opacity: isLogged ? 0.7 : 1 }}
                    onClick={() => {
                      if (isLogged) return
                      setExpandedEventId(isExpanded ? null : ev.id)
                      setAddingType(null)
                    }}
                  >
                    <span className="text-xl">{isLogged ? '✅' : emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{ev.title}{ev.opponent ? ` vs ${ev.opponent}` : ''}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {ev.startTime}{ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    </div>
                    {!isLogged && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                        background: isExpanded ? 'var(--color-primary-dark)' : 'rgba(var(--color-primary-rgb), 0.12)',
                        color: isExpanded ? '#fff' : 'var(--color-primary-dark)',
                      }}>
                        {isExpanded ? '▼' : t('dashboard.todayAction')}
                      </span>
                    )}
                  </button>

                  {/* Expanded inline form */}
                  {isExpanded && !isLogged && (
                    <div className="px-3 pb-4 pt-1" style={{ borderTop: '1px solid #e5e7eb' }}>
                      {isMatch ? (
                        <MatchLog
                          inline
                          prefill={{ opponent: ev.opponent, competition: ev.competition }}
                          onSaved={() => {
                            setLoggedEventIds(prev => new Set([...prev, ev.id]))
                            setExpandedEventId(null)
                          }}
                        />
                      ) : (
                        <TrainingLog
                          inline
                          onSaved={() => {
                            setLoggedEventIds(prev => new Set([...prev, ev.id]))
                            setExpandedEventId(null)
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {todayMatches > 0 || todayTrainings > 0
              ? t('dashboard.todaySummary', { matches: todayMatches, trainings: todayTrainings, goals: todayGoals })
              : t('dashboard.todayEmpty')
            }
          </p>
        )}

        {/* Add unplanned activity */}
        {addingType ? (
          <div className="mt-3 rounded-2xl p-3" style={{ background: 'var(--color-bg-field)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">
                {addingType === 'match' ? '🏟️' : addingType === 'training' ? '⚽' : '📝'}{' '}
                {t(`log.${addingType}`)}
              </p>
              <button
                className="text-xs font-bold px-2 py-1 rounded-full tap-target"
                style={{ background: 'rgba(0,0,0,0.05)' }}
                onClick={() => setAddingType(null)}
              >
                ✕
              </button>
            </div>
            {addingType === 'match' && (
              <MatchLog inline onSaved={() => setAddingType(null)} />
            )}
            {addingType === 'training' && (
              <TrainingLog inline onSaved={() => setAddingType(null)} />
            )}
            {addingType === 'diary' && (
              <DiaryPage inline onSaved={() => setAddingType(null)} />
            )}
          </div>
        ) : (
          <div className="flex gap-2 mt-3">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tap-target"
              style={{ background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary-dark)' }}
              onClick={() => { setAddingType('training'); setExpandedEventId(null) }}
            >
              ⚽ {t('log.training')}
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tap-target"
              style={{ background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary-dark)' }}
              onClick={() => { setAddingType('match'); setExpandedEventId(null) }}
            >
              🏟️ {t('log.match')}
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold tap-target"
              style={{ background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary-dark)' }}
              onClick={() => { setAddingType('diary'); setExpandedEventId(null) }}
            >
              📝 {t('log.diary')}
            </button>
          </div>
        )}
      </div>

      {/* ── Quick Actions — access pages removed from nav ── */}
      {onNavigate && (
        <div className="grid grid-cols-3 gap-3 animate-fade-up">
          <button
            className="card tap-target flex flex-col items-center gap-1.5 py-3"
            onClick={() => onNavigate('schedule')}
          >
            <span className="text-xl">📅</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('nav.schedule')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-1.5 py-3"
            onClick={() => onNavigate('challenges')}
          >
            <span className="text-xl">🏆</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('nav.challenges')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-1.5 py-3"
            onClick={() => onNavigate('portal')}
          >
            <span className="text-xl">🏟️</span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('nav.portal')}</span>
          </button>
        </div>
      )}

      {/* ── Tournament Discovery — teammate shared tournaments ── */}
      {discoveredTournaments.length > 0 && (
        <div className="card animate-fade-up animate-stagger-2" style={{ border: '2px solid var(--color-primary-light, #22c55e)', background: 'rgba(34, 197, 94, 0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏆</span>
            <p className="section-label">{t('dashboard.tournamentDiscovery', { defaultValue: 'Your team is playing!' })}</p>
          </div>
          {discoveredTournaments.slice(0, 2).map((st) => (
            <div key={st.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--color-glass-border, #e5e7eb)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{st.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {st.startDate} · {st.location} · {t('dashboard.teammates', { count: st.participantCount, defaultValue: `${st.participantCount} players joined` })}
                </p>
              </div>
              {onNavigate && (
                <button
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--color-primary-dark)', color: '#fff' }}
                  onClick={() => onNavigate('schedule')}
                >
                  {t('dashboard.joinTournament', { defaultValue: 'Join' })}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Drill of the day ── */}
      <div className="card-glow animate-fade-up animate-stagger-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎯</span>
          <p className="section-label">{t('dashboard.drillOfDay')}</p>
        </div>
        <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {t(drillOfDay.nameKey)}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {t(drillOfDay.descriptionKey)}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-data" style={{ background: '#f3f4f6', color: '#6b7280' }}>
            {drillOfDay.durationMinutes} min
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
            {'⭐'.repeat(drillOfDay.difficulty)}
          </span>
          {onNavigate && (
            <button
              className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(var(--color-primary-rgb), 0.12)', color: 'var(--color-primary-dark)' }}
              onClick={() => onNavigate('exercises')}
            >
              {t('exercises.all')} →
            </button>
          )}
        </div>
      </div>

      {/* ── Quiz of the Day ── */}
      <DailyQuiz />

      {/* ── Training counter (vs last week) ── */}
      <div className="card animate-fade-up animate-stagger-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('dashboard.season')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('log.training')}
              {vsLastWeek.trainings !== 0 && (
                <span className="ml-1 font-data font-bold" style={{ color: vsLastWeek.trainings > 0 ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
                  {vsLastWeek.trainings > 0 ? '↑' : '↓'}{Math.abs(vsLastWeek.trainings)} {t('dashboard.vsLastWeek')}
                </span>
              )}
            </p>
          </div>
        </div>
        <span className="stat-pill stat-pill-green text-base font-black">
          {trainings.length}
        </span>
      </div>

      {/* ── Quote of the day ── */}
      <QuoteCard />

      {/* ── AI Coach ── */}
      <CoachCard />

      {/* ── Skill radar ── */}
      <SkillRadar />

      {/* ── Recent matches (horizontal scroll) ── */}
      {matches.length > 0 && (
        <div className="animate-fade-up animate-stagger-4">
          <div className="flex items-center justify-between mb-2 px-0">
            <p className="section-label">{t('dashboard.matches')}</p>
            {onNavigate && (
              <button
                className="text-xs font-bold"
                style={{ color: 'var(--color-primary-dark)' }}
                onClick={() => onNavigate('progress')}
              >
                {t('exercises.all')} →
              </button>
            )}
          </div>
          <div className="h-scroll">
            {matches.slice(-8).reverse().map((m) => {
              const result = getMatchResult(m)
              return (
                <div key={m.id} className="match-card-h" data-result={result}>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {m.opponent}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="stat-number" style={{
                      fontSize: '1.5rem',
                      color: result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? '#dc2626' : '#d97706'
                    }}>
                      {m.scoreUs} : {m.scoreThem}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {m.goals > 0 && <span className="stat-pill stat-pill-green text-[10px]">⚽ {m.goals}</span>}
                    {m.assists > 0 && <span className="stat-pill stat-pill-cyan text-[10px]">🎯 {m.assists}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
