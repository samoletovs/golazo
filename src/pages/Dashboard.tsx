import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { QuoteCard } from '../components/QuoteCard'
import { SkillRadar } from '../components/SkillRadar'
import { getMatchResult } from '../engine/types'
import { getRank } from '../engine/xp'

export function Dashboard() {
  const { t } = useTranslation()
  const { matches, trainings, xp } = useApp()
  const rank = getRank(xp.level)

  const seasonGoals = matches.reduce((s, m) => s + m.goals, 0)
  const seasonAssists = matches.reduce((s, m) => s + m.assists, 0)
  const wins = matches.filter((m) => getMatchResult(m) === 'win').length

  return (
    <div className="flex flex-col gap-5 p-4 pb-32">
      {/* ── Hero: Big level + XP showcase ── */}
      <div className="card-gold animate-fade-up relative overflow-hidden text-center py-8 px-6">
        {/* Decorative football emoji */}
        <div className="absolute top-3 right-4 text-4xl opacity-15 animate-float">⚽</div>
        <div className="absolute bottom-3 left-4 text-3xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🏆</div>

        {/* Level + Rank */}
        <p className="section-label mb-1">{t(rank.key)}</p>
        <p className="text-6xl font-black font-data text-gradient-gold animate-number-pop">
          {xp.level}
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          {t('dashboard.level', { level: xp.level })}
        </p>

        {/* XP progress */}
        <div className="mt-4 mx-auto max-w-[240px]">
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xp.nextLevelXp > 0 ? Math.min((xp.currentLevelXp / xp.nextLevelXp) * 100, 100) : 100}%` }} />
          </div>
          <p className="text-xs font-data mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            {xp.currentLevelXp} / {xp.nextLevelXp} XP
          </p>
        </div>

        {/* Total XP badge */}
        <div className="stat-pill stat-pill-gold mx-auto mt-3">
          ⭐ {xp.totalXp.toLocaleString()} XP
        </div>
      </div>

      {/* ── Season stats — oversized gradient numbers ── */}
      <div className="grid grid-cols-4 gap-3 animate-fade-up animate-stagger-1">
        <div className="stat-card stat-card-green">
          <p className="text-3xl font-black font-data text-gradient-green animate-number-pop">
            {matches.length}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.matches')}
          </p>
        </div>
        <div className="stat-card stat-card-gold">
          <p className="text-3xl font-black font-data text-gradient-gold animate-number-pop" style={{ animationDelay: '0.1s' }}>
            {seasonGoals}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.goals')}
          </p>
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
            🏆
          </p>
        </div>
      </div>

      {/* ── Training counter ── */}
      <div className="card animate-fade-up animate-stagger-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div>
            <p className="text-sm font-bold">{t('dashboard.season')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('log.training')}
            </p>
          </div>
        </div>
        <span className="stat-pill stat-pill-green text-base font-black">
          {trainings.length}
        </span>
      </div>

      {/* ── Quote of the day ── */}
      <QuoteCard />

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
                result === 'win' ? 'var(--color-green-500)'
                : result === 'loss' ? 'var(--color-danger)'
                : 'var(--color-warn)'
              const resultBg =
                result === 'win' ? '#ecfdf5'
                : result === 'loss' ? '#fef2f2'
                : '#fffbeb'
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
