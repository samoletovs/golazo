import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { readableClubColor } from '../../utils/teamTheme'

export function ClubhouseHeader() {
  const { profile } = useApp()
  const { t } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const team = profile?.teams?.find(item => item.active && item.isPrimary) ?? profile?.teams?.find(item => item.active)
  const colors = readableClubColor(team?.colors?.[0])
  const style: CSSProperties & Record<'--club-color' | '--club-on-color', string> = {
    '--club-color': colors.background, '--club-on-color': colors.text,
  }
  return (
    <header className="club-welcome">
      <div className="club-welcome-copy">
        <p className="club-wordmark">golazo<span>.</span></p>
        <span className="club-eyebrow">{t('clubhouse.yourPace')}</span>
        <h1 ref={heading} tabIndex={-1}>{t('clubhouse.welcome', { name: profile?.name?.split(' ')[0] || t('clubhouse.player') })}</h1>
        <p>{t('clubhouse.intro')}</p>
      </div>
      <div className="club-identity" style={style}>
        <svg viewBox="0 0 260 280" aria-hidden="true" className="club-jersey">
          <path d="m82 24-54 25L6 98l40 22 19-23v166h130V97l19 23 40-22-22-49-54-25c-6 21-90 21-96 0Z" fill="var(--club-color)" stroke="var(--club-ink)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M105 30q25 18 50 0M14 84l37 19m158 0 37-19" fill="none" stroke="var(--club-coral)" strokeWidth="10" />
          <path d="M86 59v183m88-183v183" stroke="var(--club-on-color)" strokeWidth="3" opacity=".5" />
          <text x="130" y="182" textAnchor="middle" fill="var(--club-on-color)" fontSize="80" fontWeight="800">{profile?.jerseyNumber ?? 'G'}</text>
        </svg>
        <p className="club-team-name">{team?.name || profile?.team || t('clubhouse.yourFootball')}</p>
      </div>
    </header>
  )
}
