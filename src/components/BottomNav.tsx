import { useTranslation } from 'react-i18next'

interface BottomNavProps {
  active: string
  onNavigate: (page: string) => void
  role?: 'player' | 'mentor' | 'coach'
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'var(--color-primary-dark)' : 'var(--color-text-muted)'
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
    case 'progress':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
    case 'exercises':
    case 'learn':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      )
    case 'profile':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'squads':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'schedule':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'stats':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    default:
      return null
  }
}

const PLAYER_NAV = [
  { key: 'dashboard', labelKey: 'nav.dashboard' },
  { key: 'log', labelKey: 'nav.log' },
  { key: 'progress', labelKey: 'nav.progress' },
  { key: 'learn', labelKey: 'nav.learn' },
  { key: 'profile', labelKey: 'nav.profile' },
]

const COACH_NAV = [
  { key: 'dashboard', labelKey: 'nav.dashboard' },
  { key: 'schedule', labelKey: 'nav.schedule' },
  { key: 'stats', labelKey: 'nav.stats' },
  { key: 'profile', labelKey: 'nav.profile' },
]

const MENTOR_NAV = [
  { key: 'dashboard', labelKey: 'nav.dashboard' },
  { key: 'schedule', labelKey: 'nav.schedule' },
  { key: 'progress', labelKey: 'nav.progress' },
  { key: 'profile', labelKey: 'nav.profile' },
]

/**
 * Mobile-first primary navigation.
 *
 * The visible tabs are role-aware: players see logging and learning actions,
 * while coaches and mentors get schedule/progress views that match their
 * support workflows.
 */
export function BottomNav({ active, onNavigate, role }: BottomNavProps) {
  const { t } = useTranslation()
  const items = role === 'coach' ? COACH_NAV : role === 'mentor' ? MENTOR_NAV : PLAYER_NAV

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
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
