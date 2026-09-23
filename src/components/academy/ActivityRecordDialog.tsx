import { useTranslation } from 'react-i18next'
import type { DiaryEntry, MatchEntry, TrainingEntry } from '../../engine/types'
import { formatDisplayDate } from '../../utils/dateFormat'
import { AcademyDialog } from './AcademyDialog'

export type ActivityRecord =
  | { kind: 'training'; entry: TrainingEntry }
  | { kind: 'match'; entry: MatchEntry }
  | { kind: 'diary'; entry: DiaryEntry }

function TrainingRecord({ entry }: { entry: TrainingEntry }) {
  const { t } = useTranslation()
  return <div className="academy-stack">
    <dl className="academy-record-facts">
      <div><dt>{t('training.kind')}</dt><dd>{t(`training.type.${entry.type}`)}</dd></div>
      <div><dt>{t('training.durationLabel')}</dt><dd>{entry.durationMinutes}</dd></div>
      <div><dt>{t('training.energy')}</dt><dd>{entry.energy} / 5</dd></div>
      <div><dt>{t('training.mood')}</dt><dd>{entry.mood} / 5</dd></div>
    </dl>
    {entry.focusAreas.length > 0 && <p>{entry.focusAreas.map(area => t(`training.focus.${area}`)).join(' · ')}</p>}
    {entry.exerciseIds.length > 0 && <p>{t('learn.exercises')}: {entry.exerciseIds.length}</p>}
    {entry.notes && <section><h3>{t('training.yourWords')}</h3><p className="academy-record-writing">{entry.notes}</p></section>}
  </div>
}

function MatchRecord({ entry }: { entry: MatchEntry }) {
  const { t } = useTranslation()
  return <div className="academy-stack">
    <div><p className="academy-muted">{entry.competition}</p><p className="academy-score">{entry.scoreUs} : {entry.scoreThem}</p><h3>{[entry.playingFor, entry.opponent].filter(Boolean).join(' · ')}</h3></div>
    <dl className="academy-record-facts">
      {([{ key: 'goals', label: 'match.goals' }, { key: 'assists', label: 'match.assists' }, { key: 'minutesPlayed', label: 'match.minutes' },
        { key: 'shots', label: 'match.shots' }, { key: 'keyPasses', label: 'match.keyPasses' }, { key: 'tackles', label: 'match.tackles' }] as const).map(field => <div key={field.key}><dt>{t(field.label)}</dt><dd>{entry[field.key]}</dd></div>)}
      <div><dt>{t('progress.selfRating')}</dt><dd>{entry.selfRating} / 10</dd></div>
      <div><dt>{t('training.mood')}</dt><dd>{entry.mood} / 5</dd></div>
    </dl>
    <p>{Array.isArray(entry.position) ? entry.position.join(' / ') : entry.position}</p>
    {entry.bestMoment && <section><h3>{t('match.bestMoment')}</h3><p className="academy-record-writing">{entry.bestMoment}</p></section>}
    {entry.toImprove && <section><h3>{t('match.toImprove')}</h3><p className="academy-record-writing">{entry.toImprove}</p></section>}
  </div>
}

function DiaryRecord({ entry }: { entry: DiaryEntry }) {
  const { t } = useTranslation()
  return <div className="academy-stack">
    <p className="academy-hint">{t('diary.private')}</p>
    <p>{t('training.mood')}: {entry.mood} / 5{entry.moodContext ? ` · ${t(`diary.context.${entry.moodContext}`)}` : ''}</p>
    <p className="academy-record-writing">{entry.text}</p>
    {entry.photoUrl && <img src={entry.photoUrl} alt={t('diary.title')} className="academy-record-photo" />}
    <label className="flex items-center gap-3"><input type="checkbox" checked={entry.aiConsent !== false} disabled readOnly />{t('diary.aiConsent')}</label>
  </div>
}

export function ActivityRecordDialog({ record, onClose }: { record: ActivityRecord; onClose: () => void }) {
  const { t } = useTranslation()
  return <AcademyDialog surface={`${record.kind}-record-detail`} title={t(`log.${record.kind}`)} onClose={onClose} wide>
    <div className="academy-stack">
      <p className="academy-eyebrow">{formatDisplayDate(new Date(`${record.entry.date.slice(0, 10)}T12:00:00`), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      {record.kind === 'training' && <TrainingRecord entry={record.entry} />}
      {record.kind === 'match' && <MatchRecord entry={record.entry} />}
      {record.kind === 'diary' && <DiaryRecord entry={record.entry} />}
      <p className="academy-hint">{t('academy.recordReadOnly')}</p>
    </div>
  </AcademyDialog>
}
