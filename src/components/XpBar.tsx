import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { getRank } from '../engine/xp'

export function XpBar() {
  const { xp } = useApp()
  const { t } = useTranslation()
  const rank = getRank(xp.level)
  const pct = xp.nextLevelXp > 0 ? Math.min((xp.currentLevelXp / xp.nextLevelXp) * 100, 100) : 100

  const rankGradient =
    rank.color === 'bronze' ? 'linear-gradient(135deg, #cd7f32, #a0622a)'
    : rank.color === 'silver' ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
    : rank.color === 'gold' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
    : rank.color === 'diamond' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
    : 'linear-gradient(135deg, #c4b5fd, #e2e8f0)'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Level badge */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black shadow-lg"
        style={{ background: rankGradient, color: '#000' }}
        aria-label={t('dashboard.level', { level: xp.level })}
      >
        {xp.level}
      </div>

      {/* XP progress */}
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-semibold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
            {t(rank.key)}
          </span>
          <span className="font-data" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.xp', { current: xp.currentLevelXp, next: xp.nextLevelXp })}
          </span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Streak */}
      {xp.streakDays > 0 && (
        <div className="stat-pill stat-pill-gold">
          {t('dashboard.streak', { days: xp.streakDays })}
        </div>
      )}
    </div>
  )
}
