import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrainingLog } from './TrainingLog'
import { MatchLog } from './MatchLog'
import { DiaryPage } from './DiaryPage'
import { TournamentPage } from './TournamentPage'

type LogType = 'select' | 'training' | 'match' | 'diary' | 'tournament'

export function LogPage() {
  const { t } = useTranslation()
  const [logType, setLogType] = useState<LogType>('select')

  if (logType === 'training') return <TrainingLog onBack={() => setLogType('select')} />
  if (logType === 'match') return <MatchLog onBack={() => setLogType('select')} />
  if (logType === 'diary') return <DiaryPage onBack={() => setLogType('select')} />
  if (logType === 'tournament') return <TournamentPage onBack={() => setLogType('select')} />

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('log.selectType')}</h2>

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('training')}
        aria-label={t('log.training')}
      >
        <span className="text-3xl">⚽</span>
        <div>
          <p className="text-base font-bold">{t('log.training')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            +20 XP
          </p>
        </div>
      </button>

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('match')}
        aria-label={t('log.match')}
      >
        <span className="text-3xl">🏟️</span>
        <div>
          <p className="text-base font-bold">{t('log.match')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            +30 XP
          </p>
        </div>
      </button>

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('diary')}
        aria-label={t('log.diary')}
      >
        <span className="text-3xl">📝</span>
        <div>
          <p className="text-base font-bold">{t('log.diary')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            +15 XP
          </p>
        </div>
      </button>

      <button
        className="card tap-target flex items-center gap-4 text-left"
        onClick={() => setLogType('tournament')}
        aria-label={t('log.tournament')}
      >
        <span className="text-3xl">🏆</span>
        <div>
          <p className="text-base font-bold">{t('log.tournament')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            +50 XP
          </p>
        </div>
      </button>
    </div>
  )
}
