import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { QuoteCard } from '../components/QuoteCard'
import { CoachCard } from '../components/CoachCard'
import { WeeklyGoalRing } from '../components/WeeklyGoalRing'
import { useCountUp } from '../hooks/useCountUp'
import { ConfettiBurst } from '../components/ConfettiBurst'
import { getMatchResult, getAgeTier } from '../engine/types'
import { getRank } from '../engine/xp'
import { exercises } from '../data/exercises'
import { MatchLog } from './MatchLog'
import { TrainingLog } from './TrainingLog'
import type { ScheduleEvent } from '../engine/types'
import { isPhysicalUpdateDue, daysSinceLastMeasurement } from '../engine/physical'
import { PhysicalUpdateFlow } from '../components/PhysicalUpdateFlow'
import { MorningRoutine } from '../components/MorningRoutine'
import { DailyQuiz } from '../components/DailyQuiz'
import { LevelUpCelebration } from '../components/LevelUpCelebration'

export function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const { matches, trainings, xp, profile, schedule, tournaments, physicalProfile, checkIns, quizAnswers, recurringTrainings } = useApp()
  const rank = getRank(xp.level)

  // Age tier for adaptive UI
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const isYoung = ageTier === 'u8' // U8-U10: simplified UI

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

  // Today's scheduled events (sorted by start time) — includes recurring trainings
  const todayEvents = useMemo(() => {
    const manualEvents = schedule
      .filter((ev: ScheduleEvent) => ev.date === today)

    // Expand recurring trainings that match today's day of week
    const todayDow = new Date(today).getDay()
    const recurringEvents: ScheduleEvent[] = (recurringTrainings ?? [])
      .filter((rt) => rt.active && rt.dayOfWeek === todayDow)
      .map((rt) => ({
        id: `recurring-${rt.id}`,
        familyId: '',
        playerId: 'default',
        type: 'training' as const,
        title: rt.name,
        date: today,
        startTime: rt.startTime,
        endTime: rt.endTime,
        location: rt.location,
        trainingType: rt.trainingType,
        createdBy: 'recurring',
        createdAt: rt.createdAt,
      }))

    return [...manualEvents, ...recurringEvents]
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  }, [schedule, recurringTrainings, today])

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

      {/* ── Physical update reminder (U12+ only — too advanced for Foundation age) ── */}
      {physicalUpdateDue && !isYoung && (
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
        <p className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          {greeting}{playerName ? `, ${playerName}` : ''} 👋
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {xp.streakDays > 0 && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              🔥 {t('dashboard.streakMessage', { days: xp.streakDays })}
            </p>
          )}
          {xp.checkInStreakDays > 0 && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              ✅ {t('checkin.streak', { days: xp.checkInStreakDays })}
            </p>
          )}
        </div>
      </div>

      {/* ── First-day welcome (shown when player has zero activity) ── */}
      {matches.length === 0 && trainings.length === 0 && checkIns.length === 0 && (
        <div className="card-glow animate-fade-up flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {t('dashboard.welcomeTitle')}
            </p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {t('dashboard.welcomeText')}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span>1️⃣</span>
              <span>{t('dashboard.welcomeStep1')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>2️⃣</span>
              <span>{t('dashboard.welcomeStep2')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>3️⃣</span>
              <span>{t('dashboard.welcomeStep3')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Morning Routine CTA ── */}
      {!routineComplete && (
        <button
          className="card-glow tap-target w-full flex items-center gap-3 py-4 animate-fade-up"
          onClick={() => setShowRoutine(true)}
        >
          <span className="text-2xl">☀️</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {t('routine.cta')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('routine.ctaSub')}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'var(--color-primary-dark)', color: '#fff' }}>
            {t('routine.go')}
          </span>
        </button>
      )}

      {/* ── Check-in streak badge (shown after routine is done) ── */}
      {routineComplete && todayCheckedIn && xp.checkInStreakDays > 0 && (
        <div className="card flex items-center gap-3 animate-fade-up">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>
              {t('checkin.done')}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('checkin.streak', { days: xp.checkInStreakDays })}
            </p>
          </div>
        </div>
      )}

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

      {/* ── Season stats ── */}
      {isYoung ? (
        /* U8-U10: Simple 2-column layout — just matches + goals, big and fun */
        <div className="grid grid-cols-2 gap-3 animate-fade-up animate-stagger-1">
          <div className="stat-card stat-card-green">
            <p className="stat-number text-gradient-green animate-number-pop" style={{ fontSize: '2.5rem' }}>
              {animMatches}
            </p>
            <p className="stat-label">{t('dashboard.matches')} ⚽</p>
          </div>
          <div className="stat-card stat-card-gold">
            <p className="stat-number text-gradient-gold animate-number-pop" style={{ fontSize: '2.5rem', animationDelay: '0.1s' }}>
              {animGoals}
            </p>
            <p className="stat-label">{t('dashboard.goals')} 🥅</p>
          </div>
        </div>
      ) : (
        /* U12+: Full 4-column stats with comparison arrows */
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
      )}

      {/* ── Weekly training goal ring ── */}
      <WeeklyGoalRing />

      {/* ── Today's Plan — Inline Logging Hub ── */}
      <div className="card animate-fade-up animate-stagger-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <p className="section-label">{t('dashboard.today')}</p>
          </div>
          {(todayMatches > 0 || todayTrainings > 0) && todayEvents.length === 0 && (
            <div className="flex items-center gap-2">
              {todayTrainings > 0 && (
                <span className="stat-pill stat-pill-green text-[10px]">⚽ {todayTrainings}</span>
              )}
              {todayMatches > 0 && (
                <span className="stat-pill stat-pill-cyan text-[10px]">🏟️ {todayMatches}</span>
              )}
              {todayGoals > 0 && (
                <span className="stat-pill stat-pill-gold text-[10px]">🥅 {todayGoals}</span>
              )}
            </div>
          )}
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
          todayMatches > 0 || todayTrainings > 0 ? (
            <div className="flex items-center gap-3 py-2">
              <span className="text-xl">✅</span>
              <p className="text-xs font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                {t('dashboard.todayDone')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <span className="text-xl">💤</span>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('dashboard.todayEmpty')}
              </p>
            </div>
          )
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

      {/* ── AI Coach ── */}
      <CoachCard />

      {/* ── Tournament Discovery — teammate shared tournaments ── */}
      {discoveredTournaments.length > 0 && (
        <div className="card animate-fade-up animate-stagger-2" style={{ border: '2px solid var(--color-primary-light, #22c55e)', background: 'rgba(34, 197, 94, 0.04)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏆</span>
            <p className="section-label">{t('dashboard.tournamentDiscovery')}</p>
          </div>
          {discoveredTournaments.slice(0, 2).map((st) => (
            <div key={st.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--color-glass-border, #e5e7eb)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{st.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {st.startDate} · {st.location} · {t('dashboard.teammates', { count: st.participantCount })}
                </p>
              </div>
              {onNavigate && (
                <button
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--color-primary-dark)', color: '#fff' }}
                  onClick={() => onNavigate('schedule')}
                >
                  {t('dashboard.joinTournament')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Drill of the day (only when morning routine not completed) ── */}
      {!routineComplete && (
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
      )}

      {/* ── Quiz of the Day (only when morning routine not completed) ── */}
      {!routineComplete && <DailyQuiz />}

      {/* ── Quote of the day (sign-off) ── */}
      <QuoteCard />

    </div>
  )
}
