import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { trainingSummary } from '../../engine/training'

export function TrainingProgress() {
  const { t } = useTranslation()
  const { trainings, xp } = useApp()
  const summary = trainingSummary(trainings)
  return (
    <div className="training-progress">
      <p className="academy-muted">{t('clubhouse.lastSeven')}</p>
      <dl className="academy-stat-line">
        <div><dt>{t('clubhouse.sessions')}</dt><dd>{summary.sessions}</dd></div>
        <div><dt>{t('clubhouse.minutes')}</dt><dd>{summary.minutes}</dd></div>
      </dl>
      <div className="academy-actions mt-5"><strong>{t('dashboard.level', { level: xp.level })}</strong><span>{t('dashboard.xp', { current: xp.currentLevelXp, next: xp.nextLevelXp })}</span></div>
      <progress max={xp.nextLevelXp} value={xp.currentLevelXp} aria-label={t('dashboard.level', { level: xp.level })} />
      <p className="academy-hint">{t('clubhouse.xpMeaning')}</p>
    </div>
  )
}
