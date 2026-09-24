import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrainingReceipt } from '../../engine/training'
import { TrainingProgress } from './TrainingProgress'
import { AcademyPage } from '../academy/AcademyPage'

export function TrainingCompletion({ receipt, onDone }: { receipt: TrainingReceipt; onDone?: () => void; inline?: boolean }) {
  const { t, i18n } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const { entry } = receipt
  return (
    <AcademyPage surface="training-completion">
      <header className="academy-page-heading">
        <div><p className="academy-complete-label" role="status">{t(receipt.alreadySaved ? 'training.alreadySaved' : 'training.savedLocal')}</p>
        <h1 ref={heading} tabIndex={-1}>{t('training.onTheBoard')}</h1>
        <p>{new Date(`${entry.date.slice(0, 10)}T12:00:00Z`).toLocaleDateString(i18n.language)} · {t(`training.type.${entry.type}`)} · {t('training.minutes', { min: entry.durationMinutes })}</p></div>
      </header>
      <div className="academy-grid equal">
        <section className="academy-panel academy-stack">
          {receipt.awardedXp > 0 && <p className="academy-reward">{t('training.earnedXp', { xp: receipt.awardedXp })}</p>}
          {receipt.xp.level > receipt.previousXp.level && <p>{t('training.newLevel', { level: receipt.xp.level })}</p>}
          <h2>{t('clubhouse.yourProgress')}</h2>
          <TrainingProgress />
        </section>
        <section className="academy-panel academy-stack">
          <h2>{t(entry.notes.trim() ? 'training.yourWords' : 'training.effortRemembered')}</h2>
          {entry.notes.trim() && <blockquote className="training-reflection">{entry.notes}</blockquote>}
          <p>{t('training.finishBody')}</p>
          <p className="academy-hint">{t('training.localHint')}</p>
          {onDone && <button className="academy-button" onClick={onDone}>{t('training.finish')}</button>}
        </section>
      </div>
    </AcademyPage>
  )
}
