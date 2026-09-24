import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { trainingSummary } from '../../engine/training'

export function AcademySeasonComparison() {
  const { t } = useTranslation()
  const { matches, trainings } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  function offset(days: number) {
    const date = new Date(`${today}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - days)
    return date.toISOString().slice(0, 10)
  }
  const current = matches.filter(item => item.date.slice(0, 10) >= offset(6) && item.date.slice(0, 10) <= today)
  const previous = matches.filter(item => item.date.slice(0, 10) >= offset(13) && item.date.slice(0, 10) <= offset(7))
  const rows = [
    { label: 'dashboard.matches', difference: current.length - previous.length },
    { label: 'dashboard.goals', difference: current.reduce((sum, item) => sum + item.goals, 0) - previous.reduce((sum, item) => sum + item.goals, 0) },
    { label: 'log.training', difference: trainingSummary(trainings, today).sessions - trainingSummary(trainings, offset(7)).sessions },
  ]
  return <div className="mt-5"><p className="academy-muted">{t('academy.previousWeekComparison')}</p>
    <dl className="academy-comparison">{rows.map(row => <div key={row.label}><dt>{t(row.label)}</dt><dd>{row.difference > 0 ? '+' : ''}{row.difference}</dd></div>)}</dl>
  </div>
}
