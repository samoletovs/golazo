import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActivityReceipt } from '../../engine/activitySave'
import { AcademyPage } from './AcademyPage'
import { AcademyIcon } from './AcademyIcon'

export function AcademySaved({ receipt, title, onDone }: { receipt: ActivityReceipt; title: string; onDone?: () => void }) {
  const { t } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  return <AcademyPage surface="activity-saved">
    <section className="academy-panel academy-stack">
      <AcademyIcon name="check" />
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      <p role="status" className="academy-complete-label">{t(receipt.alreadySaved ? 'training.alreadySaved' : 'academy.savedLocal')}</p>
      {receipt.awardedXp > 0 && <p className="academy-reward">+{receipt.awardedXp} XP</p>}
      <p>{t('training.finishBody')}</p><p className="academy-hint">{t('training.localHint')}</p>
      {onDone && <button className="academy-button" onClick={onDone}>{t('training.finish')}</button>}
    </section>
  </AcademyPage>
}
