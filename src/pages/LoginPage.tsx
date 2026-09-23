import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { TacticalGraphic } from '../components/academy/TacticalGraphic'
import { AcademyIcon } from '../components/academy/AcademyIcon'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return <main className="academy-welcome" data-academy-surface="visitor-login">
    <section className="academy-welcome-story">
      <p className="academy-brand">golazo<span>.</span></p>
      <div><span className="academy-eyebrow">{t('academy.yourFootball')}</span><h1>{t('academy.weekTitle')}</h1><p>{t('login.tagline')}</p></div>
      <TacticalGraphic kind="pass" />
    </section>
    <section className="academy-welcome-form">
      <h2>{t('onboarding.whoAreYou')}</h2>
      <div className="academy-menu-list">{([
        { name: 'login.asPlayer', description: 'login.playerDesc', icon: 'log' },
        { name: 'login.asMentor', description: 'login.mentorDesc', icon: 'team' },
        { name: 'login.asCoach', description: 'login.coachDesc', icon: 'schedule' },
      ] as const).map(role => <button key={role.name} className="login-card" onClick={login} aria-label={t(role.name)}>
        <AcademyIcon name={role.icon} /><span><strong>{t(role.name)}</strong><small className="block academy-muted mt-2">{t(role.description)}</small></span><span aria-hidden="true">→</span>
      </button>)}</div>
      <p className="academy-muted">{t('login.googleNote')}</p>
      {local && <button className="academy-link" onClick={() => window.dispatchEvent(new CustomEvent('golazo-skip-login'))}>{t('login.skip')}</button>}
      <footer className="nl-footer"><p>An experiment by <a href="https://naurolabs.com" target="_blank" rel="noopener noreferrer">nauro<span>Labs</span></a></p></footer>
    </section>
  </main>
}
