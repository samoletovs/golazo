import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { RosterPlayer, AttendanceStatus } from '../engine/types'

interface AttendanceGridProps {
  teamId: string
  teamName: string
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

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/roster`)
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
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [teamId])

  function cycleStatus(playerId: string) {
    const order: AttendanceStatus[] = ['present', 'absent', 'excused', 'late']
    const current = attendance.get(playerId) ?? 'present'
    const nextIdx = (order.indexOf(current) + 1) % order.length
    const next = new Map(attendance)
    next.set(playerId, order[nextIdx])
    setAttendance(next)
  }

  function markAllPresent() {
    const all = new Map<string, AttendanceStatus>()
    for (const p of players) all.set(p.playerId, 'present')
    setAttendance(all)
  }

  async function save() {
    setSaving(true)
    try {
      const records: AttendanceEntry[] = players.map((p) => ({
        playerId: p.playerId,
        status: attendance.get(p.playerId) ?? 'present',
      }))
      await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, coachId, records }),
      })
    } catch { /* offline */ }
    finally { setSaving(false) }
  }

  const presentCount = [...attendance.values()].filter((s) => s === 'present' || s === 'late').length
  const totalCount = players.length
  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold heading-display">{t('coach.attendance.title')}</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teamName}</p>
        </div>
      </div>

      {/* Date + summary */}
      <div className="card animate-fade-up">
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm" />
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

      {/* Mark all button */}
      <button
        className="text-xs font-bold w-full text-center py-2 rounded-xl tap-target"
        style={{ background: 'var(--color-glass-hover)', color: 'var(--color-primary-dark)' }}
        onClick={markAllPresent}
      >
        ✅ {t('coach.attendance.markAll')}
      </button>

      {/* Player list with tap-to-cycle status */}
      {loading ? (
        <div className="text-center py-8">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
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
          {saving ? '...' : `✓ ${t('coach.eval.save')}`}
        </button>
      )}
    </div>
  )
}
