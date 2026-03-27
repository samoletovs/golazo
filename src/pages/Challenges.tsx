import { useTranslation } from 'react-i18next'

export function Challenges() {
  const { t } = useTranslation()

  const dailyChallenges = [
    { id: '1', text: '50 жонглирований каждой ногой', xp: 25, done: false },
    { id: '2', text: '20 длинных передач', xp: 25, done: false },
    { id: '3', text: '5 минут пас в стенку', xp: 25, done: false },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h2 className="text-lg font-bold">{t('challenges.title')}</h2>

      {/* Daily */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          {t('challenges.daily')}
        </p>
        <div className="flex flex-col gap-2">
          {dailyChallenges.map((ch) => (
            <div key={ch.id} className="card flex items-center justify-between">
              <span className="text-sm">{ch.text}</span>
              <button
                className="tap-target rounded-lg px-3 py-2 text-xs font-bold"
                style={{
                  background: 'var(--color-surface-light)',
                  color: 'var(--color-pitch-green-light)',
                  border: '1px solid var(--color-pitch-green)',
                }}
                aria-label={`Complete challenge: ${ch.text}`}
              >
                +{ch.xp} XP
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Special tracks */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          {t('challenges.special')}
        </p>
        <div className="flex flex-col gap-2">
          <div className="card">
            <p className="text-sm font-bold">{t('challenges.weakFoot')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              30-дневная программа левой ноги
            </p>
            <div className="xp-bar-track mt-2">
              <div className="xp-bar-fill" style={{ width: '0%' }} />
            </div>
          </div>
          <div className="card">
            <p className="text-sm font-bold">{t('challenges.mentalChamp')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Визуализация и позитивный диалог
            </p>
            <div className="xp-bar-track mt-2">
              <div className="xp-bar-fill" style={{ width: '0%' }} />
            </div>
          </div>
          <div className="card">
            <p className="text-sm font-bold">{t('challenges.deepPractice')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              7 дней глубокой практики
            </p>
            <div className="xp-bar-track mt-2">
              <div className="xp-bar-fill" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
