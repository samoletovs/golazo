import { useTranslation } from 'react-i18next'

interface BackButtonProps {
  onClick: () => void
  showLabel?: boolean
}

export function BackButton({ onClick, showLabel }: BackButtonProps) {
  const { t } = useTranslation()
  return (
    <button onClick={onClick} className="tap-target text-xl" aria-label={t('common.back')}>
      ←{showLabel && <span className="text-xs font-bold ml-1">{t('common.back')}</span>}
    </button>
  )
}
