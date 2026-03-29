import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TournamentImport } from '../components/TournamentImport'
import type { ScheduleType, ScheduleEvent, RecurringTraining, TrainingType } from '../engine/types'

const EVENT_TYPES: { key: ScheduleType; emoji: string; labelKey: string; color: string }[] = [
  { key: 'training', emoji: '⚽', labelKey: 'mentor.schedule.training', color: 'var(--color-primary-dark)' },
  { key: 'match', emoji: '🏟️', labelKey: 'mentor.schedule.match', color: 'var(--color-cat-physical)' },
  { key: 'tournament', emoji: '🏆', labelKey: 'mentor.schedule.tournament', color: 'var(--color-gold-500)' },
]

const TRAINING_TYPES: { key: TrainingType; emoji: string; labelKey: string }[] = [
  { key: 'team', emoji: '⚽', labelKey: 'training.type.team' },
  { key: 'individual', emoji: '🏃', labelKey: 'training.type.individual' },
  { key: 'gym', emoji: '💪', labelKey: 'training.type.gym' },
  { key: 'futsal', emoji: '🔲', labelKey: 'training.type.futsal' },
]

const WEEKDAYS_KEYS = [
  'schedule.mon', 'schedule.tue', 'schedule.wed', 'schedule.thu',
  'schedule.fri', 'schedule.sat', 'schedule.sun',
]

const WEEKDAY_NAMES = ['schedule.sun', 'schedule.mon', 'schedule.tue', 'schedule.wed', 'schedule.thu', 'schedule.fri', 'schedule.sat']

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

