import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { QuoteCard } from '../components/QuoteCard'
import { SkillRadar } from '../components/SkillRadar'
import { getMatchResult } from '../engine/types'

export function Dashboard() {
  const { t } = useTranslation()
  const { matches, trainings, xp } = useApp()

  const seasonGoals = matches.reduce((s, m) => s + m.goals, 0)
  const seasonAssists = matches.reduce((s, m) => s + m.assists, 0)

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Quote of the day */}
      <QuoteCard />

      {/* Season stats — vibrant pills */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up animate-stagger-1">
        <div className="card text-center py-4">
          <p className="text-2xl font-black font-data" style={{ color: 'var(--color-green-400)' }}>
            {matches.length}
          </p>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.matches')}
          </p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-black font-data" style={{ color: 'var(--color-gold-400)' }}>
            {seasonGoals}
          </p>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.goals')}
          </p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-black font-data" style={{ color: 'var(--color-cyan)' }}>
            {seasonAssists}
          </p>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.assists')}
          </p>
        </div>
      </div>

      {/* Total XP highlight */}
      <div className="card-gold animate-fade-up animate-stagger-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Total XP
          </span>
          <span className="text-xl font-black font-data" style={{ color: 'var(--color-gold-400)' }}>
            {xp.totalXp.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.season')}
          </span>
          <span className="stat-pill stat-pill-green">
            {trainings.length} {t('log.training').toLowerCase()}
          </span>
        </div>
      </div>

      {/* Skill radar */}
      <SkillRadar />

      {/* Recent matches */}
      {matches.length > 0 && (
        <div className="card animate-fade-up animate-stagger-3">
          <p className="section-label mb-3">
            {t('dashboard.matches')}
          </p>
          <div className="flex flex-col gap-2">
            {matches.slice(-5).reverse().map((m) => {
              const result = getMatchResult(m)
              const resultColor =
                result === 'win' ? 'var(--color-green-400)'
                : result === 'loss' ? 'var(--color-danger)'
                : 'var(--color-warn)'
              return (
                <div key={m.id} className="flex justify-between items-center py-2 text-sm"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--color-text)' }}>{m.opponent}</span>
                  <span className="font-data font-bold" style={{ color: resultColor }}>
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
