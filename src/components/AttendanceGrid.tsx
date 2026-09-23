import { AcademyPage } from './academy/AcademyPage'
import { AcademyError, AcademyLoading } from './academy/AcademyState'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { RosterPlayer, AttendanceStatus } from '../engine/types'

interface AttendanceGridProps {
  teamId: string
  teamName: string
  teamIds?: string[]
  coachId: string
  onBack: () => void
}

interface AttendanceEntry {
  playerId: string
  status: AttendanceStatus
}

const STATUS_ICONS: Record<AttendanceStatus, string> = {
  present: '✅',
  absent: '❌',
  excused: '🟡',
  late: '⏰',
}

export function AttendanceGrid({ teamId, teamName, coachId, onBack }: AttendanceGridProps) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<RosterPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const savingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(false)
      try {
        const res = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/roster`)
        if (!res.ok) throw new Error(`Attendance roster request failed: ${res.status}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          const roster: RosterPlayer[] = data.players ?? []
          setPlayers(roster)
          // Default all to present
          const initial = new Map<string, AttendanceStatus>()
          for (const p of roster) {
            initial.set(p.playerId, 'present')
          }
          setAttendance(initial)
        }
      } catch (cause) { if (!cancelled) { console.error('Attendance roster could not be loaded:', cause); setLoadError(true) } }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [teamId, attempt])

  function cycleStatus(playerId: string) {
    setSaved(false)
    const order: AttendanceStatus[] = ['present', 'absent', 'excused', 'late']
    const current = attendance.get(playerId) ?? 'present'
    const nextIdx = (order.indexOf(current) + 1) % order.length
    const next = new Map(attendance)
    next.set(playerId, order[nextIdx])
    setAttendance(next)
  }

  function markAllPresent() {
    setSaved(false)
    const all = new Map<string, AttendanceStatus>()
    for (const p of players) all.set(p.playerId, 'present')
    setAttendance(all)
  }

  async function save() {
    if (savingRef.current) return
    savingRef.current = true
    setSaveError(false)
    setSaved(false)
    setSaving(true)
    try {
      const records: AttendanceEntry[] = players.map((p) => ({
        playerId: p.playerId,
        status: attendance.get(p.playerId) ?? 'present',
      }))
      const response = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, coachId, records }),
      })
      if (!response.ok) throw new Error(`Attendance save failed: ${response.status}`)
      setSaved(true)
    } catch (cause) {
      console.error('Attendance was not confirmed:', cause)
      setSaveError(true)
    } finally { savingRef.current = false; setSaving(false) }
  }

  const presentCount = [...attendance.values()].filter((s) => s === 'present' || s === 'late').length
  const totalCount = players.length
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <AcademyPage surface="components-attendance-grid" title={t('coach.attendance.title')} className="academy-support-page">
      {loadError && <AcademyError message={t('academy.loadError')} onRetry={() => setAttempt(value => value + 1)} />}
      {saveError && <p role="alert" className="academy-error">{t('academy.remoteSaveError')}</p>}
      {saved && <p role="status" className="academy-complete-label">{t('academy.serverConfirmed')}</p>}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <div className="flex-1 min-w-0">

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teamName}</p>
        </div>
      </div>

      {/* Date + summary */}
      <div className="card animate-fade-up">
        <div className="flex items-center gap-3">
          <input type="date" aria-label={t('log.date')} value={date} onChange={(e) => { setDate(e.target.value); setSaved(false) }} className="text-sm" />
          <div className="flex-1 text-right">
            <span className="text-lg font-black font-data" style={{ color: 'var(--color-primary-dark)' }}>
              {presentCount}/{totalCount}
            </span>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('coach.attendance.rate', { pct })}
            </p>
          </div>
            </div>
          </div>
          <p className="academy-hint">{t('academy.attendanceDraft')}</p>

      {/* Mark all button */}
      <button
        className="text-xs font-bold w-full text-center py-2 rounded-xl tap-target"
        style={{ background: 'var(--color-glass-hover)', color: 'var(--color-primary-dark)' }}
        onClick={markAllPresent}
      >
        ✅ {t('coach.attendance.markAll')}
      </button>

      {/* Player list with tap-to-cycle status */}
      {loading ? <AcademyLoading /> : (
        <div className="academy-roster-grid">
          {players.map((player) => {
            const status = attendance.get(player.playerId) ?? 'present'
            return (
              <button
                key={player.playerId}
                className="flex items-center gap-3 p-3 rounded-xl tap-target text-left transition-all"
                style={{
                  background: status === 'present' ? 'var(--color-success-bg)' :
                    status === 'late' ? 'var(--color-amber-bg)' :
                    status === 'excused' ? 'var(--color-glass-hover)' : 'var(--color-error-bg)',
                }}
                onClick={() => cycleStatus(player.playerId)}
              >
                <span className="text-lg shrink-0">{STATUS_ICONS[status]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{player.playerName}</p>
                  {player.jerseyNumber && (
                    <span className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
                      #{player.jerseyNumber}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {t(`coach.attendance.${status}`)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Save */}
      {!loading && players.length > 0 && (
        <button
          className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
          onClick={save}
          disabled={saving}
        >
          {saving ? t('common.loading') : t('common.save')}
        </button>
      )}
    </AcademyPage>
  )
}
