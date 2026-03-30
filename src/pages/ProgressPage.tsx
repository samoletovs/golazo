import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { SkillRadar } from '../components/SkillRadar'
import { EmptyState } from '../components/EmptyState'
import { getMatchResult } from '../engine/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart, CartesianGrid } from 'recharts'

export function ProgressPage() {
  const { t } = useTranslation()
  const { matches, trainings, xp, physicalProfile, checkIns } = useApp()

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
      sittingHeight: m.sittingHeightCm,
      shoeSize: m.shoeSize,
      sprint10: m.sprintTime10m,
      sprint20: m.sprintTime20m,
      sprint30: m.sprintTime30m,
      jump: m.standingJumpCm,
      cmj: m.cmjCm,
      verticalJump: m.verticalJumpCm,
      yoyo: m.yoyoIR1Level,
      agility: m.agilityCourseTime,
      plank: m.plankTimeSec,
      sitAndReach: m.sitAndReachCm,
      pushUps: m.pushUps1min,
      hr: m.restingHeartRate,
      bodyFat: m.bodyFatPct,
      armSpan: m.armSpanCm,
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

  /* ── Mood & Energy trends (from check-ins, last 30 days) ── */
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

  /* ── Mood vs Performance correlation ── */
  const moodPerformance = useMemo(() => {
    return matches.slice(-20).map((m) => {
      // Find check-in on match day
      const ci = checkIns.find((c) => c.date === m.date.slice(0, 10))
      return {
        match: m.opponent.slice(0, 6),
        mood: ci?.mood ?? m.mood,
        rating: m.selfRating,
        goals: m.goals,
      }
    })
  }, [matches, checkIns])

  /* ── Burnout / Overtraining Risk ── */
  const burnoutRisk = useMemo(() => {
    const recent7 = checkIns.filter((c) => {
      const d = new Date(c.date)
      return d.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    })
    if (recent7.length < 3) return null // not enough data
    const avgEnergy = recent7.reduce((s, c) => s + c.energy, 0) / recent7.length
    const avgMood = recent7.reduce((s, c) => s + c.mood, 0) / recent7.length
    const recentTrainings7 = trainings.filter((tr) => {
      const d = new Date(tr.date)
      return d.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    })
    const trainDays = recentTrainings7.length
    // Declining energy + high frequency = overtraining risk
    const decliningEnergy = recent7.length >= 3 &&
      recent7.slice(-3).every((c) => c.energy <= 2)
    const highFreq = trainDays >= 6
    if (decliningEnergy && highFreq) return { level: 'high' as const, avgEnergy, avgMood, trainDays }
    if (avgEnergy < 2.5 || avgMood < 2.5) return { level: 'medium' as const, avgEnergy, avgMood, trainDays }
    return { level: 'low' as const, avgEnergy, avgMood, trainDays }
  }, [checkIns, trainings])

  return (
    <div className="flex flex-col gap-5 p-4 pb-32">
      <h1 className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{t('progress.title')}</h1>

      {matches.length === 0 && trainings.length === 0 && (
        <EmptyState
          icon="📈"
          titleKey="empty.progress.title"
          textKey="empty.progress.text"
        />
      )}

      {/* ── XP Trend (gradient area) ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.xpTrend')}</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={xpTrend}>
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={35} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontFamily: 'var(--font-data)' }}
              cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area type="monotone" dataKey="xp" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#xpGradient)" dot={false} activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Match Results Timeline ── */}
      {/* ── Match Results (card row) ── */}
      {matches.length > 0 && (
        <div className="animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.matchResults')}</h2>
          <div className="h-scroll">
            {matches.slice(-12).reverse().map((m) => {
              const result = getMatchResult(m)
              const bg = result === 'win' ? '#f0fdf4' : result === 'loss' ? '#fef2f2' : '#fffbeb'
              const color = result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? '#dc2626' : '#d97706'
              return (
                <div key={m.id} className="match-card-h" style={{ background: bg, width: 180 }} data-result={result}>
                  <p className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>
                    {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {m.opponent}
                  </p>
                  <p className="stat-number mt-1" style={{ fontSize: '1.25rem', color }}>
                    {m.scoreUs} : {m.scoreThem}
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    {m.goals > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary-dark)' }}>⚽{m.goals}</span>}
                    {m.assists > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.1)', color: '#0284c7' }}>🎯{m.assists}</span>}
                    {m.selfRating > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>★{m.selfRating}</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-4 mt-3">
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} /> {t('progress.win')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> {t('progress.draw')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#ef4444' }} /> {t('progress.loss')}</span>
          </div>
        </div>
      )}

      {/* ── Training Frequency ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.trainingFrequency')}</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={trainingFrequency} barCategoryGap="25%">
            <defs>
              <linearGradient id="trainingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={20} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="sessions" fill="url(#trainingGradient)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Goals & Assists Trend ── */}
      {goalsTrend.length > 0 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.goalsTrend')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={goalsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="match" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={20} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="goals" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.goals')} />
              <Line type="monotone" dataKey="assists" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} name={t('progress.assists')} />
              <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={t('progress.selfRating')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Skill Radar ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.skillRadar')}</h2>
        <SkillRadar />
      </div>

      {/* ── Burnout Risk Indicator ── */}
      {burnoutRisk && burnoutRisk.level !== 'low' && (
        <div
          className="card animate-fade-up flex items-center gap-3"
          style={{
            background: burnoutRisk.level === 'high' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${burnoutRisk.level === 'high' ? '#fecaca' : '#fde68a'}`,
          }}
        >
          <span className="text-2xl">{burnoutRisk.level === 'high' ? '🔴' : '🟡'}</span>
          <div>
            <p className="text-sm font-bold">
              {burnoutRisk.level === 'high'
                ? t('progress.burnoutHigh')
                : t('progress.burnoutMedium')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {t('progress.burnoutDetail', {
                energy: burnoutRisk.avgEnergy.toFixed(1),
                mood: burnoutRisk.avgMood.toFixed(1),
                sessions: burnoutRisk.trainDays,
              })}
            </p>
          </div>
        </div>
      )}

      {/* ── Mood & Energy Trend ── */}
      {moodTrend.length > 2 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.moodTrend')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={20} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} name={t('checkin.mood')} />
              <Line type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} name={t('checkin.energy')} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> {t('checkin.mood')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} /> {t('checkin.energy')}</span>
          </div>
        </div>
      )}

      {/* ── Mood vs Performance ── */}
      {moodPerformance.length > 2 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.moodPerformance')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="match" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={20} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} name={t('checkin.mood')} />
              <Line type="monotone" dataKey="rating" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.selfRating')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Physical Growth ── */}
      {physicalData.length > 0 && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('progress.physicalGrowth')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={physicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={35} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="height" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} name={t('progress.height')} />
              <Line type="monotone" dataKey="juggles" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.juggles')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Streak History (bold number) ── */}
      <div className="card animate-fade-up">
        <h2 className="text-sm font-bold mb-3">{t('progress.streakHistory')}</h2>
        <div className="flex items-center gap-4">
          <span className="stat-number text-gradient-fire" style={{ fontSize: '3rem' }}>{xp.streakDays}</span>
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
          <p className="stat-number text-gradient-green">{trainings.length}</p>
          <p className="stat-label">{t('progress.totalTrainings')}</p>
        </div>
        <div className="stat-card stat-card-gold">
          <p className="stat-number text-gradient-gold">{matches.length}</p>
          <p className="stat-label">{t('progress.totalMatches')}</p>
        </div>
        <div className="stat-card stat-card-cyan">
          <p className="stat-number text-gradient-green">{matches.reduce((s, m) => s + m.goals, 0)}</p>
          <p className="stat-label">{t('progress.totalGoals')}</p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="stat-number text-gradient-gold">
            {xp.totalXp.toLocaleString()}
          </p>
          <p className="stat-label">{t('progress.totalXp')}</p>
        </div>
      </div>
    </div>
  )
}
