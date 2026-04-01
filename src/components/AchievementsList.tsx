import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { computeAchievements, ACHIEVEMENT_DEFS } from '../engine/achievements'

/* Target values per achievement for progress hints */
const TARGETS: Record<string, { current: (ctx: { trainings: number; matches: number; goals: number; assists: number; diary: number; xp: number; streak: number; level: number }) => number; target: number }> = {
  train10: { current: c => c.trainings, target: 10 },
  train50: { current: c => c.trainings, target: 50 },
  train100: { current: c => c.trainings, target: 100 },
  match10: { current: c => c.matches, target: 10 },
  match50: { current: c => c.matches, target: 50 },
  goal10: { current: c => c.goals, target: 10 },
  goal50: { current: c => c.goals, target: 50 },
  assist10: { current: c => c.assists, target: 10 },
  assist25: { current: c => c.assists, target: 25 },
  diary5: { current: c => c.diary, target: 5 },
  diary20: { current: c => c.diary, target: 20 },
  xp1000: { current: c => c.xp, target: 1000 },
  xp5000: { current: c => c.xp, target: 5000 },
  streak7: { current: c => c.streak, target: 7 },
  streak30: { current: c => c.streak, target: 30 },
  level10: { current: c => c.level, target: 10 },
  level25: { current: c => c.level, target: 25 },
}

/* Tier gradient backgrounds for unlocked badges */
const TIER_GRADIENTS = [
  'linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-primary-bg-subtle) 100%)', // green (training)
  'linear-gradient(135deg, var(--color-amber-bg) 0%, var(--color-gold-300) 100%)', // gold (goals/xp)
  'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', // cyan (assists)
  'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', // purple (streaks/levels)
]

function getTierGradient(id: string): string {
  if (id.startsWith('train') || id.startsWith('match')) return TIER_GRADIENTS[0]
  if (id.startsWith('goal') || id.startsWith('xp')) return TIER_GRADIENTS[1]
  if (id.startsWith('assist') || id.startsWith('diary')) return TIER_GRADIENTS[2]
  return TIER_GRADIENTS[3]
}

export function AchievementsList() {
  const { t } = useTranslation()
  const { trainings, matches, diary, xp } = useApp()

  const achievements = useMemo(
    () => computeAchievements([], trainings, matches, diary, xp),
    [trainings, matches, diary, xp],
  )

  const ctx = useMemo(() => ({
    trainings: trainings.length,
    matches: matches.length,
    goals: matches.reduce((s, m) => s + m.goals, 0),
    assists: matches.reduce((s, m) => s + m.assists, 0),
    diary: diary.length,
    xp: xp.totalXp,
    streak: xp.streakDays,
    level: xp.level,
  }), [trainings, matches, diary, xp])

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

      {/* Unlocked achievements — larger, gradient bg, animate */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {unlocked.map((a, i) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl animate-achievement"
              style={{
                background: getTierGradient(a.id),
                animationDelay: `${i * 0.06}s`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              title={t(a.descriptionKey)}
              aria-label={`${t(a.nameKey)}: ${t(a.descriptionKey)}`}
            >
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>{a.icon}</span>
              <span className="text-xs font-bold text-center leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
                {t(a.nameKey)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Locked achievements — progress hint + mini bar */}
      {locked.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {locked.map((a) => {
            const target = TARGETS[a.id]
            const current = target ? target.current(ctx) : 0
            const pct = target ? Math.min(current / target.target, 1) : 0
            const remaining = target ? target.target - current : 0

            return (
              <div
                key={a.id}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl achievement-locked"
                style={{ background: 'var(--color-field-input)', border: '1px dashed var(--color-border-subtle)' }}
                title={t(a.descriptionKey)}
                aria-label={`${t(a.nameKey)}: ${t(a.descriptionKey)}`}
              >
                <span className="text-xl grayscale opacity-40">{a.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                  {t(a.nameKey)}
                </span>
                {/* Mini progress bar */}
                {target && (
                  <>
                    <div className="w-full h-1 rounded-full overflow-hidden mt-0.5" style={{ background: 'var(--color-border-default)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: 'var(--color-silver)', transition: 'width 0.5s ease' }} />
                    </div>
                    <span className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
                      {remaining > 0 ? `${remaining} more` : ''}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
