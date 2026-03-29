import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { QuoteCard } from '../components/QuoteCard'
import { SkillRadar } from '../components/SkillRadar'
import { CoachCard } from '../components/CoachCard'
import { getMatchResult } from '../engine/types'
import { getRank } from '../engine/xp'
import { exercises } from '../data/exercises'

export function Dashboard() {
  const { t } = useTranslation()
  const { matches, trainings, xp, profile } = useApp()
  const rank = getRank(xp.level)

  const seasonGoals = matches.reduce((s, m) => s + m.goals, 0)
  const seasonAssists = matches.reduce((s, m) => s + m.assists, 0)
  const wins = matches.filter((m) => getMatchResult(m) === 'win').length

  // Today's activity count
  const today = new Date().toISOString().slice(0, 10)
  const todayMatches = matches.filter(m => m.date.startsWith(today)).length
  const todayTrainings = trainings.filter(tr => tr.date.startsWith(today)).length
  const todayGoals = matches.filter(m => m.date.startsWith(today)).reduce((s, m) => s + m.goals, 0)

  // "vs last week" comparisons
  const vsLastWeek = useMemo(() => {
    const now = new Date()
    const weekAgoStart = new Date(now)
    weekAgoStart.setDate(weekAgoStart.getDate() - 14)
    const weekAgoEnd = new Date(now)
    weekAgoEnd.setDate(weekAgoEnd.getDate() - 7)
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(thisWeekStart.getDate() - 7)

    const inRange = (d: string, start: Date, end: Date) => {
      const dt = new Date(d)
      return dt >= start && dt < end
    }

    const lastWeekMatches = matches.filter(m => inRange(m.date, weekAgoStart, weekAgoEnd))
    const thisWeekMatches = matches.filter(m => inRange(m.date, thisWeekStart, now))
    const lastWeekTrainings = trainings.filter(tr => inRange(tr.date, weekAgoStart, weekAgoEnd))
    const thisWeekTrainings = trainings.filter(tr => inRange(tr.date, thisWeekStart, now))
    const lastWeekGoals = lastWeekMatches.reduce((s, m) => s + m.goals, 0)
    const thisWeekGoals = thisWeekMatches.reduce((s, m) => s + m.goals, 0)

    return {
      matches: thisWeekMatches.length - lastWeekMatches.length,
      goals: thisWeekGoals - lastWeekGoals,
      trainings: thisWeekTrainings.length - lastWeekTrainings.length,
    }
  }, [matches, trainings])

  // Drill of the day — deterministic pick based on today's date
  const drillOfDay = useMemo(() => {
    const dayIndex = Math.floor(new Date(today).getTime() / 86400000) % exercises.length
    return exercises[dayIndex]
  }, [today])

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.greetingMorning')
    if (hour < 17) return t('dashboard.greetingAfternoon')
    return t('dashboard.greetingEvening')
  }, [t])

  const playerName = profile?.name?.split(' ')[0] ?? ''

  function ComparisonArrow({ diff }: { diff: number }) {
    if (diff === 0) return null
    const isUp = diff > 0
    return (
      <span className="text-xs font-data font-bold" style={{ color: isUp ? 'var(--color-green-500)' : 'var(--color-danger)' }}>
        {isUp ? '↑' : '↓'}{Math.abs(diff)}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-32">
      {/* ── Welcome greeting ── */}
      <div className="animate-fade-up">
        <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {greeting}{playerName ? `, ${playerName}` : ''} 👋
        </p>
        {xp.streakDays > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.streakMessage', { days: xp.streakDays })}
          </p>
        )}
      </div>

      {/* ── Hero: Big level + XP showcase — gradient bg ── */}
      <div className="card-hero animate-fade-up relative overflow-hidden text-center py-8 px-6">
        {/* Decorative floating icons */}
        <div className="absolute top-3 right-4 text-4xl opacity-20 animate-float">⚽</div>
        <div className="absolute bottom-3 left-4 text-3xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🏆</div>

        {/* Level + Rank */}
        <p className="section-label mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{t(rank.key)}</p>
        <p className="text-6xl font-black font-data animate-number-pop" style={{ color: '#fff' }}>
          {xp.level}
        </p>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('dashboard.level', { level: xp.level })}
        </p>

        {/* XP progress */}
        <div className="mt-4 mx-auto max-w-[240px]">
          <div className="xp-bar-track" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="xp-bar-fill" style={{
              width: `${xp.nextLevelXp > 0 ? Math.min((xp.currentLevelXp / xp.nextLevelXp) * 100, 100) : 100}%`,
              background: 'linear-gradient(90deg, #fbbf24, #fff)',
            }} />
          </div>
          <p className="text-xs font-data mt-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {xp.currentLevelXp} / {xp.nextLevelXp} XP
          </p>
        </div>

        {/* Total XP badge */}
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-3"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          ⭐ {xp.totalXp.toLocaleString()} XP
        </div>
      </div>

      {/* ── Season stats with vs-last-week arrows ── */}
      <div className="grid grid-cols-4 gap-3 animate-fade-up animate-stagger-1">
        <div className="stat-card stat-card-green">
          <p className="text-3xl font-black font-data text-gradient-green animate-number-pop">
            {matches.length}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.matches')}
          </p>
          <ComparisonArrow diff={vsLastWeek.matches} />
        </div>
        <div className="stat-card stat-card-gold">
          <p className="text-3xl font-black font-data text-gradient-gold animate-number-pop" style={{ animationDelay: '0.1s' }}>
            {seasonGoals}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.goals')}
          </p>
          <ComparisonArrow diff={vsLastWeek.goals} />
        </div>
        <div className="stat-card stat-card-cyan">
          <p className="text-3xl font-black font-data text-gradient-green animate-number-pop" style={{ animationDelay: '0.2s' }}>
            {seasonAssists}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.assists')}
          </p>
        </div>
        <div className="stat-card stat-card-green">
          <p className="text-3xl font-black font-data text-gradient-green animate-number-pop" style={{ animationDelay: '0.3s' }}>
            {wins}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.wins')}
          </p>
        </div>
      </div>

      {/* ── Today's action-urge ── */}
      <div className="card animate-fade-up animate-stagger-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('dashboard.today')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {todayMatches > 0 || todayTrainings > 0
                ? t('dashboard.todaySummary', { matches: todayMatches, trainings: todayTrainings, goals: todayGoals })
                : t('dashboard.todayEmpty')
              }
            </p>
          </div>
        </div>
        {todayMatches === 0 && todayTrainings === 0 && (
          <span className="stat-pill stat-pill-green text-xs">
            {t('dashboard.todayAction')}
          </span>
        )}
      </div>

      {/* ── Drill of the day ── */}
      <div className="card-glow animate-fade-up animate-stagger-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎯</span>
          <p className="section-label">{t('dashboard.drillOfDay')}</p>
        </div>
        <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {t(drillOfDay.nameKey)}
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {t(drillOfDay.descriptionKey)}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-data" style={{ background: '#f3f4f6', color: '#6b7280' }}>
            {drillOfDay.durationMinutes} min
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
            {'⭐'.repeat(drillOfDay.difficulty)}
          </span>
        </div>
      </div>

      {/* ── Training counter (vs last week) ── */}
      <div className="card animate-fade-up animate-stagger-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('dashboard.season')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('log.training')}
              {vsLastWeek.trainings !== 0 && (
                <span className="ml-1 font-data font-bold" style={{ color: vsLastWeek.trainings > 0 ? 'var(--color-green-500)' : 'var(--color-danger)' }}>
                  {vsLastWeek.trainings > 0 ? '↑' : '↓'}{Math.abs(vsLastWeek.trainings)} {t('dashboard.vsLastWeek')}
                </span>
              )}
            </p>
          </div>
        </div>
        <span className="stat-pill stat-pill-green text-base font-black">
          {trainings.length}
        </span>
      </div>

      {/* ── Quote of the day ── */}
      <QuoteCard />

      {/* ── AI Coach ── */}
      <CoachCard />

      {/* ── Skill radar ── */}
      <SkillRadar />

      {/* ── Recent matches ── */}
      {matches.length > 0 && (
        <div className="card animate-fade-up animate-stagger-4">
          <p className="section-label mb-3">
            {t('dashboard.matches')}
          </p>
          <div className="flex flex-col gap-1">
            {matches.slice(-5).reverse().map((m) => {
              const result = getMatchResult(m)
              const resultColor =
                result === 'win' ? '#15803d'
                : result === 'loss' ? '#dc2626'
                : '#d97706'
              const resultBg =
                result === 'win' ? '#dcfce7'
                : result === 'loss' ? '#fee2e2'
                : '#fef3c7'
              return (
                <div key={m.id} className="flex justify-between items-center py-2.5 px-3 rounded-xl text-sm"
                  style={{ background: resultBg }}>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{m.opponent}</span>
                  <span className="font-data font-black text-base" style={{ color: resultColor }}>
                    {m.scoreUs} : {m.scoreThem}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
