import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { TrainingLog } from '../../pages/TrainingLog'
import { MatchLog } from '../../pages/MatchLog'
import { AcademyDialog } from './AcademyDialog'
import type { ScheduleEvent } from '../../engine/types'

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function AcademyWeekboard({ onNavigate, onLoggingChange }: { onNavigate?: (page: string) => void; onLoggingChange?: (open: boolean) => void }) {
  const { t, i18n } = useTranslation()
  const { schedule, recurringTrainings, trainings, matches, profile } = useApp()
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(() => dayKey(new Date()))
  const [logging, setLogging] = useState<ScheduleEvent | null>(null)
  function openLog(event: ScheduleEvent) { setLogging(event); onLoggingChange?.(true) }
  function closeLog() { setLogging(null); onLoggingChange?.(false) }
  const today = dayKey(new Date())
  const monday = new Date(`${today}T12:00:00`)
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 + offset * 7)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(date.getDate() + index)
    const key = dayKey(date)
    const recurring: ScheduleEvent[] = recurringTrainings.filter(item => item.active && item.dayOfWeek === date.getDay()).map(item => ({
      id: `rt-${item.id}-${key}`, familyId: profile?.familyId ?? 'local', playerId: profile?.id ?? 'local',
      type: 'training', title: item.name || t(`training.type.${item.trainingType}`), date: key,
      startTime: item.startTime, endTime: item.endTime, location: item.location, trainingType: item.trainingType,
      createdBy: 'recurring', createdAt: item.createdAt,
    }))
    const events = [...schedule.filter(item => item.date === key), ...recurring].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    return { date, key, events }
  })
  const active = days.find(day => day.key === selected) ?? days[0]
  const isLogged = (event: ScheduleEvent) => event.type === 'training'
    ? trainings.some(item => item.date === event.date && item.fromSchedule === event.id)
    : event.type === 'match' && matches.some(item => item.date === event.date && item.opponent === event.opponent)
  function changeWeek(delta: number) {
    setOffset(current => current + delta)
    const start = new Date(monday)
    start.setDate(start.getDate() + delta * 7)
    setSelected(dayKey(start))
  }
  const duration = logging?.startTime && logging.endTime
    ? Math.max(1, Math.round((new Date(`2000-01-01T${logging.endTime}`).getTime() - new Date(`2000-01-01T${logging.startTime}`).getTime()) / 60000))
    : undefined
  return <section className="academy-stack" data-academy-component="weekboard">
    <div className="academy-actions">
      <h2 className="mr-auto">{monday.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}</h2>
      <button className="academy-choice" aria-label={t('academy.previousWeek')} onClick={() => changeWeek(-1)}>←</button>
      <button className="academy-choice" aria-label={t('academy.nextWeek')} onClick={() => changeWeek(1)}>→</button>
      <button className="academy-link" onClick={() => onNavigate?.('schedule')}>{t('nav.schedule')}</button>
    </div>
    <div className="academy-week-frame"><div className="academy-week">
      {days.map(day => <button key={day.key} className={`academy-day${day.key === today ? ' today' : ''}`} onClick={() => setSelected(day.key)} aria-pressed={active.key === day.key}
        aria-label={t('academy.openDay', { date: day.date.toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' }), count: day.events.length })}>
        <small className="academy-day-long">{day.date.toLocaleDateString(i18n.language, { weekday: 'long' })}</small>
        <small className="academy-day-short">{day.date.toLocaleDateString(i18n.language, { weekday: 'narrow' })}</small>
        <strong>{day.date.getDate()}</strong>
        {day.events.length > 0 && <><span className="academy-day-dot" /><span className="academy-day-title">{day.events[0].title}</span></>}
      </button>)}
    </div></div>
    <div className="academy-panel">
      <h3>{active.date.toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
      {!active.events.length && <p className="academy-muted mt-4">{t('academy.noPlan')}</p>}
      {active.events.map(event => <div className="academy-agenda-row" key={event.id}>
        <time>{event.startTime || '—'}</time>
        <div><h3>{event.title}{event.opponent ? ` · ${event.opponent}` : ''}</h3><p>{event.location}</p>
          {isLogged(event) ? <p className="academy-complete-label">{t('academy.recorded')}</p> : event.date <= today && (event.type === 'training' || event.type === 'match')
            ? <button className="academy-link" onClick={() => openLog(event)}>{t('academy.dayLog')} <span aria-hidden="true">→</span></button>
            : <button className="academy-link" onClick={() => onNavigate?.('schedule')}>{t('nav.schedule')} <span aria-hidden="true">→</span></button>}
        </div>
      </div>)}
    </div>
    {logging && <AcademyDialog surface={`home-${logging.type}-log`} title={logging.title} onClose={closeLog} wide>
      {logging.type === 'training'
        ? <TrainingLog inline onBack={closeLog} prefill={{ date: logging.date, type: logging.trainingType, durationMinutes: duration, fromSchedule: logging.id }} />
        : <MatchLog inline onBack={closeLog} prefill={{ date: logging.date, opponent: logging.opponent, competition: logging.competition, matchType: logging.matchType, fromSchedule: logging.id }} />}
    </AcademyDialog>}
  </section>
}
