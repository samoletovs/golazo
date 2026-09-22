import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { ClubhouseHeader } from '../components/training/ClubhouseHeader'
import { TrainingProgress } from '../components/training/TrainingProgress'
import { TrainingLog } from './TrainingLog'
import type { TrainingLogProps } from './TrainingLog'
import '../clubhouse.css'

export function Clubhouse({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { t, i18n } = useTranslation()
  const { trainings, schedule, recurringTrainings } = useApp()
  const [logging, setLogging] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const logged = (id: string) => trainings.some(entry => entry.date === today && entry.fromSchedule === id)
  const planned = schedule.find(event => event.type === 'training' && event.date === today && !logged(event.id))
  const recurring = recurringTrainings.find(event => event.active && event.dayOfWeek === new Date().getDay() && !logged(`rt-${event.id}-${today}`))
  const next = planned ?? (recurring ? { ...recurring, id: `rt-${recurring.id}-${today}`, title: recurring.name } : undefined)
  const minutes = next?.startTime && next.endTime
    ? (new Date(`2000-01-01T${next.endTime}`).getTime() - new Date(`2000-01-01T${next.startTime}`).getTime()) / 60000
    : 90
  const prefill: TrainingLogProps['prefill'] = next ? {
    date: today, type: next.trainingType, durationMinutes: minutes > 0 ? minutes : 90,
    fromSchedule: next.id, location: next.location,
  } : undefined
  const recent = [...trainings].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
  const trainedToday = trainings.some(entry => entry.date.slice(0, 10) === today)
  if (logging) return <TrainingLog prefill={prefill} onBack={() => setLogging(false)} />

  return (
    <div className="clubhouse club-home">
      <ClubhouseHeader />
      <div className="club-two-column">
        <section className="club-panel club-log-card">
          <span className="club-eyebrow">{t('clubhouse.afterTraining')}</span>
          <h2>{t(trainedToday && !next ? 'clubhouse.todayRemembered' : 'clubhouse.readyToLog')}</h2>
          <p className="club-muted">{next?.title || t('clubhouse.quickLog')}</p>
          {next && <p>{t(`training.type.${next.trainingType ?? 'team'}`)} · {t('training.minutes', { min: prefill?.durationMinutes })}</p>}
          <button className="club-button" onClick={() => setLogging(true)}>{t(trainedToday && !next ? 'clubhouse.anotherSession' : 'clubhouse.logTraining')} <span aria-hidden="true">→</span></button>
          <p className="club-hint">{t('training.localHint')}</p>
        </section>
        <section className="club-panel">
          <span className="club-eyebrow">{t('clubhouse.yourPace')}</span>
          <h2>{t('clubhouse.yourProgress')}</h2>
          <TrainingProgress />
          <button className="club-link" onClick={() => onNavigate('progress')}>{t('clubhouse.allProgress')}</button>
        </section>
      </div>
      <section className="club-rest">
        <div><h2>{t('clubhouse.restTitle')}</h2><p>{t('clubhouse.restBody')}</p></div>
        <button className="club-link" onClick={() => onNavigate('schedule')}>{t('nav.schedule')}</button>
      </section>
      <section className="club-journal">
        <h2>{t('clubhouse.journal')}</h2>
        {recent.length ? <ul>{recent.map(entry => <li key={entry.id}>
          <time dateTime={entry.date}>{new Date(`${entry.date.slice(0, 10)}T12:00:00Z`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}</time>
          <strong>{t(`training.type.${entry.type}`)}</strong><span>{t('training.minutes', { min: entry.durationMinutes })}</span>
        </li>)}</ul> : <p>{t('clubhouse.emptyJournal')}</p>}
      </section>
      <button className="club-link" onClick={() => onNavigate('activity')}>{t('clubhouse.moreFootball')}</button>
    </div>
  )
}
