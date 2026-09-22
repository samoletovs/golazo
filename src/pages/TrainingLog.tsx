import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { TrainingFields } from '../components/training/TrainingFields'
import { TrainingCompletion } from '../components/training/TrainingCompletion'
import type { TrainingReceipt } from '../engine/training'
import type { TrainingType, TrainingEntry } from '../engine/types'
import '../clubhouse.css'

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
  const heading = useRef<HTMLHeadingElement>(null)
  const errorToast = useRef<number | null>(null)
  useEffect(() => { heading.current?.focus() }, [])
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
    <section className={`clubhouse training-view${inline ? ' training-inline' : ''}`} aria-labelledby="training-title">
      {onBack && <button className="club-link" onClick={onBack}>{t('common.back')}</button>}
      <header className="club-section-heading">
        <span className="club-eyebrow">{t('clubhouse.afterTraining')}</span>
        <h1 id="training-title" ref={heading} tabIndex={-1}>{t('training.title')}</h1>
        <p>{t('training.quickIntro')}</p>
      </header>
      <div className="club-two-column">
        <form className="club-panel training-form" onSubmit={handleSave}>
          <TrainingFields draft={draft} onChange={setDraft} today={today} />
          {failed && <p className="club-error" role="alert">{t('training.localError')}</p>}
          <button className="club-button" type="submit">{t(failed ? 'training.retry' : 'training.saveLocal')}</button>
          <p className="club-hint">{t('training.localHint')}</p>
        </form>
        <aside className="club-panel training-aside">
          <span className="club-eyebrow">{t('training.yourEffort')}</span>
          <h2>{t('training.noPerfect')}</h2>
          <p>{t('training.feelingsCount')}</p>
          <p className="club-muted">{t('clubhouse.restBody')}</p>
        </aside>
      </div>
    </section>
  )
}
