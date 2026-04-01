import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'

const WEEKLY_GOAL = 5 // target: 5 activities (trainings + matches) per week

export function WeeklyGoalRing() {
  const { t } = useTranslation()
  const { matches, trainings } = useApp()

  const { done, pct } = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weekTrainings = trainings.filter(tr => new Date(tr.date) >= weekStart).length
    const weekMatches = matches.filter(m => new Date(m.date) >= weekStart).length
    const total = weekTrainings + weekMatches
    return { done: total, pct: Math.min(total / WEEKLY_GOAL, 1) }
  }, [matches, trainings])

  const size = 120
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)

  const isComplete = pct >= 1

  return (
    <div className="card animate-fade-up">
      <div className="flex items-center gap-5">
        {/* SVG Ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-dark)" />
                <stop offset="100%" stopColor="var(--color-primary-light)" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
            />
            {/* Progress */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          {/* Center number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="stat-number stat-number-sm text-gradient-green">
              {done}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
              / {WEEKLY_GOAL}
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p className="text-base font-bold heading-display">
            {t('dashboard.weeklyGoal')}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {isComplete
              ? t('dashboard.weeklyGoalComplete')
              : t('dashboard.weeklyGoalRemaining', { remaining: WEEKLY_GOAL - done })
            }
          </p>
          {/* Mini progress bar */}
          <div className="mt-2 xp-bar-track" style={{ height: 6 }}>
            <div
              className="xp-bar-fill"
              style={{
                width: `${pct * 100}%`,
                height: '100%',
                ...(isComplete ? { background: 'linear-gradient(90deg, var(--color-primary-dark), #fbbf24)' } : {}),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
