import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { formatDisplayDate } from '../../utils/dateFormat'
import { ActivityRecordDialog } from './ActivityRecordDialog'
import type { ActivityRecord } from './ActivityRecordDialog'
import { AcademyIcon } from './AcademyIcon'
import { AcademyPanel } from './AcademyPage'

export function ActivityHistory() {
  const { t } = useTranslation()
  const { profile, trainings, matches, diary } = useApp()
  const [selected, setSelected] = useState<ActivityRecord | null>(null)
  const [limit, setLimit] = useState(6)
  if (profile?.role !== 'player') return null
  const owns = (entry: { playerId: string }) => entry.playerId === profile.id || entry.playerId === 'default'
  const records: ActivityRecord[] = [
    ...trainings.filter(owns).map(entry => ({ kind: 'training' as const, entry })),
    ...matches.filter(owns).map(entry => ({ kind: 'match' as const, entry })),
    ...diary.filter(owns).map(entry => ({ kind: 'diary' as const, entry })),
  ]
  records.sort((a, b) => b.entry.date.localeCompare(a.entry.date) || b.entry.createdAt.localeCompare(a.entry.createdAt))
  return <AcademyPanel title={t('academy.yourRecords')}>
    {records.length === 0 ? <p className="academy-muted">{t('academy.noRecords')}</p>
      : <div className="academy-record-list">{records.slice(0, limit).map(record => <button
        key={`${record.kind}-${record.entry.id}`} className="academy-record-row" onClick={() => setSelected(record)}>
        <AcademyIcon name={record.kind === 'training' ? 'log' : record.kind} />
        <span><strong>{record.kind === 'training' ? t(`training.type.${record.entry.type}`) : record.kind === 'match' ? record.entry.opponent : t('diary.title')}</strong>
          <small>{formatDisplayDate(new Date(`${record.entry.date.slice(0, 10)}T12:00:00`))}</small>
          {record.kind === 'training' && <small>{t('training.minutes', { min: record.entry.durationMinutes })}</small>}
          {record.kind === 'match' && <small>{record.entry.scoreUs} : {record.entry.scoreThem}</small>}
        </span><span aria-hidden="true">→</span>
      </button>)}</div>}
    {records.length > limit && <button className="academy-link mt-4" onClick={() => setLimit(value => value + 6)}>{t('academy.moreRecords')}</button>}
    {selected && <ActivityRecordDialog record={selected} onClose={() => setSelected(null)} />}
  </AcademyPanel>
}
