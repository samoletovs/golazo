import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { SkillRadar } from '../components/SkillRadar'
import { EmptyState } from '../components/EmptyState'
import { getMatchResult, getAgeTier } from '../engine/types'
import { getTrackedFieldConfigs } from '../engine/physical'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart, CartesianGrid } from 'recharts'

export function ProgressPage() {
  const { t } = useTranslation()
  const { matches, trainings, physicalProfile, checkIns, profile } = useApp()

  // Which physical fields are being tracked (respects player customization)
  const trackedKeys = useMemo(() => {
    const tier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
    const fields = getTrackedFieldConfigs(physicalProfile, tier)
    return new Set(fields.map((f) => f.key as string))
  }, [physicalProfile, profile])

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

  /* ── Physical growth — grouped data ── */
  const physicalData = useMemo(() => {
    if (!physicalProfile?.measurements.length) return []
    return physicalProfile.measurements.map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      height: m.heightCm || null,
      weight: m.weightKg || null,
      bmi: m.heightCm && m.weightKg ? Math.round((m.weightKg / ((m.heightCm / 100) ** 2)) * 10) / 10 : null,
      sprint10: m.sprintTime10m || null,
      sprint20: m.sprintTime20m || null,
      sprint30: m.sprintTime30m || null,
      jump: m.standingJumpCm || null,
      cmj: m.cmjCm || null,
      verticalJump: m.verticalJumpCm || null,
      yoyo: m.yoyoIR1Level || null,
      agility: m.agilityCourseTime || null,
      plank: m.plankTimeSec || null,
      juggles: m.juggleRecord || null,
    }))
  }, [physicalProfile])

  // Map chart data keys back to PhysicalMeasurement field keys
  const chartKeyToFieldKey: Record<string, string> = {
    height: 'heightCm', weight: 'weightKg', bmi: 'heightCm',
    sprint10: 'sprintTime10m', sprint20: 'sprintTime20m', sprint30: 'sprintTime30m',
    jump: 'standingJumpCm', cmj: 'cmjCm', verticalJump: 'verticalJumpCm',
    yoyo: 'yoyoIR1Level', agility: 'agilityCourseTime',
    plank: 'plankTimeSec', juggles: 'juggleRecord',
  }

  const hasPhysicalField = (key: string) => {
    const fieldKey = chartKeyToFieldKey[key]
    if (fieldKey && !trackedKeys.has(fieldKey)) return false // not tracked → hide
    return physicalData.some((d) => (d as Record<string, unknown>)[key] !== null && (d as Record<string, unknown>)[key] !== undefined)
  }

  // Check if any field in a group is tracked (show chart section if at least one field is tracked)
  const isGroupTracked = (keys: string[]) => keys.some((k) => trackedKeys.has(chartKeyToFieldKey[k] ?? k))

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
      <h2 className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{t('progress.title')}</h2>

      {matches.length === 0 && trainings.length === 0 && (
        <EmptyState
          icon="📈"
          titleKey="empty.progress.title"
          textKey="empty.progress.text"
        />
      )}

      {/* ── Match Results (card row) ── */}
      {matches.length > 0 && (
        <div className="animate-fade-up">
          <p className="section-label mb-2">{t('progress.matchResults')}</p>
          <div className="h-scroll">
            {matches.slice(-12).reverse().map((m) => {
              const result = getMatchResult(m)
              const bg = result === 'win' ? 'var(--color-success-bg)' : result === 'loss' ? 'var(--color-error-bg)' : 'var(--color-amber-bg)'
              const color = result === 'win' ? 'var(--color-primary-dark)' : result === 'loss' ? 'var(--color-danger)' : 'var(--color-amber-text)'
              return (
                <div key={m.id} className="match-card-h" style={{ background: bg, width: 180 }} data-result={result}>
                  <p className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
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
                    {m.assists > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(var(--color-primary-rgb), 0.08)', color: 'var(--color-primary-light)' }}>🎯{m.assists}</span>}
                    {m.selfRating > 0 && <span className="text-[9px] font-data font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(var(--color-gold-rgb), 0.1)', color: 'var(--color-amber-text)' }}>★{m.selfRating}</span>}
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

      {/* ── Goals & Assists Trend ── */}
      {goalsTrend.length > 0 && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">{t('progress.goalsTrend')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={goalsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="match" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={20} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="goals" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.goals')} />
              <Line type="monotone" dataKey="assists" stroke="var(--color-primary-light)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary-light)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.assists')} />
              <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name={t('progress.selfRating')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── XP Trend (gradient area) ── */}
      <div className="card animate-fade-up">
        <p className="section-label mb-2">{t('progress.xpTrend')}</p>
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

      {/* ── Training Frequency ── */}
      <div className="card animate-fade-up">
        <p className="section-label mb-2">{t('progress.trainingFrequency')}</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={trainingFrequency} barCategoryGap="25%">
            <defs>
              <linearGradient id="trainingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--color-primary-light)" stopOpacity={0.7} />
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

      {/* ── Skill Radar ── */}
      <div className="card animate-fade-up">
        <p className="section-label mb-2">{t('progress.skillRadar')}</p>
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
          <p className="section-label mb-2">{t('progress.moodTrend')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={moodTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={20} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} name={t('checkin.mood')} />
              <Line type="monotone" dataKey="energy" stroke="var(--color-primary-light)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary-light)', stroke: '#fff', strokeWidth: 2 }} name={t('checkin.energy')} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> {t('checkin.mood')}</span>
            <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-primary-light)' }} /> {t('checkin.energy')}</span>
          </div>
        </div>
      )}

      {/* ── Mood vs Performance ── */}
      {moodPerformance.length > 2 && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">{t('progress.moodPerformance')}</p>
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

      {/* ── Physical: Body Growth (Height + Weight + BMI) ── */}
      {physicalData.length > 0 && (hasPhysicalField('height') || hasPhysicalField('weight')) && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">📏 {t('progress.bodyGrowth')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={physicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              {hasPhysicalField('height') && <Line yAxisId="left" type="monotone" dataKey="height" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} name={t('progress.height')} connectNulls />}
              {hasPhysicalField('weight') && <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} name={t('progress.weight')} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {hasPhysicalField('height') && <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} /> {t('progress.height')}</span>}
            {hasPhysicalField('weight') && <span className="text-xs flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> {t('progress.weight')}</span>}
          </div>
          {/* BMI derived stat */}
          {hasPhysicalField('bmi') && (() => {
            const latest = physicalData[physicalData.length - 1]
            return latest?.bmi ? (
              <div className="flex items-center justify-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>BMI</span>
                <span className="text-sm font-black font-data">{latest.bmi}</span>
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* ── Physical: Speed & Power ── */}
      {physicalData.length > 0 && isGroupTracked(['sprint10', 'sprint20', 'sprint30', 'jump', 'cmj', 'verticalJump']) && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">⚡ {t('progress.speedPower')}</p>
          {hasPhysicalField('sprint10') || hasPhysicalField('sprint20') || hasPhysicalField('cmj') || hasPhysicalField('jump') ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={physicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              {hasPhysicalField('sprint10') && <Line type="monotone" dataKey="sprint10" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} name={t('physical.sprint10m')} connectNulls />}
              {hasPhysicalField('sprint20') && <Line type="monotone" dataKey="sprint20" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} name={t('physical.sprint20m')} connectNulls />}
            {hasPhysicalField('cmj') && <Line type="monotone" dataKey="cmj" stroke="var(--color-primary-light)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary-light)', stroke: '#fff', strokeWidth: 2 }} name={t('physical.cmj')} connectNulls />}
            {hasPhysicalField('jump') && <Line type="monotone" dataKey="jump" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('physical.standingJump')} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>{t('progress.noDataHint')}</p>
          )}
        </div>
      )}

      {/* ── Physical: Endurance ── */}
      {physicalData.length > 0 && isGroupTracked(['yoyo', 'agility']) && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">🫁 {t('progress.endurance')}</p>
          {hasPhysicalField('yoyo') || hasPhysicalField('agility') ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={physicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              {hasPhysicalField('yoyo') && <Line type="monotone" dataKey="yoyo" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.yoyo')} connectNulls />}
              {hasPhysicalField('agility') && <Line type="monotone" dataKey="agility" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} name={t('progress.agility')} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>{t('progress.noDataHint')}</p>
          )}
        </div>
      )}

      {/* ── Physical: Strength & Skill ── */}
      {physicalData.length > 0 && isGroupTracked(['plank', 'juggles']) && (
        <div className="card animate-fade-up">
          <p className="section-label mb-2">💪 {t('progress.strengthSkill')}</p>
          {hasPhysicalField('plank') || hasPhysicalField('juggles') ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={physicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} width={35} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              {hasPhysicalField('plank') && <Line type="monotone" dataKey="plank" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} name={t('progress.plank')} connectNulls />}
              {hasPhysicalField('juggles') && <Line type="monotone" dataKey="juggles" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} name={t('progress.juggles')} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>{t('progress.noDataHint')}</p>
          )}
        </div>
      )}
    </div>
  )
}
