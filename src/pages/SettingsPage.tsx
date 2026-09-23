import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { ThemePicker } from '../components/ThemePicker'
import { AcademyPage, AcademyPanel } from '../components/academy/AcademyPage'
import { AcademyDialog } from '../components/academy/AcademyDialog'
import type { AccountRole, Language } from '../engine/types'

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'en', label: 'English' }, { key: 'lv', label: 'Latviešu' },
  { key: 'ru', label: 'Русский' }, { key: 'es', label: 'Español' },
  { key: 'lt', label: 'Lietuvių' }, { key: 'et', label: 'Eesti' },
]
const ROLES: { role: AccountRole; label: string }[] = [
  { role: 'player', label: 'login.asPlayer' }, { role: 'mentor', label: 'login.asMentor' }, { role: 'coach', label: 'coach.role' },
]

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { profile, setProfile, resetState } = useApp()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [error, setError] = useState(false)

  async function language(lang: Language) {
    try {
      localStorage.setItem('golazo-lang', lang)
      await i18n.changeLanguage(lang)
    } catch (cause) {
      console.error('Language preference could not be saved:', cause)
      showToast(t('academy.preferenceError'), 'error')
    }
  }
  function role(next: AccountRole) {
    if (!profile || profile.role === next) return
    try { setProfile({ ...profile, role: next }) }
    catch (cause) {
      console.error('Account role could not be saved:', cause)
      showToast(t('academy.preferenceError'), 'error')
    }
  }
  function reset() {
    try {
      resetState()
      window.location.reload()
    } catch (cause) {
      console.error('Local data could not be reset:', cause)
      setError(true)
      showToast(t('academy.preferenceError'), 'error')
    }
  }
  return <AcademyPage surface="settings" title={t('nav.settings')}>
    <div className="academy-grid equal">
      <div className="academy-stack">
        <AcademyPanel title={t('profile.language')}>
          <div className="grid grid-cols-2 gap-3">{LANGUAGES.map(item => <button key={item.key} className="academy-choice" aria-pressed={i18n.language === item.key} onClick={() => void language(item.key)}>{item.label}</button>)}</div>
        </AcademyPanel>
        <ThemePicker />
      </div>
      <AcademyPanel title={t('profile.account')}>
        <div className="academy-stack">
          {user && <p>{user.userDetails}</p>}
          {profile && <fieldset className="academy-field"><legend>{t('profile.switchRole')}</legend><div className="academy-actions">{ROLES.map(item => <button key={item.role} className="academy-choice" aria-pressed={profile.role === item.role} onClick={() => role(item.role)}>{t(item.label)}</button>)}</div></fieldset>}
          {user && <button className="academy-button secondary" onClick={logout}>{t('profile.logout')}</button>}
          <button className="academy-link" onClick={() => setConfirmingReset(true)}>{t('profile.reset')}</button>
        </div>
      </AcademyPanel>
    </div>
    {confirmingReset && <AcademyDialog surface="reset-confirmation" title={t('profile.reset')} onClose={() => setConfirmingReset(false)}>
      <div className="academy-stack"><p>{t('profile.resetConfirm')}</p>
        {error && <p role="alert" className="academy-error">{t('academy.preferenceError')}</p>}
        <div className="academy-actions"><button className="academy-button secondary" onClick={() => setConfirmingReset(false)}>{t('common.cancel')}</button><button className="academy-button" onClick={reset}>{t('profile.reset')}</button></div>
      </div>
    </AcademyDialog>}
  </AcademyPage>
}
