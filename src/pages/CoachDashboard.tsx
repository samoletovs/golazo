import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CoachSquadFilter } from '../components/CoachSquadFilter'
import type { ManagedTeam } from '../engine/types'

interface CoachDashboardProps {
  teams: ManagedTeam[]
  selectedTeamIds: string[]
  onToggleTeam: (id: string) => void
  onNavigate: (page: 'roster' | 'training' | 'announce' | 'evaluate' | 'attendance', squadId: string) => void
  onManageTeams: () => void
}

export function CoachDashboard({ teams, selectedTeamIds, onToggleTeam, onNavigate, onManageTeams }: CoachDashboardProps) {
  const { t } = useTranslation()

  // Filter teams by selection
  const filteredTeams = useMemo(() => {
    if (selectedTeamIds.length === 0) return teams
    return teams.filter((s) => selectedTeamIds.includes(s.teamId))
  }, [teams, selectedTeamIds])

  // Group filtered teams by club
  const teamsByClub = useMemo(() => {
    const map = new Map<string, ManagedTeam[]>()
    for (const sq of filteredTeams) {
      const key = sq.clubName || sq.teamName
      const arr = map.get(key) ?? []
      arr.push(sq)
      map.set(key, arr)
    }
    return [...map.entries()]
      .map(([clubName, items]) => ({ clubName, squads: items }))
      .sort((a, b) => a.clubName.localeCompare(b.clubName))
  }, [teams])

  const totalTeams = teams.length

  if (teams.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-32">
        <h2 className="text-xl font-extrabold heading-display">📋 {t('coach.dashboard.title')}</h2>
        <div className="card text-center py-8 animate-fade-up">
          <span className="text-5xl mb-3 block">🏟️</span>
          <p className="text-sm font-bold mb-2">{t('coach.dashboard.noSquads')}</p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {t('coach.dashboard.noSquadsHint')}
          </p>
          <button
            className="btn-primary text-sm px-4 py-2 rounded-xl tap-target"
            onClick={onManageTeams}
          >
            {t('coach.onboarding.selectSquads')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold heading-display">📋 {t('coach.dashboard.title')}</h2>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
          {totalTeams} {t('teams.squads').toLowerCase()}
        </span>
      </div>

      {/* Squad filter */}
      <CoachSquadFilter teams={teams} selectedIds={selectedTeamIds} onToggle={onToggleTeam} />

      {/* Squad cards grouped by club */}
      {teamsByClub.map(({ clubName, squads: clubTeams }) => (
        <div key={clubName}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {clubName}
          </p>
          <div className="flex flex-col gap-2">
            {clubTeams.map((sq) => {
              const label = sq.birthYear ? `${sq.birthYear} ${sq.teamLabel ?? ''}`.trim() : sq.teamName
              return (
                <div key={sq.teamId} className="card animate-fade-up">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg">⚽</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate heading-display">{label}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {t(`coach.role.${sq.role}`)}
                      </p>
                    </div>
                  </div>

                  {/* Quick action buttons for this squad */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      className="flex flex-col items-center gap-1 py-2 rounded-xl tap-target"
                      style={{ background: 'var(--color-glass-hover)' }}
                      onClick={() => onNavigate('roster', sq.teamId)}
                    >
                      <span className="text-sm">👥</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {t('coach.roster.title')}
                      </span>
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 py-2 rounded-xl tap-target"
                      style={{ background: 'var(--color-glass-hover)' }}
                      onClick={() => onNavigate('training', sq.teamId)}
                    >
                      <span className="text-sm">📝</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {t('coach.training.title')}
                      </span>
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 py-2 rounded-xl tap-target"
                      style={{ background: 'var(--color-glass-hover)' }}
                      onClick={() => onNavigate('announce', sq.teamId)}
                    >
                      <span className="text-sm">📢</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {t('coach.dashboard.announce')}
                      </span>
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 py-2 rounded-xl tap-target"
                      style={{ background: 'var(--color-glass-hover)' }}
                      onClick={() => onNavigate('attendance', sq.teamId)}
                    >
                      <span className="text-sm">✅</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                        {t('coach.attendance.title')}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Global quick actions */}
      <div>
        <p className="section-label mb-2">{t('coach.dashboard.quickActions')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('evaluate', teams[0].teamId)}
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs font-bold">{t('coach.dashboard.evaluate')}</span>
          </button>
          <button
            className="card tap-target flex flex-col items-center gap-2 py-4"
            onClick={() => onNavigate('training', teams[0].teamId)}
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs font-bold">{t('coach.dashboard.planTraining')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
