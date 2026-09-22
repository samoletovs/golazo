import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrainingReceipt } from '../../engine/training'
import { TrainingProgress } from './TrainingProgress'

export function TrainingCompletion({ receipt, onDone, inline }: { receipt: TrainingReceipt; onDone?: () => void; inline?: boolean }) {
  const { t, i18n } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const { entry } = receipt
  return (
    <section className={`clubhouse training-view${inline ? ' training-inline' : ''}`}>
      <header className="club-section-heading">
        <p className="club-complete-label" role="status">{t(receipt.alreadySaved ? 'training.alreadySaved' : 'training.savedLocal')}</p>
        <h1 ref={heading} tabIndex={-1}>{t('training.onTheBoard')}</h1>
        <p>{new Date(`${entry.date.slice(0, 10)}T12:00:00Z`).toLocaleDateString(i18n.language)} · {t(`training.type.${entry.type}`)} · {t('training.minutes', { min: entry.durationMinutes })}</p>
      </header>
      <div className="club-two-column">
        <section className="club-panel training-result">
          {receipt.awardedXp > 0 && <p className="club-reward">{t('training.earnedXp', { xp: receipt.awardedXp })}</p>}
          {receipt.xp.level > receipt.previousXp.level && <p>{t('training.newLevel', { level: receipt.xp.level })}</p>}
          <h2>{t('clubhouse.yourProgress')}</h2>
          <TrainingProgress />
        </section>
        <section className="club-panel">
          <h2>{t(entry.notes.trim() ? 'training.yourWords' : 'training.effortRemembered')}</h2>
          {entry.notes.trim() && <blockquote className="training-reflection">{entry.notes}</blockquote>}
          <p>{t('training.finishBody')}</p>
          <p className="club-hint">{t('training.localHint')}</p>
          {onDone && <button className="club-button" onClick={onDone}>{t('training.finish')}</button>}
        </section>
      </div>
    </section>
  )
}
