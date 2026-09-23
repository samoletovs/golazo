import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CoachSquadFilter } from '../components/CoachSquadFilter'
import { AcademyPage, AcademyPanel } from '../components/academy/AcademyPage'
import { AcademyEmpty } from '../components/academy/AcademyState'
import { AcademyIcon } from '../components/academy/AcademyIcon'
import { TacticalGraphic } from '../components/academy/TacticalGraphic'
import type { ManagedTeam } from '../engine/types'

interface CoachDashboardProps {
  teams: ManagedTeam[]
  selectedTeamIds: string[]
  onToggleTeam: (id: string) => void
  onNavigate: (page: 'roster' | 'training' | 'announce' | 'evaluate' | 'attendance' | 'challenges', teamId: string) => void
  onNavigateMulti: (page: 'training' | 'announce' | 'attendance', teamIds: string[]) => void
  onManageTeams: () => void
}
const ACTIONS = [
  { page: 'roster', label: 'coach.roster.title', icon: 'team' },
  { page: 'training', label: 'coach.training.title', icon: 'log' },
  { page: 'announce', label: 'coach.dashboard.announce', icon: 'diary' },
  { page: 'evaluate', label: 'coach.eval.title', icon: 'progress' },
  { page: 'attendance', label: 'coach.attendance.title', icon: 'check' },
  { page: 'challenges', label: 'teamChallenges.title', icon: 'trophy' },
] as const

export function CoachDashboard({ teams, selectedTeamIds, onToggleTeam, onNavigate, onNavigateMulti, onManageTeams }: CoachDashboardProps) {
  const { t } = useTranslation()
  const filtered = teams.filter(team => !selectedTeamIds.length || selectedTeamIds.includes(team.teamId))
  const groups = useMemo(() => {
    const map = new Map<string, ManagedTeam[]>()
    for (const team of filtered) {
      const name = team.clubName || team.teamName
      map.set(name, [...(map.get(name) ?? []), team])
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])
  return <AcademyPage surface="coach-home" title={t('coach.dashboard.title')}
    actions={<button className="academy-button secondary" onClick={onManageTeams}>{t('teams.manage')}</button>}>
    {!teams.length ? <AcademyEmpty title={t('coach.dashboard.noSquads')} description={t('coach.dashboard.noSquadsHint')} action={{ label: t('coach.onboarding.selectSquads'), onClick: onManageTeams }} />
      : <>
        <CoachSquadFilter teams={teams} selectedIds={selectedTeamIds} onToggle={onToggleTeam} />
        <div className="academy-grid">
          <div className="academy-stack">
            {groups.map(([name, squads]) => <section key={name}><h2 className="mb-5">{name}</h2>
              <div className="academy-stack">{squads.map(team => <AcademyPanel key={team.teamId} title={team.birthYear ? `${team.birthYear} ${team.teamLabel ?? ''}`.trim() : team.teamName}>
                <p className="academy-muted mb-5">{t(`coach.role.${team.role}`)}</p>
                <div className="academy-coach-actions">{ACTIONS.map(action => <button key={action.page} className="academy-menu-link" onClick={() => onNavigate(action.page, team.teamId)}>
                  <AcademyIcon name={action.icon} /><span>{t(action.label)}</span><span aria-hidden="true">→</span>
                </button>)}</div>
              </AcademyPanel>)}</div>
            </section>)}
          </div>
          <div className="academy-stack">
            <TacticalGraphic kind="pass" />
            {filtered.length > 1 && <AcademyPanel title={t('coach.dashboard.multiSquadActions')}>
              <div className="academy-menu-list">{(['training', 'announce', 'attendance'] as const).map(page => {
                const action = ACTIONS.find(item => item.page === page)!
                return <button key={page} className="academy-menu-link" onClick={() => onNavigateMulti(page, filtered.map(team => team.teamId))}><AcademyIcon name={action.icon} /><span>{t(action.label)}</span><span aria-hidden="true">→</span></button>
              })}</div>
            </AcademyPanel>}
          </div>
        </div>
      </>}
  </AcademyPage>
}
