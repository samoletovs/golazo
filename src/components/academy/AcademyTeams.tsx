import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { useToast } from '../../contexts/ToastContext'
import { AcademyPanel } from './AcademyPage'

export function AcademyTeams({ onManage }: { onManage: () => void }) {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()
  const { showToast } = useToast()
  function primary(id: string) {
    if (!profile) return
    const selected = profile.teams?.find(team => team.id === id)
    if (!selected || selected.isPrimary) return
    try { setProfile({ ...profile, team: selected.name, teams: profile.teams?.map(team => ({ ...team, isPrimary: team.id === id })) }) }
    catch (cause) {
      console.error('Primary team could not be saved:', cause)
      showToast(t('academy.preferenceError'), 'error')
    }
  }
  return <AcademyPanel title={t('teams.title')}>
    <div className="academy-stack">
      {profile?.role === 'coach' ? <>
        {profile.managedTeams?.map(team => <div key={team.teamId} className="academy-menu-link"><strong>{team.teamName}</strong><span>{team.role ? t(`coach.role.${team.role}`) : ''}</span></div>)}
      </> : <>
        <p className="academy-muted">{t('teams.tapToSetMain')}</p>
        {profile?.teams?.filter(team => team.active).map(team => <button key={team.id} className="academy-menu-link" aria-pressed={team.isPrimary} onClick={() => primary(team.id)}>
          {team.colors?.[0] && <span className="academy-team-swatch" style={{ background: team.colors[0] }} aria-hidden="true" />}
          <span><strong>{team.name}</strong><small className="block academy-muted">{Array.isArray(team.position) ? team.position.join(' / ') : team.position}</small></span>
          <span aria-hidden="true">{team.isPrimary ? '★' : '☆'}</span>
        </button>)}
      </>}
      <button className="academy-button secondary" onClick={onManage}>{t('teams.manage')}</button>
    </div>
  </AcademyPanel>
}
