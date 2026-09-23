import { useTranslation } from 'react-i18next'
import { CoachSquadFilter } from '../components/CoachSquadFilter'
import { AcademyPage, AcademyPanel } from '../components/academy/AcademyPage'
import type { ManagedTeam } from '../engine/types'

interface CoachStatsPageProps {
  squads: ManagedTeam[]
  selectedIds: string[]
  onToggleSquad: (id: string) => void
}

export function CoachStatsPage({ squads, selectedIds, onToggleSquad }: CoachStatsPageProps) {
  const { t } = useTranslation()
  const filtered = squads.filter(team => !selectedIds.length || selectedIds.includes(team.teamId))
  return <AcademyPage surface="coach-statistics" title={t('nav.stats')}>
    <CoachSquadFilter teams={squads} selectedIds={selectedIds} onToggle={onToggleSquad} />
    <div className="academy-grid">
      <AcademyPanel title={t('coach.stats.perSquad')}>
        {filtered.length ? <ul className="academy-stack">{filtered.map(team => <li key={team.teamId}>
          <h3>{team.teamName}</h3><p className="academy-muted mt-2">{t(`coach.role.${team.role}`)}</p>
        </li>)}</ul> : <p>{t('coach.dashboard.noSquads')}</p>}
      </AcademyPanel>
      <AcademyPanel title={t('academy.statisticsUnavailable')}>
        <p>{t('academy.statisticsUnavailableBody')}</p>
        <ul className="academy-stack mt-6">{['results', 'wellbeing', 'training', 'development'].map(section => <li className="academy-muted" key={section}>{t(`coach.stats.${section}`)}</li>)}</ul>
      </AcademyPanel>
    </div>
  </AcademyPage>
}
