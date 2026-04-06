import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { AddTeamDialog } from './AddTeamDialog'
import type { SharedTeam, ManagedSquad, CoachRole } from '../engine/types'

interface CoachSquadPickerProps {
  onClose: () => void
}

const ROLE_OPTIONS: { key: CoachRole; emoji: string }[] = [
  { key: 'head', emoji: '👔' },
  { key: 'assistant', emoji: '🤝' },
  { key: 'goalkeeper', emoji: '🧤' },
  { key: 'fitness', emoji: '🏋️' },
]

export function CoachSquadPicker({ onClose }: CoachSquadPickerProps) {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()

  const [allTeams, setAllTeams] = useState<SharedTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedClub, setExpandedClub] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<CoachRole>('head')
  const [search, setSearch] = useState('')
  const [addTeamName, setAddTeamName] = useState<string | null>(null)

  // Current managed squad IDs for quick lookup
  const managedIds = useMemo(
    () => new Set((profile?.managedSquads ?? []).map((s) => s.squadId)),
    [profile?.managedSquads]
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = new URLSearchParams({ limit: '500' })
        if (profile?.country) params.set('country', profile.country)
        const res = await fetch(`/api/teams?${params}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setAllTeams(data.teams || [])
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.country])

  // Build club → squads hierarchy + standalone teams
  const { clubTree, standaloneTeams } = useMemo(() => {
    const clubs = allTeams.filter((t) => t.type === 'club')
    const academies = allTeams.filter((t) => t.type === 'academy')
    const squads = allTeams.filter((t) => t.type === 'squad')

    const tree = clubs
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((club) => {
        const clubAcademies = academies.filter((a) => a.parentClubId === club.id)
        const allSquads = [
          ...squads.filter((s) => s.parentClubId === club.id),
          ...clubAcademies.flatMap((a) => squads.filter((s) => s.parentClubId === a.id)),
        ].sort((a, b) => {
          if (a.birthYear && b.birthYear && a.birthYear !== b.birthYear) return b.birthYear - a.birthYear
          return (a.squadLabel ?? a.name).localeCompare(b.squadLabel ?? b.name)
        })
        return { club, squads: allSquads }
      })
      .filter((n) => n.squads.length > 0)

    // Standalone: teams without type or not part of any hierarchy
    const usedInTree = new Set<string>()
    for (const node of tree) {
      usedInTree.add(node.club.id)
      for (const s of node.squads) usedInTree.add(s.id)
    }
    for (const a of academies) usedInTree.add(a.id)

    const standalone = allTeams
      .filter((t) => !usedInTree.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name))

    return { clubTree: tree, standaloneTeams: standalone }
  }, [allTeams])

  /** Normalize for search (strip accents) */
  function norm(s: string): string {
    return s.toLowerCase()
      .replace(/[āàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēėèêë]/g, 'e')
      .replace(/[ģ]/g, 'g').replace(/[īìîï]/g, 'i').replace(/[ķ]/g, 'k')
      .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[ōõöò]/g, 'o')
      .replace(/[šś]/g, 's').replace(/[ūùûü]/g, 'u').replace(/[žź]/g, 'z')
  }

  function teamMatchesSearch(team: SharedTeam, q: string): boolean {
    if (!q) return true
    const nq = norm(q)
    return norm(team.name).includes(nq)
      || (team.abbreviation && norm(team.abbreviation).includes(nq))
      || team.aliases?.some((a) => norm(a).includes(nq))
      || (team.city && norm(team.city).includes(nq))
      || false
  }

  // Filtered results
  const filteredStandaloneTeams = useMemo(
    () => standaloneTeams.filter((t) => teamMatchesSearch(t, search)),
    [standaloneTeams, search]
  )

  const filteredClubTree = useMemo(
    () => search
      ? clubTree.filter(({ club, squads }) =>
          teamMatchesSearch(club, search) || squads.some((s) => teamMatchesSearch(s, search))
        )
      : clubTree,
    [clubTree, search]
  )

  const hasResults = filteredClubTree.length > 0 || filteredStandaloneTeams.length > 0

  function toggleSquad(squad: SharedTeam) {
    if (!profile) return
    const current = profile.managedSquads ?? []

    if (managedIds.has(squad.id)) {
      // Remove
      setProfile({
        ...profile,
        managedSquads: current.filter((s) => s.squadId !== squad.id),
      })
    } else {
      // Add
      const entry: ManagedSquad = {
        squadId: squad.id,
        squadName: squad.squadLabel
          ? `${squad.name || ''} ${squad.birthYear ?? ''} ${squad.squadLabel}`.trim()
          : squad.name,
        role: selectedRole,
        claimedAt: new Date().toISOString(),
        verified: false,
      }
      // Use parent club name if squad name is just a label
      const parent = allTeams.find((t) => t.id === squad.parentClubId)
      if (parent) {
        const grandparent = allTeams.find((t) => t.id === parent.parentClubId)
        const clubName = grandparent?.name ?? parent.name
        entry.squadName = `${clubName} ${squad.birthYear ?? ''} ${squad.squadLabel ?? ''}`.trim()
      }
      setProfile({
        ...profile,
        managedSquads: [...current, entry],
      })
    }
  }

  const managedCount = profile?.managedSquads?.length ?? 0

  function handleNewTeamAdded(_name: string, sharedTeam?: SharedTeam) {
    if (sharedTeam) {
      // Add to allTeams so it shows up immediately
      setAllTeams((prev) => [...prev, sharedTeam])
      // Auto-select it
      toggleSquad(sharedTeam)
    }
    setAddTeamName(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="app-shell w-full rounded-t-2xl sm:rounded-2xl animate-fade-up"
        style={{ maxHeight: '90dvh', overflowY: 'auto', background: 'var(--color-glass, #fff)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold heading-display">
              📋 {t('coach.onboarding.selectSquads')}
            </h3>
            <button onClick={onClose} className="tap-target text-xl" aria-label={t('common.close')}>✕</button>
          </div>

          {/* Coach role selector */}
          <div className="flex gap-2 mb-2">
            {ROLE_OPTIONS.map(({ key, emoji }) => (
              <button
                key={key}
                className="flex-1 text-xs font-bold py-2 rounded-xl tap-target text-center"
                style={{
                  background: selectedRole === key ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)',
                  color: selectedRole === key ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                }}
                onClick={() => setSelectedRole(key)}
              >
                {emoji} {t(`coach.role.${key}`)}
              </button>
            ))}
          </div>

          {managedCount > 0 && (
            <p className="text-xs font-bold" style={{ color: 'var(--color-primary-dark)' }}>
              ✓ {managedCount} {managedCount === 1 ? 'squad' : 'squads'} selected
            </p>
          )}

          {/* Search + Add new */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('teams.search')}
              className="flex-1 text-sm px-3 py-2 rounded-xl"
              style={{ background: 'var(--color-glass-hover)' }}
            />
            <button
              className="text-xs font-bold px-3 py-2 rounded-xl tap-target shrink-0"
              style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}
              onClick={() => setAddTeamName(search || '')}
            >
              + {t('teams.addNewTitle')}
            </button>
          </div>
        </div>

        {/* Team list */}
        <div className="px-5 pb-5">
          {loading ? (
            <div className="text-center py-8">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
            </div>
          ) : hasResults ? (
            <div className="flex flex-col gap-2">
              {/* Clubs with squad hierarchy */}
              {filteredClubTree.map(({ club, squads }) => {
                const isExpanded = expandedClub === club.id
                const hasSelected = squads.some((s) => managedIds.has(s.id))
                return (
                  <div key={club.id} className="card overflow-hidden">
                    {/* Club header */}
                    <button
                      className="w-full flex items-center gap-3 p-3 tap-target text-left"
                      onClick={() => setExpandedClub(isExpanded ? null : club.id)}
                    >
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0"
                          style={{ background: 'rgba(255,255,255,0.5)' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'var(--color-glass-hover)' }}>
                          <span className="text-sm">🏟️</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{club.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {squads.length} {squads.length === 1 ? 'squad' : 'squads'}
                        </p>
                      </div>
                      {hasSelected && (
                        <span className="text-xs shrink-0" style={{ color: 'var(--color-primary)' }}>✓</span>
                      )}
                      <span className="text-xs transition-transform shrink-0" style={{
                        color: 'var(--color-text-muted)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>›</span>
                    </button>

                    {/* Squads list */}
                    {isExpanded && (
                      <div className="px-3 pb-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                        <div className="w-full pt-2" />
                        {squads.map((squad) => {
                          const isSelected = managedIds.has(squad.id)
                          const label = squad.squadLabel
                            ? `${squad.birthYear ?? ''} ${squad.squadLabel}`.trim()
                            : squad.name
                          return (
                            <button
                              key={squad.id}
                              className="text-xs font-bold px-3 py-2 rounded-xl tap-target transition-all"
                              style={{
                                background: isSelected ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)',
                                color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text)',
                                border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                              }}
                              onClick={() => toggleSquad(squad)}
                              aria-pressed={isSelected}
                            >
                              {isSelected ? '✓ ' : ''}{label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Standalone teams (no hierarchy) */}
              {filteredStandaloneTeams.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {filteredClubTree.length > 0 && (
                    <p className="text-xs font-bold uppercase tracking-wider mt-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {t('portal.clubs')}
                    </p>
                  )}
                  {filteredStandaloneTeams.map((team) => {
                    const isSelected = managedIds.has(team.id)
                    return (
                      <button
                        key={team.id}
                        className="card tap-target flex items-center gap-3 p-3 text-left transition-all"
                        style={{
                          border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                          background: isSelected ? 'var(--color-primary-bg)' : undefined,
                        }}
                        onClick={() => toggleSquad(team)}
                        aria-pressed={isSelected}
                      >
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0"
                            style={{ background: 'rgba(255,255,255,0.5)' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'var(--color-glass-hover)' }}>
                            <span className="text-sm">⚽</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{team.name}</p>
                          {team.city && (
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{team.city}</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold shrink-0" style={{ color: 'var(--color-primary-dark)' }}>✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-8">
              <span className="text-5xl mb-3 block">🏟️</span>
              <p className="text-sm font-bold mb-1">
                {search ? t('portal.noClubs', { age: search }) : t('coach.dashboard.noSquads')}
              </p>
              {search && (
                <button
                  className="btn-primary text-xs px-4 py-2 rounded-xl tap-target mt-3"
                  onClick={() => setAddTeamName(search)}
                >
                  + {t('teams.addCustom', { name: search })}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Done button */}
        {managedCount > 0 && (
          <div className="sticky bottom-0 p-5 pt-3" style={{ background: 'var(--color-glass, #fff)' }}>
            <button
              className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
              onClick={onClose}
            >
              ✓ {t('common.done')}
            </button>
          </div>
        )}
      </div>

      {/* Add new team dialog */}
      {addTeamName !== null && (
        <AddTeamDialog
          initialName={addTeamName}
          defaultCountry={profile?.country}
          onAdd={handleNewTeamAdded}
          onCancel={() => setAddTeamName(null)}
        />
      )}
    </div>
  )
}
