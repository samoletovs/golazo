import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  icon: string
  titleKey: string
  textKey: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, titleKey, textKey, actionLabel, onAction }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <p className="empty-state-title">{t(titleKey)}</p>
      <p className="empty-state-text">{t(textKey)}</p>
      {actionLabel && onAction && (
        <button className="btn-primary mt-2" onClick={onAction} style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
          {t(actionLabel)}
        </button>
      )}
    </div>
  )
}
