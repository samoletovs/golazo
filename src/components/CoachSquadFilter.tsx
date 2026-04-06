import { useTranslation } from 'react-i18next'
import type { ManagedTeam } from '../engine/types'

interface CoachSquadFilterProps {
  teams: ManagedTeam[]
  selectedIds: string[]
  onToggle: (teamId: string) => void
}

export function CoachSquadFilter({ teams, selectedIds, onToggle }: CoachSquadFilterProps) {
  const { t } = useTranslation()
  if (teams.length <= 1) return null

  const allSelected = selectedIds.length === 0 || selectedIds.length === teams.length

  return (
    <div className="h-scroll gap-1.5 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
      {/* "All" chip */}
      <button
        className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 tap-target transition-all"
        style={{
          scrollSnapAlign: 'start',
          background: allSelected ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
          color: allSelected ? '#fff' : 'var(--color-text-muted)',
        }}
        onClick={() => {
          // Deselect all = show all
          for (const sq of teams) {
            if (selectedIds.includes(sq.teamId)) onToggle(sq.teamId)
          }
        }}
      >
        {t('coach.filter.all')}
      </button>

      {/* Per-squad chips */}
      {teams.map((sq) => {
        const isSelected = selectedIds.includes(sq.teamId)
        const label = sq.birthYear
          ? `${sq.clubName} ${sq.birthYear} ${sq.teamLabel ?? ''}`.trim()
          : sq.teamName
        // Shorten label for chip display
        const shortLabel = sq.birthYear
          ? `${sq.birthYear} ${sq.teamLabel ?? ''}`.trim()
          : sq.teamName
        return (
          <button
            key={sq.teamId}
            className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 tap-target transition-all"
            style={{
              scrollSnapAlign: 'center',
              background: isSelected && !allSelected ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
              color: isSelected && !allSelected ? '#fff' : 'var(--color-text-muted)',
            }}
            title={label}
            onClick={() => onToggle(sq.teamId)}
            aria-pressed={isSelected}
          >
            {shortLabel}
          </button>
        )
      })}
    </div>
  )
}
