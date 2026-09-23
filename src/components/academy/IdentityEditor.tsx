import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { useToast } from '../../contexts/ToastContext'
import { POSITIONS } from '../../engine/types'
import type { PlayerProfile } from '../../engine/types'
import { AcademyDialog } from './AcademyDialog'

const COUNTRIES = ['LV', 'EE', 'LT', 'PL', 'FI', 'SE', 'DE', 'OTHER']
const FEET = [{ value: 'right', label: 'onboarding.footRight' }, { value: 'left', label: 'onboarding.footLeft' }, { value: 'both', label: 'onboarding.footBoth' }] as const

export function IdentityEditor({ profile, onClose }: { profile: PlayerProfile; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { setProfile } = useApp()
  const { showToast, dismissToast } = useToast()
  const [draft, setDraft] = useState(profile)
  const [jersey, setJersey] = useState(profile.jerseyNumber === undefined ? '' : String(profile.jerseyNumber))
  const [error, setError] = useState('')
  const saving = useRef(false)
  const errorToast = useRef<number | null>(null)
  useEffect(() => () => { if (errorToast.current !== null) dismissToast(errorToast.current) }, [dismissToast])
  const countries = profile.country && !COUNTRIES.includes(profile.country) ? [profile.country, ...COUNTRIES] : COUNTRIES
  const regionNames = new Intl.DisplayNames([i18n.language], { type: 'region' })
  const today = new Date().toISOString().slice(0, 10)
  function fail(message: string) {
    setError(message)
    if (errorToast.current !== null) dismissToast(errorToast.current)
    errorToast.current = showToast(message, 'error')
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current) return
    if (!draft.name.trim() || !draft.positions.length) {
      fail(t('academy.identityRequired'))
      return
    }
    saving.current = true
    try {
      setProfile({ ...draft, name: draft.name.trim(), city: draft.city?.trim() || undefined, country: draft.country || undefined, jerseyNumber: jersey === '' ? undefined : Number(jersey) })
    } catch (cause) {
      console.error('Player identity could not be saved:', cause)
      fail(t('academy.saveError'))
      saving.current = false
      return
    }
    if (errorToast.current !== null) dismissToast(errorToast.current)
    showToast(t('academy.savedLocal'), 'success')
    onClose()
  }
  return <AcademyDialog surface="player-identity-editor" title={t('academy.editIdentity')} onClose={onClose} wide>
    <form className="academy-form" onSubmit={save}>
      <div className="academy-grid equal">
        <label className="academy-field"><span>{t('onboarding.name')}</span><input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} autoComplete="name" /></label>
        <label className="academy-field"><span>{t('onboarding.birthDate')}</span><input required type="date" max={today} value={draft.birthDate} onChange={event => setDraft({ ...draft, birthDate: event.target.value })} /></label>
        <label className="academy-field"><span>{t('onboarding.country')}</span><select value={draft.country ?? ''} onChange={event => setDraft({ ...draft, country: event.target.value })}>
          <option value="">{t('onboarding.country')}</option>
          {countries.map(country => <option key={country} value={country}>{country === 'OTHER' ? t('academy.other') : /^[A-Z]{2}$/.test(country) ? regionNames.of(country) : country}</option>)}
        </select></label>
        <label className="academy-field"><span>{t('onboarding.city')}</span><input value={draft.city ?? ''} onChange={event => setDraft({ ...draft, city: event.target.value })} autoComplete="address-level2" /></label>
        <label className="academy-field"><span>{t('onboarding.jerseyNumber')}</span><input type="number" min="1" max="99" step="1" value={jersey} onChange={event => setJersey(event.target.value)} /></label>
      </div>
      <fieldset className="academy-field"><legend>{t('onboarding.positions')}</legend><div className="academy-position-options">
        {Object.values(POSITIONS).map(position => <label key={position}><input type="checkbox" checked={draft.positions.includes(position)} onChange={event => setDraft({ ...draft, positions: event.target.checked ? [...draft.positions, position] : draft.positions.filter(value => value !== position) })} />{position}</label>)}
      </div></fieldset>
      <fieldset className="academy-field"><legend>{t('onboarding.dominantFoot')}</legend><div className="academy-position-options">
        {FEET.map(foot => <label key={foot.value}><input type="radio" name="dominant-foot" checked={draft.dominantFoot === foot.value} onChange={() => setDraft({ ...draft, dominantFoot: foot.value })} />{t(foot.label)}</label>)}
      </div></fieldset>
      {error && <p className="academy-error" role="alert">{error}</p>}
      <p className="academy-hint">{t('training.localHint')}</p>
      <button className="academy-button" type="submit">{t('common.save')}</button>
    </form>
  </AcademyDialog>
}
