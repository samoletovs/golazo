import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ManagedSquad, Announcement } from '../engine/types'

interface CoachDashboardProps {
  squads: ManagedSquad[]
  onNavigate: (page: 'roster' | 'training' | 'announce' | 'evaluate' | 'attendance', squadId: string) => void
  onManageSquads: () => void
}

interface SquadStats {
  rosterCount: number
  avgMood: number | null
  attendanceRate: number | null
  nextEventTitle: string | null
  nextEventDate: string | null
  alerts: { type: 'warning' | 'info'; icon: string; message: string }[]
  recentAnnouncements: Announcement[]
}

export function CoachDashboard({ squads, onNavigate, onManageSquads }: CoachDashboardProps) {
  const { t } = useTranslation()
  const [selectedSquadId, setSelectedSquadId] = useState(squads[0]?.squadId ?? '')
  const [stats, setStats] = useState<SquadStats | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedSquad = squads.find((s) => s.squadId === selectedSquadId)

  useEffect(() => {
    if (!selectedSquadId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/coach/squad/${encodeURIComponent(selectedSquadId)}/stats`)
        if (res.ok && !cancelled) {
          setStats(await res.json())
        } else if (!cancelled) {
          setStats({ rosterCount: 0, avgMood: null, attendanceRate: null, nextEventTitle: null, nextEventDate: null, alerts: [], recentAnnouncements: [] })
        }
      } catch {
        if (!cancelled) setStats({ rosterCount: 0, avgMood: null, attendanceRate: null, nextEventTitle: null, nextEventDate: null, alerts: [], recentAnnouncements: [] })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedSquadId])

  const moodEmoji = useMemo(() => {
    if (!stats?.avgMood) return '—'
    if (stats.avgMood >= 4) return '🔥'
    if (stats.avgMood >= 3) return '🙂'
    if (stats.avgMood >= 2) return '😐'
    return '😟'
  }, [stats?.avgMood])

  if (squads.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-32">
        <h2 className="text-xl font-extrabold heading-display">📋 {t('coach.dashboard.title')}</h2>
        <div className="card text-center py-8 animate-fade-up">
          <span className="text-5xl mb-3 block">🏟️</span>
          <p className="text-sm font-bold mb-2">{t('coach.dashboard.noSquads')}</p>
          <button
            className="btn-primary text-sm px-4 py-2 rounded-xl tap-target mt-2"
            onClick={onManageSquads}
          >
            {t('coach.onboarding.selectSquads')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold heading-display">📋 {t('coach.dashboard.title')}</h2>
      </div>

      {/* Squad selector */}
      {squads.length > 1 && (
        <div className="h-scroll gap-2">
          {squads.map((sq) => (
            <button
              key={sq.squadId}
              className="text-xs font-bold px-4 py-2 rounded-full shrink-0 tap-target transition-all"
              style={{
                background: sq.squadId === selectedSquadId ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
                color: sq.squadId === selectedSquadId ? '#fff' : 'var(--color-text-muted)',
              }}
              onClick={() => setSelectedSquadId(sq.squadId)}
            >
              {sq.squadName}
            </button>
          ))}
        </div>
      )}

      {/* Squad header */}
      {selectedSquad && (
        <div className="card animate-fade-up">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚽</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate heading-display">{selectedSquad.squadName}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t(`coach.role.${selectedSquad.role}`)}
              </p>
            </div>
          </div>

          {/* Stats row */}
          {!loading && stats && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">{stats.rosterCount}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.players')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">{moodEmoji}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.avgMood')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">
                  {stats.attendanceRate !== null && stats.attendanceRate !== undefined ? `${stats.attendanceRate}%` : '—'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.attendance')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-sm font-bold truncate">{stats.nextEventTitle ?? '—'}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.nextEvent')}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {stats && stats.alerts.length > 0 && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">{t('coach.dashboard.alerts')}</p>
          <div className="flex flex-col gap-2">
            {stats.alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-xl"
                style={{ background: alert.type === 'warning' ? 'var(--color-error-bg)' : 'var(--color-glass-hover)' }}>
                <span className="text-sm shrink-0">{alert.icon}</span>
                <p className="text-xs" style={{ color: alert.type === 'warning' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.alerts.length === 0 && !loading && (
        <div className="card text-center py-3 animate-fade-up">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.noAlerts')}</p>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="section-label mb-2">{t('coach.dashboard.quickActions')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('roster', selectedSquadId)}
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs font-bold">{t('coach.roster.title')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('training', selectedSquadId)}
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs font-bold">{t('coach.dashboard.planTraining')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('announce', selectedSquadId)}
          >
            <span className="text-2xl">📢</span>
            <span className="text-xs font-bold">{t('coach.dashboard.announce')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('evaluate', selectedSquadId)}
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs font-bold">{t('coach.dashboard.evaluate')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('attendance', selectedSquadId)}
          >
            <span className="text-2xl">✅</span>
            <span className="text-xs font-bold">{t('coach.attendance.title')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('training', selectedSquadId)}
          >
            <span className="text-2xl">⚽</span>
            <span className="text-xs font-bold">{t('coach.dashboard.scheduleMatch')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
