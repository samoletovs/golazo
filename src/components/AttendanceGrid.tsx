import { AcademyPage } from './academy/AcademyPage'
import { AcademyError, AcademyLoading } from './academy/AcademyState'
import { useState, useEffect, useMemo } from 'react'
import { useSquadSave } from '../hooks/useSquadSave'
import { SquadSaveStatus } from './academy/SquadSaveStatus'
import { useTranslation } from 'react-i18next'
import type { RosterPlayer, AttendanceStatus } from '../engine/types'

interface AttendanceGridProps {
  teamId: string
  teamName: string
  teamIds?: string[]
  teamNames?: Record<string, string>
  coachId: string
  onBack: () => void
}

interface AttendanceEntry {
  playerId: string
  status: AttendanceStatus
}

interface AttendancePlayer extends RosterPlayer { targetTeamId: string }
const attendanceKey = (player: AttendancePlayer) => `${player.targetTeamId}:${player.playerId}`

const STATUS_ICONS: Record<AttendanceStatus, string> = {
  present: '✅',
  absent: '❌',
  excused: '🟡',
  late: '⏰',
}

export function AttendanceGrid({ teamId, teamName, teamIds, teamNames, coachId, onBack }: AttendanceGridProps) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<AttendancePlayer[]>([])
  const targets = useMemo(() => [...new Set(teamIds?.length ? teamIds : [teamId])], [teamIds, teamId])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map())
  const { submit, saving, failed, confirmed, total, reset } = useSquadSave()
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(false)
      try {
        const groups = await Promise.all(targets.map(async targetTeamId => {
          const res = await fetch(`/api/coach/team/${encodeURIComponent(targetTeamId)}/roster`)
          if (!res.ok) throw new Error(`Attendance roster request failed: ${res.status}`)
          const data: { players?: RosterPlayer[] } = await res.json()
          return (data.players ?? []).map(player => ({ ...player, targetTeamId }))
        }))
        if (!cancelled) {
          const roster = groups.flat()
          setPlayers(roster)
          // Default all to present
          const initial = new Map<string, AttendanceStatus>()
          for (const p of roster) {
            initial.set(attendanceKey(p), 'present')
          }
          setAttendance(initial)
        }
      } catch (cause) { if (!cancelled) { console.error('Attendance roster could not be loaded:', cause); setLoadError(true) } }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [targets, attempt])

  function cycleStatus(playerId: string) {
    reset()
    setSaved(false)
    const order: AttendanceStatus[] = ['present', 'absent', 'excused', 'late']
    const current = attendance.get(playerId) ?? 'present'
    const nextIdx = (order.indexOf(current) + 1) % order.length
    const next = new Map(attendance)
    next.set(playerId, order[nextIdx])
    setAttendance(next)
  }

  function markAllPresent() {
    reset()
    setSaved(false)
    const all = new Map<string, AttendanceStatus>()
    for (const p of players) all.set(attendanceKey(p), 'present')
    setAttendance(all)
  }

  async function save() {
    setSaved(false)
    const success = await submit(targets, async targetId => {
      const records: AttendanceEntry[] = players.filter(player => player.targetTeamId === targetId).map((p) => ({
        playerId: p.playerId,
        status: attendance.get(attendanceKey(p)) ?? 'present',
      }))
      const response = await fetch(`/api/coach/team/${encodeURIComponent(targetId)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, coachId, records }),
      })
      if (!response.ok) throw new Error(`Attendance save failed: ${response.status}`)
    })
    if (success) setSaved(true)
  }

  const presentCount = [...attendance.values()].filter((s) => s === 'present' || s === 'late').length
  const totalCount = players.length
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <AcademyPage surface="components-attendance-grid" title={t('coach.attendance.title')} className="academy-support-page">
      {loadError && <AcademyError message={t('academy.loadError')} onRetry={() => setAttempt(value => value + 1)} />}
      <SquadSaveStatus confirmed={confirmed} total={total} failed={failed} />
      {saved && <p role="status" className="academy-complete-label">{t('academy.serverConfirmed')}</p>}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <div className="flex-1 min-w-0">

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teamName}</p>
        </div>
      </div>

      {/* Date + summary */}
      <fieldset className="academy-stack" disabled={saving || (failed && confirmed > 0)}>
      <div className="card animate-fade-up">
        <div className="flex items-center gap-3">
          <input type="date" aria-label={t('log.date')} value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); reset() }} className="text-sm" />
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
            const status = attendance.get(attendanceKey(player)) ?? 'present'
            return (
              <button
                key={attendanceKey(player)}
                className="flex items-center gap-3 p-3 rounded-xl tap-target text-left transition-all"
                style={{
                  background: status === 'present' ? 'var(--color-success-bg)' :
                    status === 'late' ? 'var(--color-amber-bg)' :
                    status === 'excused' ? 'var(--color-glass-hover)' : 'var(--color-error-bg)',
                }}
                onClick={() => cycleStatus(attendanceKey(player))}
              >
                <span className="text-lg shrink-0">{STATUS_ICONS[status]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{player.playerName}</p>
                  {targets.length > 1 && <small className="academy-muted">{teamNames?.[player.targetTeamId] ?? teamName}</small>}
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
      </fieldset>
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
