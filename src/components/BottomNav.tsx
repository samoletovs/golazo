import { useTranslation } from 'react-i18next'

interface BottomNavProps {
  active: string
  onNavigate: (page: string) => void
}

const NAV_ITEMS = [
  { key: 'dashboard', icon: '🏠', labelKey: 'nav.dashboard' },
  { key: 'log', icon: '✏️', labelKey: 'nav.log' },
  { key: 'exercises', icon: '⚽', labelKey: 'nav.exercises' },
  { key: 'challenges', icon: '🏆', labelKey: 'nav.challenges' },
  { key: 'profile', icon: '👤', labelKey: 'nav.profile' },
]

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { t } = useTranslation()

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className="bottom-nav-item"
          data-active={active === item.key}
          onClick={() => onNavigate(item.key)}
          aria-label={t(item.labelKey)}
          aria-current={active === item.key ? 'page' : undefined}
        >
          <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
          <span>{t(item.labelKey)}</span>
        </button>
      ))}
    </nav>
  )
}
