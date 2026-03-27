import { useTranslation } from 'react-i18next'

export function Challenges() {
  const { t } = useTranslation()

  const dailyChallenges = [
    { id: '1', text: '50 жонглирований каждой ногой', xp: 25, done: false },
    { id: '2', text: '20 длинных передач', xp: 25, done: false },
    { id: '3', text: '5 минут пас в стенку', xp: 25, done: false },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('challenges.title')}</h2>

      {/* Daily */}
      <div>
        <p className="section-label mb-2">
          {t('challenges.daily')}
        </p>
        <div className="flex flex-col gap-2">
          {dailyChallenges.map((ch) => (
            <div key={ch.id} className="card flex items-center justify-between">
              <span className="text-sm">{ch.text}</span>
              <button
                className="tap-target rounded-xl px-3 py-2 text-xs font-bold"
                style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  border: 'none',
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
        <p className="section-label mb-2">
          {t('challenges.special')}
        </p>
        <div className="flex flex-col gap-2">
          <div className="card-glow">
            <p className="text-sm font-bold">{t('challenges.weakFoot')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              30-дневная программа левой ноги
            </p>
            <div className="progress-track mt-2">
              <div className="progress-fill" style={{ width: '0%', background: 'var(--color-green-400)' }} />
            </div>
          </div>
          <div className="card-glow">
            <p className="text-sm font-bold">{t('challenges.mentalChamp')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Визуализация и позитивный диалог
            </p>
            <div className="progress-track mt-2">
              <div className="progress-fill" style={{ width: '0%', background: 'var(--color-cyan)' }} />
            </div>
          </div>
          <div className="card-glow">
            <p className="text-sm font-bold">{t('challenges.deepPractice')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              7 дней глубокой практики
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
