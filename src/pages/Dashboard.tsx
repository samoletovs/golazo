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
      <QuoteCard />

      {/* Season stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-pitch-green-light)' }}>
            {matches.length}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.matches')}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-gold)' }}>
            {seasonGoals}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.goals')}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-diamond)' }}>
            {seasonAssists}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.assists')}
          </p>
        </div>
      </div>

      {/* Total XP */}
      <div className="card">
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Total XP
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--color-pitch-green-light)' }}>
            {xp.totalXp.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {t('dashboard.season')}
          </span>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {trainings.length} {t('log.training').toLowerCase()}
          </span>
        </div>
      </div>

      {/* Skill radar */}
      <SkillRadar />

      {/* Recent matches */}
      {matches.length > 0 && (
        <div className="card">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {t('dashboard.matches')}
          </p>
          <div className="flex flex-col gap-2">
            {matches.slice(-5).reverse().map((m) => {
              const result = getMatchResult(m)
              const resultColor =
                result === 'win' ? 'var(--color-pitch-green-light)'
                : result === 'loss' ? 'var(--color-danger)'
                : 'var(--color-warn)'
              return (
                <div key={m.id} className="flex justify-between items-center text-sm">
                  <span style={{ color: 'var(--color-text-primary)' }}>{m.opponent}</span>
                  <span style={{ color: resultColor, fontWeight: 600 }}>
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
