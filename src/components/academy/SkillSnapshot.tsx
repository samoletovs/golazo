import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { categoryAverage, TRAINABLE_CATEGORIES } from '../../engine/skills'
import { formatDisplayDate } from '../../utils/dateFormat'
import { SkillRadar } from '../SkillRadar'
import { AcademyPanel } from './AcademyPage'
import { ChartDataTable } from './ChartDataTable'

export function SkillSnapshot() {
  const { t } = useTranslation()
  const { skillTree } = useApp()
  const rows = TRAINABLE_CATEGORIES.map(category => {
    const dates = skillTree.ratings.filter(rating => rating.category === category).map(rating => rating.lastUpdated).sort()
    const updated = dates[dates.length - 1]
    return { category: t(`skills.${category}`), rating: `${categoryAverage(skillTree, category).toFixed(1)} / 10`, updated: updated ? formatDisplayDate(updated) : null }
  })
  return <AcademyPanel title={t('progress.skillRadar')}>
    <SkillRadar embedded />
    <p className="academy-hint mt-5">{t('academy.skillSnapshotHint')}</p>
    <ChartDataTable title={t('dashboard.skills')} rows={rows} columns={[
      { key: 'category', label: t('dashboard.skills') }, { key: 'rating', label: t('progress.selfRating') }, { key: 'updated', label: t('academy.updated') },
    ]} />
  </AcademyPanel>
}
