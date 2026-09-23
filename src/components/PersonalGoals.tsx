import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import type { PersonalGoalMetric } from '../engine/types'
import { computePersonalGoalProgress, getPersonalGoalStats, updatePersonalGoalCompletions } from '../engine/personalGoals'

const GOAL_METRICS: PersonalGoalMetric[] = ['trainings', 'matches', 'goals', 'assists', 'diary', 'xp', 'streak']

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `goal-${Date.now()}`
}

export function PersonalGoals() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const {
    trainings,
    matches,
    diary,
    xp,
    personalGoals,
    setPersonalGoals,
    addPersonalGoal,
    deletePersonalGoal,
  } = useApp()
  const [title, setTitle] = useState('')
  const [metric, setMetric] = useState<PersonalGoalMetric>('trainings')
  const [target, setTarget] = useState('5')

  const stats = useMemo(
    () => getPersonalGoalStats(trainings, matches, diary, xp),
    [trainings, matches, diary, xp],
  )
  const progress = useMemo(
    () => personalGoals.map((goal) => computePersonalGoalProgress(goal, stats)),
    [personalGoals, stats],
  )
  const targetNumber = Number(target)
  const canAddGoal = title.trim().length > 0 && Number.isFinite(targetNumber) && targetNumber > 0

  useEffect(() => {
    try {
      setPersonalGoals((prev) => {
        const updated = updatePersonalGoalCompletions(prev, stats)
        const previousById = new Map(prev.map((goal) => [goal.id, goal]))
        return updated.some((goal) => goal.completedAt !== previousById.get(goal.id)?.completedAt) ? updated : prev
      })
    } catch (cause) {
      console.error('Goal completion could not be saved:', cause)
      showToast(t('academy.saveError'), 'error')
    }
  }, [stats, setPersonalGoals, showToast, t])

  function removeGoal(id: string) {
    try { deletePersonalGoal(id) }
    catch (cause) {
      console.error('Personal goal could not be removed:', cause)
      showToast(t('academy.saveError'), 'error')
    }
  }

  function handleAddGoal() {
    const trimmedTitle = title.trim()
    const parsedTarget = Math.floor(Number(target))
    if (!trimmedTitle || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return

    try {
      addPersonalGoal({
        id: createId(), title: trimmedTitle, metric, target: parsedTarget,
        createdAt: new Date().toISOString(),
      })
    } catch (cause) {
      console.error('Personal goal could not be saved:', cause)
      showToast(t('academy.saveError'), 'error')
      return
    }
    setTitle('')
    setTarget('5')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2>{t('goals.title')}</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {t('goals.subtitle')}
          </p>
        </div>
        <span className="stat-pill text-xs">
          {progress.filter(item => item.completed).length} / {personalGoals.length}
        </span>
      </div>

      <details className="academy-goal-composer">
      <summary>{t('goals.add')}</summary>
      <div className="academy-form">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('goals.titlePlaceholder')}
          aria-label={t('goals.titlePlaceholder')}
          className="w-full text-sm"
        />
        <div className="academy-goal-fields">
          <select
            value={metric}
            onChange={(event) => setMetric(event.target.value as PersonalGoalMetric)}
            aria-label={t('goals.metric')}
            className="text-sm"
          >
            {GOAL_METRICS.map((item) => (
              <option key={item} value={item}>{t(`goals.metric.${item}`)}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder={t('goals.target')}
            aria-label={t('goals.target')}
            className="text-sm"
          />
        </div>
        <button
          className="btn-primary w-full text-sm"
          onClick={handleAddGoal}
          disabled={!canAddGoal}
        >
          {t('goals.add')}
        </button>
      </div>
      </details>

      {progress.length === 0 ? (
        <p className="text-xs text-center py-3" style={{ color: 'var(--color-text-muted)' }}>
          {t('goals.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {progress.map(({ goal, current, target: goalTarget, percent, remaining, completed }) => (
            <div
              key={goal.id}
              className="rounded-xl p-3"
              style={{
                background: completed ? 'var(--color-primary-bg)' : 'var(--color-field-input)',
                border: completed ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold">{goal.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {t(`goals.metric.${goal.metric}`)}
                  </p>
                </div>
                <button
                  className="tap-target text-lg font-bold rounded-full flex items-center justify-center"
                  style={{ color: 'var(--color-danger)', minWidth: 44, minHeight: 44 }}
                  onClick={() => removeGoal(goal.id)}
                  aria-label={t('goals.delete', { title: goal.title })}
                >
                  &times;
                </button>
              </div>
              <div className="mt-3 xp-bar-track" style={{ height: 8 }}>
                <div
                  className="xp-bar-fill"
                  style={{
                    width: `${percent}%`,
                    height: '100%',
                    ...(completed ? { background: 'linear-gradient(90deg, var(--color-primary-dark), #fbbf24)' } : {}),
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
                <span>{current} / {goalTarget}</span>
                <span>{completed ? t('goals.complete') : t('goals.remaining', { count: remaining })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
