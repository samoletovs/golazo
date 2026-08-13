import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { getRank } from '../engine/xp'

/**
 * Compact progress header that translates raw XP state into the player's
 * visible level, rank, next-level progress, and active streak.
 */
export function XpBar() {
  const { xp } = useApp()
  const { t } = useTranslation()
  const rank = getRank(xp.level)
  const pct = xp.nextLevelXp > 0 ? Math.min((xp.currentLevelXp / xp.nextLevelXp) * 100, 100) : 100

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Level badge */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black shadow-md"
        style={{ background: 'linear-gradient(135deg, var(--color-primary-darker), var(--color-primary-dark))', color: '#fff' }}
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
