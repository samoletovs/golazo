import { useTranslation } from 'react-i18next'
import { getRank } from '../engine/xp'
import { ConfettiBurst } from './ConfettiBurst'
import { AcademyDialog } from './academy/AcademyDialog'

interface LevelUpCelebrationProps { level: number; onClose: () => void }

export function LevelUpCelebration({ level, onClose }: LevelUpCelebrationProps) {
  const { t } = useTranslation()
  return <AcademyDialog surface="level-up" title={t('levelUp.title')} onClose={onClose}>
    <div className="academy-stack">
      <ConfettiBurst trigger />
      <p className="academy-eyebrow">{t(getRank(level).key)}</p>
      <p className="academy-reward">{t('dashboard.level', { level })}</p>
      <p>{t('training.effortRemembered')}</p>
      <button className="academy-button" onClick={onClose}>{t('levelUp.continue')}</button>
    </div>
  </AcademyDialog>
}
