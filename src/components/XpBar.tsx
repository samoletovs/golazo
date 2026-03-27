import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { getRank } from '../engine/xp'

export function XpBar() {
  const { xp } = useApp()
  const { t } = useTranslation()
  const rank = getRank(xp.level)
  const pct = xp.nextLevelXp > 0 ? Math.min((xp.currentLevelXp / xp.nextLevelXp) * 100, 100) : 100

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
        style={{
          background:
            rank.color === 'bronze' ? 'var(--color-bronze)'
            : rank.color === 'silver' ? 'var(--color-silver)'
            : rank.color === 'gold' ? 'var(--color-gold)'
            : rank.color === 'diamond' ? 'var(--color-diamond)'
            : 'var(--color-platinum)',
          color: '#000',
        }}
        aria-label={t('dashboard.level', { level: xp.level })}
      >
        {xp.level}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--color-text-secondary)' }}>{t(rank.key)}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.xp', { current: xp.currentLevelXp, next: xp.nextLevelXp })}
          </span>
        </div>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {xp.streakDays > 0 && (
        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-gold)' }}>
          {t('dashboard.streak', { days: xp.streakDays })}
        </span>
      )}
    </div>
  )
}
