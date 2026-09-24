import { useTranslation } from 'react-i18next'

type Value = string | number | null | undefined

export function ChartDataTable<Row extends Record<string, Value>>({ title, rows, columns }: {
  title: string
  rows: Row[]
  columns: { key: keyof Row; label: string }[]
}) {
  const { t } = useTranslation()
  return <details className="academy-data-details">
    <summary aria-label={`${t('academy.viewData')}: ${title}`}>{t('academy.viewData')}</summary>
    <div className="academy-table-scroll" tabIndex={0} aria-label={title}>
      <table className="academy-progress-table">
        <caption>{title}</caption>
        <thead><tr>{columns.map(column => <th key={String(column.key)} scope="col">{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(column => <td key={String(column.key)}>{row[column.key] ?? '—'}</td>)}</tr>)}</tbody>
      </table>
      {rows.length === 0 && <p className="academy-muted">{t('progress.noDataHint')}</p>}
    </div>
  </details>
}
