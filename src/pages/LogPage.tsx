import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TrainingLog } from './TrainingLog'
import { MatchLog } from './MatchLog'
import { DiaryPage } from './DiaryPage'
import { TournamentImport } from '../components/TournamentImport'
import type { ScheduleEvent, TrainingType } from '../engine/types'

type LogType = 'select' | 'training' | 'match' | 'diary'

interface PendingEvent {
  event: ScheduleEvent
  isToday: boolean
  dayLabel: string
}

export function LogPage() {
  const { t } = useTranslation()
  const { schedule, recurringTrainings, matches, trainings, profile } = useApp()
  const [logType, setLogType] = useState<LogType>('select')
  const [showImport, setShowImport] = useState(false)
  const [prefillData, setPrefillData] = useState<Record<string, string | number | undefined>>({})

  const today = new Date().toISOString().split('T')[0]

  // Find pending events: today's planned + past 7 days without feedback
  const pendingEvents = useMemo(() => {
    const now = new Date()
    const result: PendingEvent[] = []

    for (let daysBack = 0; daysBack <= 7; daysBack++) {
      const d = new Date(now)
      d.setDate(d.getDate() - daysBack)
      const dk = d.toISOString().split('T')[0]
      const dow = d.getDay()
      const isToday = daysBack === 0

      // Manual schedule events for this day
      const daySchedule = schedule.filter((ev) =>
        ev.date === dk && (ev.type === 'training' || ev.type === 'match' || ev.type === 'tournament')
      )

      // Recurring trainings for this day
      const recurringForDay: ScheduleEvent[] = (recurringTrainings ?? [])
        .filter((rt) => rt.active && rt.dayOfWeek === dow)
        .map((rt) => ({
          id: `rt-${rt.id}-${dk}`,
          familyId: profile?.familyId ?? 'local',
          playerId: profile?.id ?? 'local',
          type: 'training' as const,
          title: rt.name || t(`training.type.${rt.trainingType}`),
          date: dk,
          startTime: rt.startTime,
          endTime: rt.endTime,
          location: rt.location,
          trainingType: rt.trainingType,
          createdBy: 'recurring',
          createdAt: rt.createdAt,
        }))

      const allDayEvents = [...daySchedule, ...recurringForDay]

      for (const ev of allDayEvents) {
        const isMatch = ev.type === 'match' || ev.type === 'tournament'

        // Check if already logged
        const isLogged = isMatch
          ? matches.some((m) => m.date === dk && m.opponent === ev.opponent)
          : trainings.some((tr) => tr.date === dk && tr.fromSchedule === ev.id)

        if (!isLogged) {
          const dayLabel = isToday
            ? t('log.today')
            : daysBack === 1
            ? t('log.yesterday')
            : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

          result.push({ event: ev, isToday, dayLabel })
        }
      }
    }

    return result
  }, [schedule, recurringTrainings, matches, trainings, profile, t, today])

  function openFromPending(pe: PendingEvent) {
    const ev = pe.event
    const isMatch = ev.type === 'match' || ev.type === 'tournament'
    if (isMatch) {
      setPrefillData({
        date: ev.date,
        opponent: ev.opponent,
        competition: ev.competition,
        matchType: ev.matchType,
        playingFor: profile?.team || '',
        fromSchedule: ev.id,
      })
      setLogType('match')
    } else {
      const durationMinutes = ev.startTime && ev.endTime
        ? Math.max(30, Math.round((new Date(`2000-01-01T${ev.endTime}`).getTime() - new Date(`2000-01-01T${ev.startTime}`).getTime()) / 60000))
        : undefined
      setPrefillData({
        date: ev.date,
        type: ev.trainingType,
        durationMinutes,
        location: ev.location,
        fromSchedule: ev.id,
      })
      setLogType('training')
    }
  }

  if (logType === 'training') return <TrainingLog onBack={() => { setLogType('select'); setPrefillData({}) }} prefill={prefillData as { date?: string; type?: TrainingType; durationMinutes?: number; location?: string; fromSchedule?: string }} />
  if (logType === 'match') return <MatchLog onBack={() => { setLogType('select'); setPrefillData({}) }} prefill={prefillData as { date?: string; opponent?: string; competition?: string; matchType?: string; playingFor?: string; fromSchedule?: string }} />
  if (logType === 'diary') return <DiaryPage onBack={() => setLogType('select')} />

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('log.selectType')}</h2>

      {/* ── Pending events — today's plan + missed ── */}
      {pendingEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="section-label">{t('log.pending')}</p>
          {pendingEvents.map((pe) => {
            const ev = pe.event
            const isMatch = ev.type === 'match' || ev.type === 'tournament'
            const emoji = isMatch ? '🏟️' : '⚽'
            return (
              <button
                key={ev.id}
                className="card tap-target flex items-center gap-3 text-left"
                style={{
                  borderLeft: pe.isToday
                    ? '3px solid var(--color-primary-dark)'
                    : '3px solid var(--color-gold-500)',
                }}
                onClick={() => openFromPending(pe)}
              >
                <span className="text-2xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">
                      {ev.title}{ev.opponent ? ` vs ${ev.opponent}` : ''}
                    </p>
                    {!pe.isToday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold" style={{ background: '#fef3c7', color: '#b45309' }}>
                        {t('log.missed')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {pe.dayLabel} · {ev.startTime}{ev.location ? ` · ${ev.location}` : ''}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{
                  background: 'rgba(var(--color-primary-rgb), 0.12)',
                  color: 'var(--color-primary-dark)',
                }}>
                  {t('log.logNow')}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Manual log buttons ── */}
      {pendingEvents.length > 0 && (
        <p className="section-label mt-1">{t('log.orLogManually')}</p>
      )}

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('training')}
        aria-label={t('log.training')}
      >
        <span className="text-3xl">⚽</span>
        <div>
          <p className="text-base font-bold">{t('log.training')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+20 XP</p>
        </div>
      </button>

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('match')}
        aria-label={t('log.match')}
      >
        <span className="text-3xl">🏟️</span>
        <div>
          <p className="text-base font-bold">{t('log.match')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+30 XP</p>
        </div>
      </button>

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('diary')}
        aria-label={t('log.diary')}
      >
        <span className="text-3xl">📝</span>
        <div>
          <p className="text-base font-bold">{t('log.diary')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+15 XP</p>
        </div>
      </button>

      {/* Add Tournament */}
      <button
        className="card tap-target flex items-center gap-4 text-left"
        style={{ borderLeft: '3px solid var(--color-gold-500)' }}
        onClick={() => setShowImport(true)}
        aria-label={t('import.addTournament')}
      >
        <span className="text-3xl">🏆</span>
        <div>
          <p className="text-base font-bold">{t('import.addTournament')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('import.addTournamentHint')}</p>
        </div>
      </button>

      {showImport && <TournamentImport onClose={() => setShowImport(false)} />}

      {/* ── Motivational tip ── */}
      <div className="tip-card animate-fade-up" style={{ marginTop: 8 }}>
        <span className="tip-card-icon">💡</span>
        <div>
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('log.tipTitle')}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {t('log.tipText')}
          </p>
        </div>
      </div>
    </div>
  )
}
