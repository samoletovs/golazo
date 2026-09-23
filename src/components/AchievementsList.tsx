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
    <div className="academy-stack">
      <div className="flex items-center justify-between">
        <h2>{t('profile.achievements')}</h2>
        <span className="stat-pill stat-pill-gold text-xs">
          {unlocked.length} / {ACHIEVEMENT_DEFS.length}
        </span>
      </div>

      <p className="academy-muted">{t('academy.achievementsIntro')}</p>
      {unlocked.length > 0 && <ul className="academy-achievements">{unlocked.map(achievement => <li key={achievement.id}>
        <span className="academy-achievement-mark" aria-hidden="true">{achievement.icon}</span>
        <div><h3>{t(achievement.nameKey)}</h3><p>{t(achievement.descriptionKey)}</p></div>
        <span className="academy-complete-label" aria-hidden="true">✓</span>
      </li>)}</ul>}
      {locked.length > 0 && <details className="academy-achievement-details">
        <summary>{t('academy.achievementCollection', { count: locked.length })}</summary>
        <ul className="academy-achievements">{locked.map(achievement => {
          const target = TARGETS[achievement.id]
          const current = target ? target.current(ctx) : 0
          return <li key={achievement.id}>
            <span className="academy-achievement-mark" aria-hidden="true">{achievement.icon}</span>
            <div><h3>{t(achievement.nameKey)}</h3><p>{t(achievement.descriptionKey)}</p>
              {target && <><p className="academy-muted">{current} / {target.target}</p><progress max={target.target} value={Math.min(current, target.target)} aria-label={t(achievement.nameKey)} /></>}
            </div>
          </li>
        })}</ul>
      </details>}
    </div>
  )
}
