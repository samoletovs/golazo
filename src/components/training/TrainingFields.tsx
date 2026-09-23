import { useTranslation } from 'react-i18next'
import { FOCUS_AREAS, TRAINING_TYPES } from '../../engine/types'
import type { TrainingEntry } from '../../engine/types'

interface Props {
  draft: TrainingEntry
  onChange: (entry: TrainingEntry) => void
  today: string
}

const RATINGS = [1, 2, 3, 4, 5] as const

export function TrainingFields({ draft, onChange, today }: Props) {
  const { t } = useTranslation()
  const change = (patch: Partial<TrainingEntry>) => onChange({ ...draft, ...patch })
  return (
    <>
      <div className="training-pair">
        <label className="academy-field">
          <span>{t('log.date')}</span>
          <input name="date" type="date" required max={today} value={draft.date} onChange={event => change({ date: event.target.value })} />
        </label>
        <fieldset className="academy-field">
          <legend>{t('training.kind')}</legend>
          <div className="training-types">
            {Object.values(TRAINING_TYPES).map(type => (
              <button key={type} type="button" className="academy-choice" aria-pressed={draft.type === type} onClick={() => change({ type })}>{t(`training.type.${type}`)}</button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="academy-field">
        <label htmlFor="training-duration">{t('training.durationLabel')}</label>
        <input id="training-duration" name="duration" type="number" inputMode="numeric" min="1" step="1" required value={Number.isNaN(draft.durationMinutes) ? '' : draft.durationMinutes} onChange={event => change({ durationMinutes: event.target.valueAsNumber })} aria-describedby="duration-help" />
        <small id="duration-help">{t('training.shortCounts')}</small>
      </div>
      <div className="training-presets" role="group" aria-label={t('training.duration')}>
        {[60, 90, 120].map(duration => <button key={duration} className="academy-choice" type="button" aria-pressed={draft.durationMinutes === duration} onClick={() => change({ durationMinutes: duration })}>{t('training.minutes', { min: duration })}</button>)}
      </div>
      {(['energy', 'mood'] as const).map(field => (
        <fieldset key={field} className="academy-field">
          <legend>{t(`training.${field}`)}</legend>
          <div className="training-ratings">
            {RATINGS.map(value => <label key={value} className="training-rating">
              <input type="radio" name={field} value={value} checked={draft[field] === value} onChange={() => change({ [field]: value })} />
              <span>{value}<small>{t(`training.${field}.${value}`)}</small></span>
            </label>)}
          </div>
        </fieldset>
      ))}
      <details className="training-details">
        <summary>{t('training.optionalDetails')}</summary>
        <fieldset className="academy-field">
          <legend>{t('training.focus')}</legend>
          <div className="training-focus">
            {Object.values(FOCUS_AREAS).map(focus => <label key={focus}>
              <input type="checkbox" checked={draft.focusAreas.includes(focus)} onChange={event => change({ focusAreas: event.target.checked ? [...draft.focusAreas, focus] : draft.focusAreas.filter(item => item !== focus) })} />
              {t(`training.focus.${focus}`)}
            </label>)}
          </div>
        </fieldset>
        <label className="academy-field">
          <span>{t('training.notes')}</span>
          <textarea name="notes" rows={3} value={draft.notes} onChange={event => change({ notes: event.target.value })} />
        </label>
      </details>
    </>
  )
}
