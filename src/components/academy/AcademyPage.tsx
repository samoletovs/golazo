import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface AcademyPageProps {
  surface: string
  title?: string
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  onBack?: () => void
  backLabel?: string
}

export function AcademyPage({ surface, title, subtitle, actions, children, className = '', onBack, backLabel }: AcademyPageProps) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [surface])
  return (
    <section className={`academy-page ${className}`.trim()} data-academy-surface={surface} aria-labelledby={title ? id : undefined}>
      {onBack && <button type="button" className="academy-link" onClick={onBack}>{backLabel}<span aria-hidden="true">←</span></button>}
      {title && <header className="academy-page-heading">
        <div><h1 id={id} ref={heading} tabIndex={-1}>{title}</h1>{subtitle && <div className="academy-subtitle">{subtitle}</div>}</div>
        {actions && <div className="academy-actions">{actions}</div>}
      </header>}
      {children}
    </section>
  )
}

export function AcademyPanel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return <section className={`academy-panel ${className}`.trim()}>{title && <h2>{title}</h2>}{children}</section>
}
