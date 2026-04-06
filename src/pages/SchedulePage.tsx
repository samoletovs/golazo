import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TournamentImport } from '../components/TournamentImport'
import { TeamSearch } from '../components/TeamSearch'
import { addMinutesToTime, getMatchDurationRecommendation } from '../engine/footballStandards'
import type { ScheduleType, ScheduleEvent, RecurringTraining, TrainingType, MatchType } from '../engine/types'

const EVENT_TYPES: { key: ScheduleType; emoji: string; labelKey: string; color: string }[] = [
  { key: 'training', emoji: '⚽', labelKey: 'mentor.schedule.training', color: 'var(--color-primary-dark)' },
  { key: 'match', emoji: '🏟️', labelKey: 'mentor.schedule.match', color: 'var(--color-cat-physical)' },
  { key: 'tournament', emoji: '🏆', labelKey: 'mentor.schedule.tournament', color: 'var(--color-gold-500)' },
  { key: 'event', emoji: '📅', labelKey: 'mentor.schedule.event', color: 'var(--color-text-secondary)' },
]

const MATCH_TYPES: { key: MatchType; emoji: string; labelKey: string }[] = [
  { key: 'friendly', emoji: '🤝', labelKey: 'schedule.matchFriendly' },
  { key: 'league', emoji: '🏅', labelKey: 'schedule.matchLeague' },
  { key: 'cup', emoji: '🏆', labelKey: 'schedule.matchCup' },
  { key: 'tournament', emoji: '⚡', labelKey: 'schedule.matchTournament' },
  { key: 'playoff', emoji: '🔥', labelKey: 'schedule.matchPlayoff' },
  { key: 'futsal', emoji: '🔲', labelKey: 'schedule.matchFutsal' },
]

const TRAINING_TYPES_UI: { key: TrainingType; emoji: string; labelKey: string }[] = [
  { key: 'team', emoji: '⚽', labelKey: 'training.type.team' },
  { key: 'individual', emoji: '🏃', labelKey: 'training.type.individual' },
  { key: 'technical', emoji: '🎯', labelKey: 'training.type.technical' },
  { key: 'tactical', emoji: '🧩', labelKey: 'training.type.tactical' },
  { key: 'physical', emoji: '💨', labelKey: 'training.type.physical' },
  { key: 'gym', emoji: '💪', labelKey: 'training.type.gym' },
  { key: 'recovery', emoji: '🧘', labelKey: 'training.type.recovery' },
  { key: 'futsal', emoji: '🔲', labelKey: 'training.type.futsal' },
]

const WEEKDAYS_KEYS = [
  'schedule.mon', 'schedule.tue', 'schedule.wed', 'schedule.thu',
  'schedule.fri', 'schedule.sat', 'schedule.sun',
]

const WEEKDAY_NAMES = ['schedule.sun', 'schedule.mon', 'schedule.tue', 'schedule.wed', 'schedule.thu', 'schedule.fri', 'schedule.sat']

// Hours 6–23, minutes 00/15/30/45
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6..23
const MINUTES = ['00', '15', '30', '45']

