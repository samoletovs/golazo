import { useEffect, useId, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface AcademyDialogProps {
  surface: string
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  dismissOnBackdrop?: boolean
}

export function AcademyDialog({ surface, title, children, onClose, wide = false, dismissOnBackdrop = true }: AcademyDialogProps) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    element?.showModal()
    return () => {
      element?.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  function backdrop(event: MouseEvent<HTMLDialogElement>) {
    if (!dismissOnBackdrop || event.target !== event.currentTarget) return
    const box = event.currentTarget.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose()
  }
  return (
    <dialog ref={dialog} className={`academy-dialog${wide ? ' academy-dialog-wide' : ''}`} data-academy-dialog={surface}
      aria-labelledby={id} onClick={backdrop} onCancel={event => { event.preventDefault(); onClose() }}>
      <header className="academy-dialog-heading">
        <h2 id={id}>{title}</h2>
        <button type="button" className="academy-dialog-close" onClick={onClose} aria-label={t('common.close')}>×</button>
      </header>
      <div className="academy-dialog-content">{children}</div>
    </dialog>
  )
}
