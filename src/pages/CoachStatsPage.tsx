import { useTranslation } from 'react-i18next'
import { CoachSquadFilter } from '../components/CoachSquadFilter'
import type { ManagedTeam } from '../engine/types'

interface CoachStatsPageProps {
  squads: ManagedTeam[]
  selectedIds: string[]
  onToggleSquad: (id: string) => void
}

export function CoachStatsPage({ squads, selectedIds, onToggleSquad }: CoachStatsPageProps) {
  const { t } = useTranslation()
  const filtered = selectedIds.length > 0 ? squads.filter((s) => selectedIds.includes(s.teamId)) : squads
  const teamCount = filtered.length

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold heading-display">📊 {t('nav.stats')}</h2>

      {/* Squad filter */}
      <CoachSquadFilter teams={squads} selectedIds={selectedIds} onToggle={onToggleSquad} />

      {squads.length === 0 ? (
        <div className="card text-center py-8">
          <span className="text-5xl mb-3 block">📊</span>
          <p className="text-sm font-bold">{t('coach.dashboard.noSquads')}</p>
        </div>
      ) : (
        <>
          {/* ── Team Results ── */}
          <div className="card animate-fade-up">
            <p className="section-label mb-3">{t('coach.stats.results')}</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data" style={{ color: 'var(--color-primary-dark)' }}>0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.matchesPlayed')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-success-bg)' }}>
                <p className="text-lg font-black font-data" style={{ color: 'var(--color-primary-dark)' }}>0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.wins')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-amber-bg)' }}>
                <p className="text-lg font-black font-data" style={{ color: 'var(--color-amber-text)' }}>0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.draws')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-error-bg)' }}>
                <p className="text-lg font-black font-data" style={{ color: 'var(--color-danger)' }}>0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.losses')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.goalsScored')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.goalsConceded')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">—</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.cleanSheets')}</p>
              </div>
            </div>
          </div>

          {/* ── Wellbeing (THE differentiator) ── */}
          <div className="card animate-fade-up">
            <p className="section-label mb-3">🧠 {t('coach.stats.wellbeing')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="py-3 rounded-xl text-center" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-2xl mb-1">—</p>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.teamMood')}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.last30days')}</p>
              </div>
              <div className="py-3 rounded-xl text-center" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-2xl mb-1">—</p>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.teamEnergy')}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.last30days')}</p>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--color-success-bg)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                {t('coach.dashboard.noAlerts')}
              </p>
            </div>
          </div>

          {/* ── Training & Activity ── */}
          <div className="card animate-fade-up">
            <p className="section-label mb-3">⚽ {t('coach.stats.training')}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.sessions')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">—</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.attendanceAvg')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">—</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.perWeek')}</p>
              </div>
            </div>

            {/* Focus area distribution */}
            <p className="text-xs font-bold mt-3 mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {t('coach.stats.focusAreas')}
            </p>
            <div className="flex gap-1 rounded-lg overflow-hidden h-3">
              <div style={{ width: '25%', background: 'var(--color-cat-technical)' }} />
              <div style={{ width: '25%', background: 'var(--color-cat-physical)' }} />
              <div style={{ width: '25%', background: 'var(--color-cat-tactical)' }} />
              <div style={{ width: '25%', background: 'var(--color-cat-mental)' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'var(--color-cat-technical)' }}>{t('coach.eval.technical')}</span>
              <span className="text-[10px]" style={{ color: 'var(--color-cat-physical)' }}>{t('coach.eval.physical')}</span>
              <span className="text-[10px]" style={{ color: 'var(--color-cat-tactical)' }}>{t('coach.eval.tactical')}</span>
              <span className="text-[10px]" style={{ color: 'var(--color-cat-mental)' }}>{t('coach.eval.mental')}</span>
            </div>
          </div>

          {/* ── Player Development (6 categories) ── */}
          <div className="card animate-fade-up">
            <p className="section-label mb-3">📈 {t('coach.stats.development')}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['technical', 'physical', 'tactical', 'mental', 'performance', 'knowledge'] as const).map((cat) => (
                <div key={cat} className="py-2.5 rounded-xl text-center" style={{ background: 'var(--color-glass-hover)' }}>
                  <p className="text-lg font-black font-data">—</p>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: `var(--color-cat-${cat}, var(--color-text-muted))` }}>
                    {t(`coach.eval.${cat}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Squad Info ── */}
          <div className="card animate-fade-up">
            <p className="section-label mb-3">👥 {t('coach.stats.squadInfo')}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">0</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.players')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">—</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.avgAge')}</p>
              </div>
              <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                <p className="text-lg font-black font-data">—</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.stats.engagement')}</p>
              </div>
            </div>
          </div>

          {/* Per-squad breakdown */}
          {teamCount > 1 && (
            <div>
              <p className="section-label mb-2">{t('coach.stats.perSquad')}</p>
              <div className="flex flex-col gap-2">
                {filtered.map((sq) => (
                  <div key={sq.teamId} className="card flex items-center gap-3 p-3">
                    <span className="text-lg">⚽</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{sq.teamName}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t(`coach.role.${sq.role}`)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black font-data">0</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.dashboard.players')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
