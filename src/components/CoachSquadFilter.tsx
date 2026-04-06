import { useTranslation } from 'react-i18next'
import type { ManagedSquad } from '../engine/types'

interface CoachSquadFilterProps {
  squads: ManagedSquad[]
  selectedIds: string[]
  onToggle: (squadId: string) => void
}

export function CoachSquadFilter({ squads, selectedIds, onToggle }: CoachSquadFilterProps) {
  const { t } = useTranslation()
  if (squads.length <= 1) return null

  const allSelected = selectedIds.length === 0 || selectedIds.length === squads.length

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
          for (const sq of squads) {
            if (selectedIds.includes(sq.squadId)) onToggle(sq.squadId)
          }
        }}
      >
        {t('coach.filter.all')}
      </button>

      {/* Per-squad chips */}
      {squads.map((sq) => {
        const isSelected = selectedIds.includes(sq.squadId)
        const label = sq.birthYear
          ? `${sq.clubName} ${sq.birthYear} ${sq.squadLabel ?? ''}`.trim()
          : sq.squadName
        // Shorten label for chip display
        const shortLabel = sq.birthYear
          ? `${sq.birthYear} ${sq.squadLabel ?? ''}`.trim()
          : sq.squadName
        return (
          <button
            key={sq.squadId}
            className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 tap-target transition-all"
            style={{
              scrollSnapAlign: 'center',
              background: isSelected && !allSelected ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
              color: isSelected && !allSelected ? '#fff' : 'var(--color-text-muted)',
            }}
            title={label}
            onClick={() => onToggle(sq.squadId)}
            aria-pressed={isSelected}
          >
            {shortLabel}
          </button>
        )
      })}
    </div>
  )
}
