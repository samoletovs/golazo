import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { TrainingFields } from '../components/training/TrainingFields'
import { TrainingCompletion } from '../components/training/TrainingCompletion'
import type { TrainingReceipt } from '../engine/training'
import type { TrainingType, TrainingEntry } from '../engine/types'
import { AcademyPage } from '../components/academy/AcademyPage'

export interface TrainingLogProps {
  onBack?: () => void
  inline?: boolean
  prefill?: { date?: string; type?: TrainingType; durationMinutes?: number; location?: string; fromSchedule?: string }
  onSaved?: () => void
}

export function TrainingLog({ onBack, inline, prefill, onSaved }: TrainingLogProps) {
  const { t } = useTranslation()
  const { saveTraining, profile } = useApp()
  const { showToast, dismissToast } = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const [draft, setDraft] = useState<TrainingEntry>(() => ({
    id: crypto.randomUUID(), playerId: profile?.id ?? 'default',
    date: prefill?.date ?? today, type: prefill?.type ?? 'team',
    durationMinutes: prefill?.durationMinutes ?? 90, focusAreas: [],
    energy: 3, mood: 3, notes: '', exerciseIds: [],
    fromSchedule: prefill?.fromSchedule, createdAt: new Date().toISOString(),
  }))
  const [receipt, setReceipt] = useState<TrainingReceipt | null>(null)
  const [failed, setFailed] = useState(false)
  const saving = useRef(false)
  const errorToast = useRef<number | null>(null)
  useEffect(() => () => {
    if (errorToast.current !== null) dismissToast(errorToast.current)
  }, [dismissToast])

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current || receipt) return
    if (!event.currentTarget.reportValidity()) return
    saving.current = true
    let result: TrainingReceipt
    try {
      result = saveTraining(draft)
    } catch (error) {
      console.error('Training could not be saved on this device:', error)
      setFailed(true)
      if (errorToast.current !== null) dismissToast(errorToast.current)
      errorToast.current = showToast(t('training.localError'), 'error')
      saving.current = false
      return
    }
    setFailed(false)
    if (errorToast.current !== null) {
      dismissToast(errorToast.current)
      errorToast.current = null
    }
    setReceipt(result)
    onSaved?.()
  }

  if (receipt) return <TrainingCompletion receipt={receipt} onDone={onBack} inline={inline} />

  return (
    <AcademyPage surface="training-log" title={t('training.title')} subtitle={t('training.quickIntro')} onBack={onBack} backLabel={t('common.back')}>
      <div className="academy-grid">
        <form className="academy-panel academy-form" onSubmit={handleSave}>
          <TrainingFields draft={draft} onChange={setDraft} today={today} />
          {failed && <p className="academy-error" role="alert">{t('training.localError')}</p>}
          <button className="academy-button" type="submit">{t(failed ? 'training.retry' : 'training.saveLocal')}</button>
          <p className="academy-hint">{t('training.localHint')}</p>
        </form>
        <aside className="academy-panel academy-stack">
          <span className="academy-eyebrow">{t('training.yourEffort')}</span>
          <h2>{t('training.noPerfect')}</h2>
          <p>{t('training.feelingsCount')}</p>
          <p className="academy-muted">{t('clubhouse.restBody')}</p>
        </aside>
      </div>
    </AcademyPage>
  )
}
