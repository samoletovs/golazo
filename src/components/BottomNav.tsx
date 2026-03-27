import { useTranslation } from 'react-i18next'

interface BottomNavProps {
  active: string
  onNavigate: (page: string) => void
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--color-green-500)' : 'var(--color-text-muted)'
  const strokeWidth = active ? 2.2 : 1.8

  switch (name) {
    case 'dashboard':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'log':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      )
    case 'exercises':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
          <circle cx="12" cy="12" r="3" fill={active ? color : 'none'} />
        </svg>
      )
    case 'challenges':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
          <path d="M4 22h16" />
          <path d="M10 22V2h4v20" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        </svg>
      )
    case 'profile':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    default:
      return null
  }
}

const NAV_ITEMS = [
  { key: 'dashboard', labelKey: 'nav.dashboard' },
  { key: 'log', labelKey: 'nav.log' },
  { key: 'exercises', labelKey: 'nav.exercises' },
  { key: 'challenges', labelKey: 'nav.challenges' },
  { key: 'profile', labelKey: 'nav.profile' },
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
          <NavIcon name={item.key} active={active === item.key} />
          <span>{t(item.labelKey)}</span>
        </button>
      ))}
    </nav>
  )
}
