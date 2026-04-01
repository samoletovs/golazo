import { useTranslation } from 'react-i18next'

interface SectionHeaderProps {
  icon?: string
  titleKey: string
  action?: React.ReactNode
}

export function SectionHeader({ icon, titleKey, action }: SectionHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-lg">{icon}</span>}
      <p className="section-label">{t(titleKey)}</p>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}