export function SchedulePage() {
  const { t } = useTranslation()
  const { schedule, addScheduleEvent, removeScheduleEvent, recurringTrainings, setRecurringTrainings, profile } = useApp()

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<ScheduleType>('training')
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('18:00')
  const [formEndTime, setFormEndTime] = useState('19:30')
  const [formLocation, setFormLocation] = useState('')
  const [formOpponent, setFormOpponent] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showWeeklySetup, setShowWeeklySetup] = useState(false)
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

  // Combine real schedule + recurring
  const allEvents = useMemo(() => [...schedule, ...recurringEvents], [schedule, recurringEvents])

  // Events grouped by date
  const eventsByDate = new Map<string, ScheduleEvent[]>()
  for (const ev of allEvents) {
    const existing = eventsByDate.get(ev.date) ?? []
    existing.push(ev)
    eventsByDate.set(ev.date, existing)
  }

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

  function openAddForm(date: string) {
    setSelectedDate(date)
    setShowForm(true)
    setFormTitle('')
    setFormLocation('')
    setFormOpponent('')
  }

  function saveEvent() {
    if (!selectedDate) return
    const ev: ScheduleEvent = {
      id: crypto.randomUUID(),
      familyId: profile?.familyId ?? 'local',
      playerId: profile?.id ?? 'local',
      type: formType,
      title: formTitle || t(`mentor.schedule.${formType}`),
      date: selectedDate,
      startTime: formTime,
      endTime: formEndTime || undefined,
      location: formLocation || undefined,
      opponent: formType === 'match' ? formOpponent || undefined : undefined,
      createdBy: profile?.id ?? 'local',
      createdAt: new Date().toISOString(),
    }
    addScheduleEvent(ev)
    setShowForm(false)
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

  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : []
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">{t('mentor.schedule.title')}</h2>
        <button
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--color-gold-glow)', color: 'var(--color-gold-500)' }}
          onClick={() => setShowImport(true)}
          aria-label={t('import.addTournament')}
        >
          🏆 {t('import.addTournament')}
        </button>
      </div>

      {/* ── My Weekly Schedule ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">{t('schedule.weeklyTitle')}</p>
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
                      const ttType = TRAINING_TYPES.find((tt) => tt.key === rt.trainingType)
                      return (
                        <span key={rt.id} className="inline-flex items-center gap-1 text-[0.65rem] px-2 py-1 rounded-lg" style={{ background: 'var(--color-glass-active, #f1f5f9)' }}>
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
            <div key={k} className="text-center text-[0.6rem] font-bold" style={{ color: 'var(--color-text-muted)' }}>
              {t(k)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dk = dateKey(viewYear, viewMonth, day)
            const hasEvents = eventsByDate.has(dk)
            const isToday = dk === todayStr
            const isSelected = dk === selectedDate
            return (
              <button
                key={dk}
                className="cal-day tap-target relative"
                data-today={isToday}
                data-selected={isSelected}
                data-has-events={hasEvents}
                onClick={() => setSelectedDate(dk)}
                aria-label={`${day} ${hasEvents ? `(${eventsByDate.get(dk)?.length} events)` : ''}`}
              >
                <span className="text-xs font-bold">{day}</span>
                {hasEvents && (
                  <div className="flex gap-0.5 justify-center mt-0.5">
                    {(eventsByDate.get(dk) ?? []).slice(0, 3).map((ev) => {
                      const evType = EVENT_TYPES.find((et) => et.key === ev.type)
                      return (
                        <div
                          key={ev.id}
                          className="w-1.5 h-1.5 rounded-full"
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

      {/* Selected date events */}
      {selectedDate && (
        <div className="flex flex-col gap-2 animate-fade-up">
          <div className="flex items-center justify-between">
            <p className="section-label">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <button
              className="text-xs font-bold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}
              onClick={() => openAddForm(selectedDate)}
              aria-label={t('mentor.schedule.add')}
            >
              + {t('mentor.schedule.add')}
            </button>
          </div>

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
                  <p className="text-sm font-bold">{ev.title}</p>
                  <p className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
                    {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                    {ev.location ? ` • ${ev.location}` : ''}
                  </p>
                  {ev.opponent && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      vs {ev.opponent}
                    </p>
                  )}
                </div>
                {!ev.id.startsWith('rt-') && (
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
                  <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-muted)' }}>
                    🔁
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add event form (overlay) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">{t('mentor.schedule.add')}</h3>
              <button
                className="tap-target text-lg"
                onClick={() => setShowForm(false)}
                aria-label={t('common.cancel')}
              >
                ✕
              </button>
            </div>

            {/* Event type chips */}
            <div className="flex gap-2 mb-4">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.key}
                  className="btn-choice tap-target flex-1 text-center text-xs py-2"
                  aria-pressed={formType === et.key}
                  onClick={() => setFormType(et.key)}
                >
                  {et.emoji} {t(et.labelKey)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('schedule.eventTitle')}
                className="w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('schedule.startTime')}
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('schedule.endTime')}
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder={t('schedule.location')}
                className="w-full"
              />

              {formType === 'match' && (
                <input
                  type="text"
                  value={formOpponent}
                  onChange={(e) => setFormOpponent(e.target.value)}
                  placeholder={t('schedule.opponent')}
                  className="w-full"
                />
              )}
            </div>

            <button
              className="btn-primary mt-4 w-full"
              onClick={saveEvent}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Add recurring training form */}
      {showWeeklySetup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold">{t('schedule.addRecurring')}</h3>
              <button className="tap-target text-lg" onClick={() => setShowWeeklySetup(false)} aria-label={t('common.cancel')}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Training type */}
              <div className="flex gap-2">
                {TRAINING_TYPES.map((tt) => (
                  <button
                    key={tt.key}
                    className="btn-choice tap-target flex-1 text-center text-xs py-2"
                    aria-pressed={rtType === tt.key}
                    onClick={() => setRtType(tt.key)}
                  >
                    {tt.emoji} {t(tt.labelKey)}
                  </button>
                ))}
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

              {/* Name */}
              <input
                type="text"
                value={rtName}
                onChange={(e) => setRtName(e.target.value)}
                placeholder={t('schedule.trainingName')}
                className="w-full"
              />

              {/* Times */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.startTime')}</label>
                  <input type="time" value={rtStart} onChange={(e) => setRtStart(e.target.value)} className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('schedule.endTime')}</label>
                  <input type="time" value={rtEnd} onChange={(e) => setRtEnd(e.target.value)} className="w-full" />
                </div>
              </div>

              {/* Location */}
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
