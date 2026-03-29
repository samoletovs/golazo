import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { SkillRadar } from '../components/SkillRadar'
import { EmptyState } from '../components/EmptyState'
import { getMatchResult } from '../engine/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

export function ProgressPage() {
  const { t } = useTranslation()
  const { matches, trainings, xp, physicalProfile } = useApp()

  /* ── XP trend (last 30 days) ── */
  const xpTrend = useMemo(() => {
    const now = new Date()
    const days: { date: string; xp: number }[] = []
    let cumulative = 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const dayTrainings = trainings.filter((tr) => tr.date.startsWith(iso))
      const dayMatches = matches.filter((m) => m.date.startsWith(iso))
      cumulative += dayTrainings.length * 20 + dayMatches.length * 30
      days.push({ date: iso.slice(5), xp: cumulative })
    }
    return days
  }, [trainings, matches])

  /* ── Match results timeline ── */
  const matchResults = useMemo(() => {
    return matches
      .slice(-20)
      .map((m) => {
        const result = getMatchResult(m)
        return {
          opponent: m.opponent.slice(0, 8),
          value: result === 'win' ? 1 : result === 'draw' ? 0 : -1,
          result,
          goals: m.goals,
          assists: m.assists,
          rating: m.selfRating,
        }
      })
  }, [matches])

  /* ── Training frequency (last 8 weeks) ── */
  const trainingFrequency = useMemo(() => {
    const now = new Date()
    const weeks: { week: string; sessions: number }[] = []
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - w * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const count = trainings.filter((tr) => {
        const d = new Date(tr.date)
        return d >= weekStart && d < weekEnd
      }).length
      weeks.push({ week: `W${8 - w}`, sessions: count })
    }
    return weeks
  }, [trainings])

  /* ── Physical growth ── */
  const physicalData = useMemo(() => {
    if (!physicalProfile?.measurements.length) return []
    return physicalProfile.measurements.map((m) => ({
      date: m.measuredAt.slice(0, 7),
      height: m.heightCm,
      weight: m.weightKg,
      sprint: m.sprintTime100m,
      juggles: m.juggleRecord,
    }))
  }, [physicalProfile])

  /* ── Goals per match trend ── */
  const goalsTrend = useMemo(() => {
    return matches.slice(-15).map((m) => ({
      match: m.opponent.slice(0, 6),
      goals: m.goals,
      assists: m.assists,
      rating: m.selfRating,
    }))
  }, [matches])

  const resultColors = { win: '#16a34a', draw: '#f59e0b', loss: '#ef4444' }

  return (
    <div className="flex flex-col gap-5 p-4 pb-32">
      <h1 className="text-xl font-extrabold">{t('progress.title')}</h1>

      {matches.length === 0 && trainings.length === 0 && (
        <EmptyState
          icon="📈"
          titleKey="empty.progress.title"
          textKey="empty.progress.text"
        />
      )}

      {/* ── XP Trend ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.xpTrend')}</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={xpTrend}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="xp" stroke="#16a34a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Match Results Timeline ── */}
      {matchResults.length > 0 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.matchResults')}</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={matchResults}>
              <XAxis dataKey="opponent" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis domain={[-1, 1]} tick={false} width={10} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(_v: number, _n: string, p: { payload?: { result?: string; goals?: number; assists?: number; rating?: number } }) => {
                  const d = p.payload
                  if (!d) return ['']
                  return [`${(d.result ?? '').toUpperCase()} · ${d.goals ?? 0}G ${d.assists ?? 0}A · ${d.rating ?? 0}/10`]
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {matchResults.map((entry, i) => (
                  <Cell key={i} fill={resultColors[entry.result as keyof typeof resultColors]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#16a34a' }} /> {t('progress.win')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> {t('progress.draw')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#ef4444' }} /> {t('progress.loss')}</span>
          </div>
        </div>
      )}

      {/* ── Training Frequency ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.trainingFrequency')}</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={trainingFrequency}>
            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} width={20} allowDecimals={false} />
            <Bar dataKey="sessions" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Goals & Assists Trend ── */}
      {goalsTrend.length > 0 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.goalsTrend')}</h2>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={goalsTrend}>
              <XAxis dataKey="match" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="goals" stroke="#16a34a" strokeWidth={2} name={t('progress.goals')} />
              <Line type="monotone" dataKey="assists" stroke="#0ea5e9" strokeWidth={2} name={t('progress.assists')} />
              <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" name={t('progress.selfRating')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Skill Radar ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.skillRadar')}</h2>
        <SkillRadar />
      </div>

      {/* ── Physical Growth ── */}
      {physicalData.length > 0 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.physicalGrowth')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={physicalData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={35} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="height" stroke="#8b5cf6" strokeWidth={2} name={t('progress.height')} />
              <Line type="monotone" dataKey="juggles" stroke="#16a34a" strokeWidth={2} name={t('progress.juggles')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Streak History ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.streakHistory')}</h2>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-black font-data text-gradient-fire">{xp.streakDays}</span>
          <div>
            <p className="text-sm font-bold">{t('progress.currentStreak')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('progress.streakHint')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up">
        <div className="stat-card stat-card-green">
          <p className="text-3xl font-black font-data text-gradient-green">{trainings.length}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('progress.totalTrainings')}</p>
        </div>
        <div className="stat-card stat-card-gold">
          <p className="text-3xl font-black font-data text-gradient-gold">{matches.length}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('progress.totalMatches')}</p>
        </div>
        <div className="stat-card stat-card-cyan">
          <p className="text-3xl font-black font-data text-gradient-green">{matches.reduce((s, m) => s + m.goals, 0)}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('progress.totalGoals')}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-3xl font-black font-data text-gradient-gold">
            {xp.totalXp.toLocaleString()}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('progress.totalXp')}</p>
        </div>
      </div>
    </div>
  )
}
