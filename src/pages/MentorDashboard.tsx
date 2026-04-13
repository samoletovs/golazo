import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { getMatchResult } from '../engine/types'
import { AnnouncementFeed } from '../components/AnnouncementFeed'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface MenteeInfo {
  id: string
  name: string
  photoUrl?: string
}

/**
 * Mentor Dashboard — parent's wellbeing-focused home page.
 * PRIVACY: parents see trends, NOT diary content.
 * Aligned with UEFA/FA Respect + Dan Abrahams sport psychology.
 */
export function MentorDashboard() {
  const { t } = useTranslation()
  const { checkIns, trainings, matches, xp, profile } = useApp()

  const playerName = profile?.name?.split(' ')[0] ?? ''

  // Mentee management
  const [mentees, setMentees] = useState<MenteeInfo[]>([])
  const [activeMenteeId, setActiveMenteeId] = useState<string | null>(null)
  const [showAddMentee, setShowAddMentee] = useState(false)
  const [menteeSearchQuery, setMenteeSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MenteeInfo[]>([])
  const [searching, setSearching] = useState(false)

  // Load mentee list from profile
  useEffect(() => {
    if (!profile?.menteeIds?.length) return
    async function loadMentees() {
      try {
        const res = await fetch(`/api/mentor/mentees?ids=${encodeURIComponent(profile!.menteeIds!.join(','))}`)
        if (res.ok) {
          const data = await res.json()
          setMentees(data.mentees ?? [])
        }
      } catch { /* offline */ }
    }
    loadMentees()
  }, [profile?.menteeIds?.join(',')])

  // Search for players to add as mentees
  async function searchPlayers() {
    if (!menteeSearchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/mentor/search-players?q=${encodeURIComponent(menteeSearchQuery.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.players ?? [])
      }
    } catch { /* offline */ }
    finally { setSearching(false) }
  }

  /* ── Mood/Energy trend (last 30 days) ── */
  const moodTrend = useMemo(() => {
    const now = new Date()
    const days: { date: string; mood: number | null; energy: number | null }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const ci = checkIns.find((c) => c.date === iso)
      days.push({
        date: iso.slice(5),
        mood: ci?.mood ?? null,
        energy: ci?.energy ?? null,
      })
    }
    return days.filter((d) => d.mood !== null)
  }, [checkIns])

  /* ── Training consistency (last 4 weeks) ── */
  const weeklyActivity = useMemo(() => {
    const now = new Date()
    const weeks: { week: string; trainings: number; matches: number }[] = []
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - w * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const inRange = (date: string) => {
        const d = new Date(date)
        return d >= weekStart && d < weekEnd
      }
      weeks.push({
        week: `W${4 - w}`,
        trainings: trainings.filter((tr) => inRange(tr.date)).length,
        matches: matches.filter((m) => inRange(m.date)).length,
      })
    }
    return weeks
  }, [trainings, matches])

  /* ── Alerts: concerning patterns ── */
  const alerts = useMemo(() => {
    const result: { type: 'warning' | 'info'; icon: string; message: string }[] = []
    const recent7 = checkIns.filter((c) => {
      const d = new Date(c.date)
      return d.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    })

    // 3+ consecutive low mood days
    if (recent7.length >= 3) {
      const last3 = recent7.slice(-3)
      if (last3.every((c) => c.mood <= 2)) {
        result.push({
          type: 'warning',
          icon: '⚠️',
          message: t('mentor.dashboard.alertLowMood', { name: playerName || 'Your player' }),
        })
      }
    }

    // Low energy + high training = burnout risk
    if (recent7.length >= 3) {
      const avgEnergy = recent7.reduce((s, c) => s + c.energy, 0) / recent7.length
      const recentTrainings = trainings.filter((tr) =>
        new Date(tr.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      )
      if (avgEnergy < 2.5 && recentTrainings.length >= 5) {
        result.push({
          type: 'warning',
          icon: '🔴',
          message: t('mentor.dashboard.alertBurnout', { energy: avgEnergy.toFixed(1), sessions: recentTrainings.length }),
        })
      }
    }

    // No check-ins for 3+ days
    if (checkIns.length > 0) {
      const lastCheckIn = checkIns[checkIns.length - 1]
      const daysSince = Math.floor((Date.now() - new Date(lastCheckIn.date).getTime()) / (24 * 60 * 60 * 1000))
      if (daysSince >= 3) {
        result.push({
          type: 'info',
          icon: 'ℹ️',
          message: t('mentor.dashboard.alertInactive', { days: daysSince }),
        })
      }
    }

    return result
  }, [checkIns, trainings, t, playerName])

  /* ── Summary stats ── */
  const recentCheckIns = checkIns.filter((c) =>
    new Date(c.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  )
  const avgMood7 = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((s, c) => s + c.mood, 0) / recentCheckIns.length).toFixed(1)
    : '—'
  const avgEnergy7 = recentCheckIns.length > 0
    ? (recentCheckIns.reduce((s, c) => s + c.energy, 0) / recentCheckIns.length).toFixed(1)
    : '—'

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      {/* Mentee picker — shown when mentor has linked players */}
      {mentees.length > 0 && (
        <div className="flex gap-2 overflow-x-auto h-scroll pb-1">
          {mentees.map((m: MenteeInfo) => (
            <button
              key={m.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 tap-target transition-all"
              style={{
                background: activeMenteeId === m.id ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)',
                color: activeMenteeId === m.id ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                border: activeMenteeId === m.id ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
              }}
              onClick={() => setActiveMenteeId(activeMenteeId === m.id ? null : m.id)}
            >
              {m.photoUrl ? (
                <img src={m.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span>⚽</span>
              )}
              {m.name.split(' ')[0]}
            </button>
          ))}
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 tap-target"
            style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-muted)' }}
            onClick={() => setShowAddMentee(true)}
          >
            + {t('mentor.addPlayer')}
          </button>
        </div>
      )}

      {/* Add mentee search overlay */}
      {showAddMentee && (
        <div className="card animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold">{t('mentor.addPlayer')}</p>
            <button className="tap-target text-xs" onClick={() => { setShowAddMentee(false); setSearchResults([]); setMenteeSearchQuery('') }}>✕</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={menteeSearchQuery}
              onChange={(e) => setMenteeSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
              placeholder={t('mentor.searchPlayer')}
              className="flex-1 text-sm"
            />
            <button className="btn-primary text-xs px-3" onClick={searchPlayers} disabled={searching}>
              {searching ? '...' : t('common.search')}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {searchResults.map((p: MenteeInfo) => (
                <button
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-left tap-target"
                  style={{ background: 'var(--color-glass-hover)' }}
                  onClick={() => {
                    setMentees((prev: MenteeInfo[]) => [...prev, p])
                    setShowAddMentee(false)
                    setSearchResults([])
                    setMenteeSearchQuery('')
                  }}
                >
                  <span className="text-sm">⚽</span>
                  <span className="text-sm font-bold">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No mentees — show add button */}
      {mentees.length === 0 && !showAddMentee && (
        <div className="card text-center py-6 animate-fade-up">
          <span className="text-4xl mb-2 block">👨‍👧‍👦</span>
          <p className="text-sm font-bold mb-1">{t('mentor.noMentees')}</p>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('mentor.noMenteesHint')}</p>
          <button className="btn-primary text-sm px-4 py-2 rounded-xl" onClick={() => setShowAddMentee(true)}>
            + {t('mentor.addPlayer')}
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold heading-display">
          {t('mentor.title')}
        </h2>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {playerName ? t('mentor.dashboard.subtitle', { name: playerName }) : ''}
        </p>
      </div>

      {/* Wellbeing status card */}
      {recentCheckIns.length > 0 ? (() => {
        const latest = checkIns[checkIns.length - 1]
        const moodNum = Number(avgMood7)
        const statusColor = moodNum >= 3.5 ? 'var(--color-primary-dark)' : moodNum >= 2.5 ? 'var(--color-amber-text)' : 'var(--color-danger)'
        const statusBg = moodNum >= 3.5 ? 'var(--color-success-bg)' : moodNum >= 2.5 ? 'var(--color-amber-bg)' : 'var(--color-error-bg)'
        const statusEmoji = moodNum >= 4 ? '🔥' : moodNum >= 3 ? '🙂' : moodNum >= 2 ? '😐' : '😟'
        return (
          <div className="card animate-fade-up" style={{ background: statusBg }}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{statusEmoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: statusColor }}>
                  {moodNum >= 3.5 ? t('mentor.status.good') : moodNum >= 2.5 ? t('mentor.status.attention') : t('mentor.status.concern')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {t('mentor.status.lastCheckin')}: {new Date(latest.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )
      })() : (
        <div className="card animate-fade-up text-center py-4"
          style={{ background: 'var(--color-amber-bg)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--color-amber-text)' }}>
            {t('mentor.status.noCheckin')}
          </p>
        </div>
      )}

      {/* Privacy notice */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(var(--color-info-rgb, 59, 130, 246), 0.06)', border: '1px solid rgba(var(--color-info-rgb, 59, 130, 246), 0.2)' }}>
        <span className="text-sm">🔒</span>
        <p className="text-xs" style={{ color: 'var(--color-info)' }}>
          {t('mentor.privacy')}
        </p>
      </div>

      {/* Coach announcements (for parents) */}
      <AnnouncementFeed />

      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="card flex items-start gap-3 animate-fade-up"
          style={{
            background: alert.type === 'warning' ? 'var(--color-error-bg)' : 'rgba(var(--color-info-rgb, 59, 130, 246), 0.06)',
            border: `1px solid ${alert.type === 'warning' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
          }}
        >
          <span className="text-xl">{alert.icon}</span>
          <p className="text-sm" style={{ color: alert.type === 'warning' ? 'var(--color-danger)' : 'var(--color-info)' }}>
            {alert.message}
          </p>
        </div>
      ))}

      {/* Weekly summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card stat-card-gold">
          <p className="stat-number stat-number-sm" style={{ color: 'var(--color-amber-text)' }}>{avgMood7}</p>
          <p className="stat-label">{t('mentor.avgMood')}</p>
        </div>
        <div className="stat-card stat-card-cyan">
            <p className="stat-number stat-number-sm" style={{ color: 'var(--color-primary-light)' }}>{avgEnergy7}</p>
          <p className="stat-label">{t('mentor.avgEnergy')}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="stat-number stat-number-sm" style={{ color: 'var(--color-primary-dark)' }}>{xp.streakDays}</p>
          <p className="stat-label">{t('mentor.streak')}</p>
        </div>
      </div>

      {/* Mood trend chart */}
      {moodTrend.length > 2 && (
        <div className="card animate-fade-up">
          <h3 className="text-sm font-bold mb-3">{t('mentor.moodTrend')}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-field-input)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={20} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="mood" stroke="var(--color-gold-500)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-gold-500)', stroke: '#fff', strokeWidth: 2 }} name="Mood" />
              <Line type="monotone" dataKey="energy" stroke="var(--color-primary-light)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary-light)', stroke: '#fff', strokeWidth: 2 }} name="Energy" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Training consistency */}
      <div className="card animate-fade-up">
        <h3 className="text-sm font-bold mb-3">{t('mentor.activity')}</h3>
        <div className="flex flex-col gap-2">
          {weeklyActivity.map((w) => (
            <div key={w.week} className="flex items-center gap-3">
              <span className="text-xs font-data font-bold w-8" style={{ color: 'var(--color-text-muted)' }}>{w.week}</span>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: Math.max(w.trainings + w.matches, 0) }, (_, i) => (
                  <div
                    key={i}
                    className="h-6 rounded"
                    style={{
                      width: 24,
                      background: i < w.trainings ? 'var(--color-primary)' : 'var(--color-primary-light)',
                    }}
                  />
                ))}
                {w.trainings + w.matches === 0 && (
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                )}
              </div>
              <span className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
                {w.trainings + w.matches}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded" style={{ background: 'var(--color-primary)' }} /> {t('log.training')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded" style={{ background: 'var(--color-primary-light)' }} /> {t('log.match')}</span>
        </div>
      </div>

      {/* No check-in data */}
      {moodTrend.length === 0 && (
        <div className="text-center py-8">
          <span className="text-3xl">📊</span>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {t('mentor.noData')}
          </p>
        </div>
      )}

      {/* Recent matches */}
      {matches.length > 0 && (
        <div className="card animate-fade-up">
          <h3 className="text-sm font-bold mb-3">{t('mentor.recentMatches')}</h3>
          <div className="flex flex-col gap-2">
            {[...matches].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((m) => {
              const result = getMatchResult(m)
              const resultColor = result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? 'var(--color-danger)' : 'var(--color-amber-text)'
              return (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-center text-sm font-bold" style={{ color: resultColor }}>
                    {result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{m.opponent}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(m.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-black font-data">{m.scoreUs}:{m.scoreThem}</span>
                  {m.goals > 0 && <span className="text-xs">⚽{m.goals}</span>}
                  {m.assists > 0 && <span className="text-xs">🎯{m.assists}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
