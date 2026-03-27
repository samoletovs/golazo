import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp } from '../engine/xp'

const DAILY_CHALLENGES = [
  { id: 'daily1', textKey: 'challenges.daily1', xp: 25 },
  { id: 'daily2', textKey: 'challenges.daily2', xp: 25 },
  { id: 'daily3', textKey: 'challenges.daily3', xp: 25 },
]

export function Challenges() {
  const { t } = useTranslation()
  const { xp, setXp } = useApp()
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  function completeChallenge(id: string, xpReward: number) {
    if (doneIds.has(id)) return
    setDoneIds((prev) => new Set(prev).add(id))
    const today = new Date().toISOString().split('T')[0]
    setXp(awardXp(xp, xpReward, today))
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('challenges.title')}</h2>

      {/* Daily */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.daily')}
        </p>
        <div className="flex flex-col gap-2">
          {DAILY_CHALLENGES.map((ch) => {
            const isDone = doneIds.has(ch.id)
            return (
              <div key={ch.id} className="card flex items-center justify-between">
                <span className="text-sm flex-1 mr-3">{t(ch.textKey)}</span>
                <button
                  className="tap-target rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap"
                  style={{
                    background: isDone ? '#16a34a' : '#fef3c7',
                    color: isDone ? '#fff' : '#b45309',
                    border: 'none',
                  }}
                  onClick={() => completeChallenge(ch.id, ch.xp)}
                  disabled={isDone}
                  aria-label={isDone ? t('challenges.complete') : `+${ch.xp} XP`}
                >
                  {isDone ? '✓' : `+${ch.xp} XP`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Special tracks */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.special')}
        </p>
        <div className="flex flex-col gap-2">
          <div className="card-glow">
            <p className="text-sm font-bold">{t('challenges.weakFoot')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('challenges.weakFootDesc')}
            </p>
            <div className="progress-track mt-2">
              <div className="progress-fill" style={{ width: '0%', background: 'var(--color-green-400)' }} />
            </div>
          </div>
          <div className="card-glow">
            <p className="text-sm font-bold">{t('challenges.mentalChamp')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('challenges.mentalChampDesc')}
            </p>
            <div className="progress-track mt-2">
              <div className="progress-fill" style={{ width: '0%', background: 'var(--color-cyan)' }} />
            </div>
          </div>
          <div className="card-glow">
            <p className="text-sm font-bold">{t('challenges.deepPractice')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('challenges.deepPracticeDesc')}
            </p>
            <div className="progress-track mt-2">
              <div className="progress-fill" style={{ width: '0%', background: 'var(--color-gold-400)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
