import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { computeAchievements, ACHIEVEMENT_DEFS } from '../engine/achievements'

export function AchievementsList() {
  const { t } = useTranslation()
  const { trainings, matches, diary, xp } = useApp()

  const achievements = useMemo(
    () => computeAchievements([], trainings, matches, diary, xp),
    [trainings, matches, diary, xp],
  )

  const unlocked = achievements.filter((a) => a.unlockedAt)
  const locked = achievements.filter((a) => !a.unlockedAt)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{t('profile.achievements')}</h2>
        <span className="stat-pill stat-pill-gold text-xs">
          {unlocked.length} / {ACHIEVEMENT_DEFS.length}
        </span>
      </div>

      {/* Unlocked achievements */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {unlocked.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1 p-2 rounded-lg"
              style={{ background: 'var(--color-glass-active)' }}
              title={t(a.descriptionKey)}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                {t(a.nameKey)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Locked achievements (dimmed) */}
      {locked.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {locked.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1 p-2 rounded-lg opacity-30"
              title={t(a.descriptionKey)}
            >
              <span className="text-2xl grayscale">{a.icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                {t(a.nameKey)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