function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [h, m] = value.split(':')
  const hour = parseInt(h) || 18
  const minute = m || '00'
  const nearestMin = MINUTES.reduce((prev, curr) =>
    Math.abs(parseInt(curr) - parseInt(minute)) < Math.abs(parseInt(prev) - parseInt(minute)) ? curr : prev
  )

  return (
    <div>
      {label && <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>}
      <div className="flex gap-1 mt-1">
        <select
          value={hour}
          onChange={(e) => onChange(`${String(e.target.value).padStart(2, '0')}:${nearestMin}`)}
          className="flex-1 text-sm p-2 rounded-lg border text-center"
        >
          {HOURS.map((hr) => (
            <option key={hr} value={hr}>{String(hr).padStart(2, '0')}</option>
          ))}
        </select>
        <span className="flex items-center text-lg font-bold" style={{ color: 'var(--color-text-muted)' }}>:</span>
        <select
          value={nearestMin}
          onChange={(e) => onChange(`${String(hour).padStart(2, '0')}:${e.target.value}`)}
          className="flex-1 text-sm p-2 rounded-lg border text-center"
        >
          {MINUTES.map((min) => (
            <option key={min} value={min}>{min}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Get Monday of the week containing `date` */
function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = 1
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Get 7 date strings (Mon–Sun) for a week starting at `monday` */
function getWeekDates(monday: Date): string[] {
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(dateKey(d.getFullYear(), d.getMonth(), d.getDate()))
  }
  return dates
}

export function SchedulePage() {
  const { t } = useTranslation()
  const { schedule, addScheduleEvent, removeScheduleEvent, recurringTrainings, setRecurringTrainings, profile } = useApp()
  const matchDurationRecommendation = getMatchDurationRecommendation(profile?.birthDate)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<ScheduleType>('training')
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('18:00')
  const [formEndTime, setFormEndTime] = useState(addMinutesToTime('18:00', matchDurationRecommendation.totalMinutes))
  const [formLocation, setFormLocation] = useState('')
  const [formOpponent, setFormOpponent] = useState('')
  const [formMatchType, setFormMatchType] = useState<MatchType>('friendly')
  const [formCompetition, setFormCompetition] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showWeeklySetup, setShowWeeklySetup] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week')
  const [formNotes, setFormNotes] = useState('')
  const [formTrainingType, setFormTrainingType] = useState<TrainingType>('team')
  const [selectDateHint, setSelectDateHint] = useState(false)
  const [rtName, setRtName] = useState('')
  const [rtType, setRtType] = useState<TrainingType>('team')
  const [rtDay, setRtDay] = useState(1) // Monday
  const [rtStart, setRtStart] = useState('19:00')
  const [rtEnd, setRtEnd] = useState('21:00')
  const [rtLocation, setRtLocation] = useState('')

  const days = getMonthDays(viewYear, viewMonth)
  const todayStr = dateKey(today.getFullYear(), today.getMonth(), today.getDate())

  // Expand recurring trainings into virtual events for the visible month
  const recurringEvents = useMemo(() => {
    const events: ScheduleEvent[] = []
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      const dow = date.getDay()
      for (const rt of recurringTrainings) {
        if (rt.active && rt.dayOfWeek === dow) {
          const dk = dateKey(viewYear, viewMonth, d)
          events.push({
            id: `rt-${rt.id}-${dk}`,
            familyId: profile?.familyId ?? 'local',
            playerId: profile?.id ?? 'local',
            type: 'training',
            title: rt.name || t(`training.type.${rt.trainingType}`),
            date: dk,
            startTime: rt.startTime,
            endTime: rt.endTime,
            location: rt.location,
            createdBy: 'recurring',
            createdAt: rt.createdAt,
          })
        }
      }
    }
    return events
  }, [recurringTrainings, viewYear, viewMonth, profile, t])

  // Combine real schedule + recurring + shared team games
  const [sharedGames, setSharedGames] = useState<ScheduleEvent[]>([])

  // Fetch shared games for the player's teams
  useEffect(() => {
    const teams = profile?.teams?.filter((t) => t.active) ?? []
    if (teams.length === 0) return

    const from = dateKey(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate()
    const to = dateKey(viewYear, viewMonth, lastDay)

    let cancelled = false

    async function fetchShared() {
      const allGames: ScheduleEvent[] = []
      for (const team of teams) {
        try {
          const res = await fetch(`/api/shared-games?team=${encodeURIComponent(team.name)}&from=${from}&to=${to}`)
          if (!res.ok) continue
          const data = await res.json()
          for (const g of data.games ?? []) {
            // Skip if already in local schedule (by checking opponent + date + time)
            const isDupe = schedule.some((s) =>
              s.date === g.date && s.opponent === g.opponent && s.startTime === g.startTime
            )
            if (isDupe) continue
            allGames.push({
              id: `shared-${g.id}`,
              familyId: profile?.familyId ?? 'local',
              playerId: profile?.id ?? 'local',
              type: 'match',
              title: g.title || `vs ${g.opponent}`,
              date: g.date,
              startTime: g.startTime,
              endTime: g.endTime,
              location: g.location,
              opponent: g.opponent,
              competition: g.competition,
              matchType: g.matchType,
              createdBy: 'shared',
              createdAt: g.createdAt,
            })
          }
        } catch { /* API unavailable — skip silently */ }
      }
      if (!cancelled) setSharedGames(allGames)
    }

    fetchShared()
    return () => { cancelled = true }
  }, [profile?.teams, profile?.familyId, profile?.id, viewYear, viewMonth, schedule])

  const allEvents = useMemo(
    () => [...schedule, ...recurringEvents, ...sharedGames],
    [schedule, recurringEvents, sharedGames],
  )

  // Events grouped by date
  const eventsByDate = new Map<string, ScheduleEvent[]>()
  for (const ev of allEvents) {
    const existing = eventsByDate.get(ev.date) ?? []
    existing.push(ev)
    eventsByDate.set(ev.date, existing)
  }

  // Week view: get the Monday for current week + offset
  const weekMonday = useMemo(() => {
    const m = getWeekMonday(today)
    m.setDate(m.getDate() + weekOffset * 7)
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  const weekDates = useMemo(() => getWeekDates(weekMonday), [weekMonday])

  // Also expand recurring for the week view (may be outside current viewMonth)
  const weekRecurringEvents = useMemo(() => {
    const events: ScheduleEvent[] = []
    for (const dk of weekDates) {
      const [y, m, d] = dk.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      const dow = date.getDay()
      for (const rt of recurringTrainings) {
        if (rt.active && rt.dayOfWeek === dow) {
          // Only add if not already in recurringEvents for the month view
          const alreadyExists = recurringEvents.some((e) => e.id === `rt-${rt.id}-${dk}`)
          if (!alreadyExists) {
            events.push({
              id: `rt-${rt.id}-${dk}`,
              familyId: profile?.familyId ?? 'local',
              playerId: profile?.id ?? 'local',
              type: 'training',
              title: rt.name || t(`training.type.${rt.trainingType}`),
              date: dk,
              startTime: rt.startTime,
              endTime: rt.endTime,
              location: rt.location,
              createdBy: 'recurring',
              createdAt: rt.createdAt,
            })
          }
        }
      }
    }
    return events
  }, [weekDates, recurringTrainings, recurringEvents, profile, t])

  // All events for the week view (schedule + recurring from month + extra recurring outside month + shared)
  const weekAllEvents = useMemo(
    () => [...schedule, ...recurringEvents, ...weekRecurringEvents, ...sharedGames],
    [schedule, recurringEvents, weekRecurringEvents, sharedGames],
  )

  const weekEventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    for (const ev of weekAllEvents) {
      if (weekDates.includes(ev.date)) {
        const existing = map.get(ev.date) ?? []
        existing.push(ev)
        map.set(ev.date, existing)
      }
    }
    return map
  }, [weekAllEvents, weekDates])

  const isCurrentWeek = weekOffset === 0
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)
  const weekLabel = `${weekMonday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${weekSunday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function openAddForm(date: string, nextType: ScheduleType = formType) {
    setSelectedDate(date)
    setShowForm(true)
    setFormType(nextType)
    setFormTitle('')
    setFormTime('18:00')
    setFormEndTime(nextType === 'match' ? addMinutesToTime('18:00', matchDurationRecommendation.totalMinutes) : '19:30')
    setFormLocation('')
    setFormOpponent('')
    setFormMatchType('friendly')
    setFormCompetition('')
    setFormNotes('')
    setFormTrainingType('team')
    setSelectDateHint(false)
  }

  function tryOpenAdd(nextType: ScheduleType) {
    if (!selectedDate) {
      // On week view, auto-select today; on month view, hint to select a date
      if (activeTab === 'week') {
        const todayDate = new Date().toISOString().split('T')[0]
        setSelectedDate(todayDate)
        openAddForm(todayDate, nextType)
        return
      }
      setSelectDateHint(true)
      setTimeout(() => setSelectDateHint(false), 2500)
      return
    }
    openAddForm(selectedDate, nextType)
  }

  function saveEvent() {
    if (!selectedDate) return
    const isMatch = formType === 'match'
    const isTraining = formType === 'training'
    const ev: ScheduleEvent = {
      id: crypto.randomUUID(),
      familyId: profile?.familyId ?? 'local',
      playerId: profile?.id ?? 'local',
      type: formType,
      title: formTitle || (isMatch ? `${t(`schedule.matchType.${formMatchType}`)} vs ${formOpponent || '?'}` : isTraining ? t(`training.type.${formTrainingType}`) : t(`mentor.schedule.${formType}`)),
      date: selectedDate,
      startTime: formTime,
      endTime: formEndTime || undefined,
      location: formLocation || undefined,
      opponent: isMatch ? formOpponent || undefined : undefined,
      competition: isMatch ? formCompetition || undefined : undefined,
      matchType: isMatch ? formMatchType : undefined,
      trainingType: isTraining ? formTrainingType : undefined,
      notes: formNotes || undefined,
      createdBy: profile?.id ?? 'local',
      createdAt: new Date().toISOString(),
    }
    addScheduleEvent(ev)
    setShowForm(false)

    // Auto-share match events for team visibility
    if (isMatch && formOpponent) {
      const teamName = profile?.team || profile?.teams?.find((t) => t.isPrimary)?.name
      if (teamName) {
        fetch('/api/shared-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName,
            opponent: formOpponent,
            date: selectedDate,
            startTime: formTime,
            endTime: formEndTime,
            location: formLocation,
            matchType: formMatchType,
            competition: formCompetition,
            title: ev.title,
          }),
        }).catch(() => { /* best-effort sharing */ })
      }
    }
  }

  function addRecurringTraining() {
    const rt: RecurringTraining = {
      id: crypto.randomUUID(),
      name: rtName || t(`training.type.${rtType}`),
      trainingType: rtType,
      dayOfWeek: rtDay,
      startTime: rtStart,
      endTime: rtEnd,
      location: rtLocation || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    }
    setRecurringTrainings([...recurringTrainings, rt])
    setRtName('')
    setRtLocation('')
    setShowWeeklySetup(false)
  }

  function removeRecurring(id: string) {
    setRecurringTrainings(recurringTrainings.filter((r) => r.id !== id))
  }

  const selectedEvents = selectedDate
    ? (activeTab === 'week'
      ? weekEventsByDate.get(selectedDate) ?? []
      : eventsByDate.get(selectedDate) ?? [])
    : []
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('mentor.schedule.title')}</h2>

      {/* ── Tab switcher ── */}
      <div className="schedule-tabs">
        <button className="schedule-tab" aria-selected={activeTab === 'week'} onClick={() => setActiveTab('week')}>
          📅 {t('schedule.tabWeek')}
        </button>
        <button className="schedule-tab" aria-selected={activeTab === 'month'} onClick={() => setActiveTab('month')}>
          🗓️ {t('schedule.tabMonth')}
        </button>
      </div>

      {/* ══════════════════════ WEEK TAB ══════════════════════ */}
      {activeTab === 'week' && (
        <div style={{ minHeight: 380 }} className="flex flex-col gap-4">
          {/* Week navigation — outside card, like month */}
          <div className="flex items-center justify-between">
            <button className="tap-target text-lg font-bold px-2" onClick={() => setWeekOffset(weekOffset - 1)} aria-label="Previous week">←</button>
            <div className="text-center">
              <span className="text-sm font-bold">{weekLabel}</span>
              {!isCurrentWeek && (
                <button className="ml-2 text-xs underline" style={{ color: 'var(--color-primary-dark)' }} onClick={() => setWeekOffset(0)}>
                  {t('schedule.thisWeek')}
                </button>
              )}
            </div>
            <button className="tap-target text-lg font-bold px-2" onClick={() => setWeekOffset(weekOffset + 1)} aria-label="Next week">→</button>
          </div>

          {/* Week day rows */}
          <div className="card p-3">
            <div className="flex flex-col">
              {weekDates.map((dk, idx) => {
                const dayEvents = weekEventsByDate.get(dk) ?? []
                const [, , dayNum] = dk.split('-')
                const jsDow = idx < 6 ? idx + 1 : 0
                const isToday = dk === todayStr
                const isWeekend = jsDow === 0 || jsDow === 6
                return (
                  <div
                    key={dk}
                    className="flex items-start gap-2 py-2 px-2 rounded-lg cursor-pointer"
                    style={{
                      background: dk === selectedDate ? 'rgba(var(--color-primary-rgb), 0.1)' : isToday ? 'rgba(var(--color-primary-rgb), 0.06)' : undefined,
                      borderLeft: dk === selectedDate ? '3px solid var(--color-primary-dark)' : isToday ? '3px solid var(--color-primary-dark)' : '3px solid transparent',
                      borderBottom: idx < 6 ? '1px solid var(--color-pitch-line, #e5e7eb)' : undefined,
                    }}
                    onClick={() => setSelectedDate(dk)}
                  >
                    <div className="w-12 shrink-0 pt-0.5">
                      <span className="text-xs font-bold block" style={{ color: isToday ? 'var(--color-primary-dark)' : isWeekend ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}>
                        {t(WEEKDAY_NAMES[jsDow])}
                      </span>
                      <span className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>{dayNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {dayEvents.length === 0 ? (
                        <span className="text-xs py-0.5" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {dayEvents.map((ev) => {
                            const evType = EVENT_TYPES.find((et) => et.key === ev.type)
                            const isRemovable = !ev.id.startsWith('rt-') && !ev.id.startsWith('shared-')
                            return (
                              <div key={ev.id} className="flex items-center gap-1.5 group">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: evType?.color ?? 'var(--color-primary-dark)' }} />
                                <span className="text-xs font-bold shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{ev.startTime}</span>
                                <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</span>
                                {ev.id.startsWith('rt-') && <span className="text-[0.5rem]">🔁</span>}
                                {ev.id.startsWith('shared-') && <span className="text-[0.5rem]" style={{ color: 'var(--color-primary-dark)' }}>👥</span>}
                                {isRemovable && (
                                  <button
                                    className="text-xs px-1 opacity-30 group-hover:opacity-100 shrink-0"
                                    style={{ color: 'var(--color-danger)' }}
                                    onClick={() => removeScheduleEvent(ev.id)}
                                    aria-label="Remove"
                                  >✕</button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ MONTH TAB ══════════════════════ */}
      {activeTab === 'month' && (
        <div style={{ minHeight: 380 }} className="flex flex-col gap-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button className="tap-target text-lg font-bold px-2" onClick={prevMonth} aria-label="Previous month">←</button>
            <span className="text-sm font-bold capitalize">{monthName}</span>
            <button className="tap-target text-lg font-bold px-2" onClick={nextMonth} aria-label="Next month">→</button>
          </div>

          {/* Calendar grid */}
          <div className="card p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS_KEYS.map((k) => (
                <div key={k} className="text-center text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  {t(k)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />
                const dk = dateKey(viewYear, viewMonth, day)
                const dayEvents = eventsByDate.get(dk) ?? []
                const hasEvents = dayEvents.length > 0
                const isToday = dk === todayStr
                const isSelected = dk === selectedDate
                return (
                  <button
                    key={dk}
                    className="cal-day tap-target relative"
                    data-today={isToday}
                    data-selected={isSelected}
                    data-has-events={hasEvents}
                    onClick={() => { setSelectedDate(dk); setSelectDateHint(false) }}
                    aria-label={`${day} ${hasEvents ? `(${dayEvents.length} events)` : ''}`}
                  >
                    <span className="text-xs font-bold">{day}</span>
                    {hasEvents && (
                      <div className="flex gap-[2px] justify-center mt-0.5">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const evType = EVENT_TYPES.find((et) => et.key === ev.type)
                          return (
                            <div
                              key={ev.id}
                              className="cal-dot"
                              style={{ background: evType?.color ?? 'var(--color-primary-dark)' }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Add event buttons (visible on both week & month) ── */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { type: 'training' as ScheduleType, emoji: '⚽', labelKey: 'schedule.addTraining', color: 'var(--color-primary-dark)' },
          { type: 'match' as ScheduleType, emoji: '🏟️', labelKey: 'schedule.addMatch', color: 'var(--color-cat-physical)' },
          { type: 'event' as ScheduleType, emoji: '📅', labelKey: 'schedule.addEvent', color: 'var(--color-text-secondary)' },
          { type: 'tournament' as ScheduleType, emoji: '🏆', labelKey: 'schedule.addTournament', color: 'var(--color-gold-500)' },
        ]).map((btn) => (
          <button
            key={btn.type}
            className="card flex flex-col items-center gap-1 py-2.5"
            style={{ cursor: 'pointer' }}
            onClick={() => btn.type === 'tournament' ? setShowImport(true) : tryOpenAdd(btn.type)}
          >
            <span className="text-base">{btn.emoji}</span>
            <span className="text-xs font-bold leading-tight text-center" style={{ color: btn.color }}>{t(btn.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Select date hint */}
      {selectDateHint && (
        <p className="text-xs text-center animate-fade-up" style={{ color: 'var(--color-danger)' }}>
          ☝️ {t('schedule.selectDate')}
        </p>
      )}

      {/* Selected date events (both views) */}
      {selectedDate && (
            <div className="flex flex-col gap-2 animate-fade-up">
              <p className="section-label">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>

              {selectedEvents.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                  {t('schedule.noEvents')}
                </p>
              )}

              {selectedEvents.map((ev) => {
                const evType = EVENT_TYPES.find((et) => et.key === ev.type)
                return (
                  <div key={ev.id} className="card flex items-center gap-3">
                    <span className="text-xl">{evType?.emoji ?? '📅'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold truncate">{ev.title}</p>
                        {ev.matchType && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-secondary)' }}>
                            {MATCH_TYPES.find((m) => m.key === ev.matchType)?.emoji} {t(`schedule.matchType.${ev.matchType}`, ev.matchType)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
                        {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                        {ev.location ? ` • ${ev.location}` : ''}
                      </p>
                      {ev.opponent && (
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          vs {ev.opponent}{ev.competition ? ` · ${ev.competition}` : ''}
                        </p>
                      )}
                      {ev.notes && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {ev.notes}
                        </p>
                      )}
                    </div>
                    {!ev.id.startsWith('rt-') && !ev.id.startsWith('shared-') && (
                      <button
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => removeScheduleEvent(ev.id)}
                        aria-label="Delete event"
                      >
                        ✕
                      </button>
                    )}
                    {ev.id.startsWith('rt-') && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-muted)' }}>
                        🔁
                      </span>
                    )}
                    {ev.id.startsWith('shared-') && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-primary-bg, #dcfce7)', color: 'var(--color-primary-dark, #166534)' }}>
                        👥 {t('schedule.teamShared')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

      {/* ── Recurring trainings (visible on both week & month) ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">{t('schedule.recurringTitle')}</p>
          <button
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}
            onClick={() => setShowWeeklySetup(true)}
          >
            + {t('schedule.addRecurring')}
          </button>
        </div>
        {recurringTrainings.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: 'var(--color-text-muted)' }}>
            {t('schedule.noRecurring')}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
              const dayTrainings = recurringTrainings.filter((r) => r.dayOfWeek === dow && r.active)
              if (dayTrainings.length === 0) return null
              return (
                <div key={dow} className="flex items-start gap-2">
                  <span className="text-xs font-bold w-8 pt-1 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {t(WEEKDAY_NAMES[dow])}
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {dayTrainings.map((rt) => {
                      const ttType = TRAINING_TYPES_UI.find((tt) => tt.key === rt.trainingType)
                      return (
                        <span key={rt.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--color-glass-active, #f1f5f9)' }}>
                          {ttType?.emoji} {rt.startTime}–{rt.endTime}
                          {rt.location && <span style={{ color: 'var(--color-text-muted)' }}>· {rt.location}</span>}
                          <button
                            className="ml-0.5 opacity-40 hover:opacity-100"
                            onClick={() => removeRecurring(rt.id)}
                            aria-label="Remove"
                          >✕</button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════ ADD EVENT FORM (overlay) ══════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '85dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">{t('mentor.schedule.add')}</h3>
              <button className="tap-target text-lg" onClick={() => setShowForm(false)} aria-label={t('common.cancel')}>✕</button>
            </div>

            {/* Event type chips */}
            <div className="flex gap-2 mb-4">
              {EVENT_TYPES.filter((et) => et.key !== 'tournament').map((et) => (
                <button
                  key={et.key}
                  className="btn-choice tap-target flex-1 text-center text-xs py-2"
                  aria-pressed={formType === et.key}
                  onClick={() => {
                    setFormType(et.key)
                    if (et.key === 'match') {
                      setFormEndTime(addMinutesToTime(formTime, matchDurationRecommendation.totalMinutes))
                    }
                  }}
                >
                  {et.emoji} {t(et.labelKey)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {/* Date picker */}
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>{t('log.date')}</label>
                <input
                  type="date"
                  value={selectedDate ?? ''}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-lg"
                  style={{ background: 'var(--color-bg-field, #f8fafc)', border: '1px solid var(--color-glass-border)' }}
                />
              </div>

              {/* Training type selector */}
              {formType === 'training' && (
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.trainingTypeLabel')}</label>
                  <div className="grid grid-cols-4 gap-1">
                    {TRAINING_TYPES_UI.map((tt) => (
                      <button
                        key={tt.key}
                        className="btn-choice tap-target text-center text-xs py-1.5"
                        aria-pressed={formTrainingType === tt.key}
                        onClick={() => setFormTrainingType(tt.key)}
                      >
                        {tt.emoji}
                        <span className="block text-xs mt-0.5">{t(tt.labelKey).split(/\s/)[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('schedule.eventTitle')}
                className="w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <TimePicker value={formTime} onChange={setFormTime} label={t('schedule.startTime')} />
                <TimePicker value={formEndTime} onChange={setFormEndTime} label={t('schedule.endTime')} />
              </div>

              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder={t('schedule.location')}
                className="w-full"
              />

              {/* Match-specific fields */}
              {formType === 'match' && (
                <>
                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.matchTypeLabel')}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {MATCH_TYPES.map((mt) => (
                        <button
                          key={mt.key}
                          className="btn-choice tap-target text-center text-xs py-1.5"
                          aria-pressed={formMatchType === mt.key}
                          onClick={() => setFormMatchType(mt.key)}
                        >
                          {mt.emoji} {t(mt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.opponent')}</label>
                    <TeamSearch
                      value={formOpponent}
                      onChange={(name) => setFormOpponent(name)}
                      country={profile?.country}
                      placeholder={t('schedule.opponent')}
                      className="w-full"
                    />
                  </div>

                  <input
                    type="text"
                    value={formCompetition}
                    onChange={(e) => setFormCompetition(e.target.value)}
                    placeholder={t('match.competition')}
                    className="w-full"
                  />
                </>
              )}

              {/* Event notes */}
              {formType === 'event' && (
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={t('schedule.eventNotes')}
                  className="w-full"
                  rows={2}
                />
              )}
            </div>

            <button className="btn-primary mt-4 w-full" onClick={saveEvent}>
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════ ADD RECURRING FORM (overlay) ══════════════════════ */}
      {showWeeklySetup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">{t('schedule.addRecurring')}</h3>
              <button className="tap-target text-lg" onClick={() => setShowWeeklySetup(false)} aria-label={t('common.cancel')}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Training type — 8 options in 2 rows of 4 */}
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.trainingTypeLabel')}</label>
                <div className="grid grid-cols-4 gap-1">
                  {TRAINING_TYPES_UI.map((tt) => (
                    <button
                      key={tt.key}
                      className="btn-choice tap-target text-center text-xs py-1.5"
                      aria-pressed={rtType === tt.key}
                      onClick={() => setRtType(tt.key)}
                    >
                      {tt.emoji}
                      <span className="block text-xs mt-0.5">{t(tt.labelKey).split(/\s/)[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of week */}
              <div>
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.dayOfWeek')}</label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
                    <button
                      key={dow}
                      className="btn-choice tap-target flex-1 text-center text-xs py-2"
                      aria-pressed={rtDay === dow}
                      onClick={() => setRtDay(dow)}
                    >
                      {t(WEEKDAY_NAMES[dow])}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={rtName}
                onChange={(e) => setRtName(e.target.value)}
                placeholder={t('schedule.trainingName')}
                className="w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <TimePicker value={rtStart} onChange={setRtStart} label={t('schedule.startTime')} />
                <TimePicker value={rtEnd} onChange={setRtEnd} label={t('schedule.endTime')} />
              </div>

              <input
                type="text"
                value={rtLocation}
                onChange={(e) => setRtLocation(e.target.value)}
                placeholder={t('schedule.location')}
                className="w-full"
              />
            </div>

            <button className="btn-primary mt-4 w-full" onClick={addRecurringTraining}>
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {showImport && <TournamentImport onClose={() => setShowImport(false)} />}
    </div>
  )
}
