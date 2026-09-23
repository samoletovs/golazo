import { useTranslation } from 'react-i18next'

export function AcademyLoading({ label }: { label?: string }) {
  const { t } = useTranslation()
  return <div className="academy-loading" role="status" aria-label={label ?? t('common.loading')}>
    <div className="skeleton academy-skeleton-heading" /><div className="skeleton academy-skeleton-line" />
    <div className="skeleton academy-skeleton-panel" /><span className="sr-only">{label ?? t('common.loading')}</span>
  </div>
}

export function AcademyError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return <div className="academy-error" role="alert"><p>{message}</p>{onRetry && <button className="btn-choice" type="button" onClick={onRetry}>{t('academy.retry')}</button>}</div>
}

export function AcademyEmpty({ title, description, action }: { title: string; description: string; action?: { label: string; onClick: () => void } }) {
  return <div className="academy-empty"><h2>{title}</h2><p>{description}</p>{action && <button className="btn-primary" onClick={action.onClick}>{action.label}</button>}</div>
}
