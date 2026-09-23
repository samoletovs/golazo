import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { primaryNavigation, secondaryNavigation } from '../../academy/navigation'
import type { Page } from '../../academy/navigation'
import { AcademyIcon } from './AcademyIcon'
import { AcademyDialog } from './AcademyDialog'
import { readableClubColor } from '../../utils/teamTheme'

export function AcademyShell({ page, onNavigate, children }: { page: Page; onNavigate: (page: string) => void; children: ReactNode }) {
  const { t } = useTranslation()
  const { profile } = useApp()
  const [showMenu, setShowMenu] = useState(false)
  const shell = useRef<HTMLDivElement>(null)
  const navigation = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = navigation.current
    if (!element) return
    const measure = () => shell.current?.style.setProperty('--academy-nav-height', `${element.getBoundingClientRect().height}px`)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const primary = primaryNavigation(profile?.role)
  const secondary = secondaryNavigation(profile?.role)
  const active = page === 'activity' ? 'dashboard' : page
  const team = profile?.teams?.find(item => item.active && item.isPrimary) ?? profile?.teams?.find(item => item.active)
  const teamName = profile?.role === 'coach' ? profile.managedTeams?.[0]?.teamName : team?.name || profile?.team
  const identityColor = readableClubColor(team?.colors?.[0] ?? '#ff9b7b')
  const navigate = (target: string) => { setShowMenu(false); onNavigate(target) }
  return (
    <div ref={shell} className="academy-shell" data-academy-shell={profile?.role ?? 'player'}>
      <a className="academy-skip" href="#academy-main">{t('academy.skip')}</a>
      <header className="academy-masthead">
        <button className="academy-brand" onClick={() => navigate('dashboard')} aria-label={t('nav.dashboard')}>golazo<span>.</span></button>
        <nav ref={navigation} className="academy-primary-nav" aria-label={t('academy.navigation')}>
          {primary.map(item => <button key={item.page} className="academy-nav-item" onClick={() => navigate(item.page)} aria-current={active === item.page ? 'page' : undefined} data-page={item.page}>
            <AcademyIcon name={item.icon} /><span>{t(item.label)}</span>
          </button>)}
        </nav>
        <nav className="academy-secondary-nav" aria-label={t('academy.footballSpaces')}>
          {secondary.map(item => <button key={item.page} className="academy-nav-item" onClick={() => navigate(item.page)} aria-current={active === item.page ? 'page' : undefined} data-page={item.page}>
            <AcademyIcon name={item.icon} /><span>{t(item.label)}</span>
          </button>)}
        </nav>
        <div className="academy-rail-identity"><strong style={{ background: identityColor.background, color: identityColor.text }}>{profile?.role === 'player' ? profile.jerseyNumber ?? 'G' : 'G'}</strong><span>{profile?.name}</span><small>{teamName}</small></div>
        <button className="academy-menu-toggle" onClick={() => setShowMenu(true)} aria-label={t('academy.footballSpaces')}><AcademyIcon name="settings" /></button>
      </header>
      <div className="academy-workspace">
        <div className="academy-context"><span>{teamName || t('academy.yourFootball')}</span><button className="academy-player-link" onClick={() => navigate('profile')}>
          <span className="academy-shirt-number" style={{ background: identityColor.background, color: identityColor.text }}>{profile?.jerseyNumber ?? 'G'}</span><span>{profile?.name}<small>{profile?.positions?.join(' / ')}</small></span>
        </button></div>
        <main id="academy-main" tabIndex={-1}>{children}</main>
        <footer className="nl-footer"><p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p></footer>
      </div>
      {showMenu && <AcademyDialog surface="football-spaces" title={t('academy.footballSpaces')} onClose={() => setShowMenu(false)}>
        <div className="academy-menu-list">{secondary.map(item => <button key={item.page} className="academy-menu-link" data-page={item.page} onClick={() => navigate(item.page)}><AcademyIcon name={item.icon} />{t(item.label)}<span aria-hidden="true">→</span></button>)}</div>
      </AcademyDialog>}
    </div>
  )
}
