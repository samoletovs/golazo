import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { AddTeamDialog } from './AddTeamDialog'
import type { SharedTeam, ManagedTeam, PlayerTeam, CoachRole, Position } from '../engine/types'

/**
 * Unified team picker used by ALL roles:
 * - player/mentor: pick teams to play for (with position)
 * - coach: pick teams to manage (with coach role)
 * 
 * 3-step wizard: My Teams → Select Club → Add Teams
 */

type TeamPickerMode = 'player' | 'coach'

interface TeamPickerProps {
  mode: TeamPickerMode
  onClose: () => void
  /** Standalone mode: provide teams externally instead of reading from profile */
  externalTeams?: PlayerTeam[]
  /** Callback when teams change in standalone mode */
  onTeamsChange?: (teams: PlayerTeam[]) => void
  /** Override country for team filtering (used in standalone mode) */
  country?: string
}

type View = 'my-teams' | 'select-club' | 'add-teams'

const COACH_ROLES: { key: CoachRole; emoji: string }[] = [
  { key: 'head', emoji: '👔' },
  { key: 'assistant', emoji: '🤝' },
  { key: 'goalkeeper', emoji: '🧤' },
  { key: 'fitness', emoji: '🏋️' },
]

const POSITION_OPTIONS: { key: Position; emoji: string }[] = [
  { key: 'GK', emoji: '🧤' },
  { key: 'CB', emoji: '🛡️' },
  { key: 'LB', emoji: '⬅️' },
  { key: 'RB', emoji: '➡️' },
  { key: 'CDM', emoji: '🔒' },
  { key: 'CM', emoji: '⚙️' },
  { key: 'CAM', emoji: '🎯' },
  { key: 'LM', emoji: '↙️' },
  { key: 'RM', emoji: '↗️' },
  { key: 'LW', emoji: '💨' },
  { key: 'RW', emoji: '💨' },
  { key: 'ST', emoji: '⚡' },
]

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 6 - i)

function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[āàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēėèêë]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[īìîï]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[ōõöò]/g, 'o')
    .replace(/[šś]/g, 's').replace(/[ūùûü]/g, 'u').replace(/[žź]/g, 'z')
}

/** Unified team entry — works for both player teams and coach managed teams */
interface TeamEntry {
  id: string
  name: string          // "RFS 2014 A"
  clubName: string      // "Rigas Futbola Skola"
  clubId?: string
  birthYear?: number
  teamLabel?: string
  // Player-specific
  positions?: Position[]
  // Coach-specific
  coachRole?: CoachRole
}

export function TeamPicker({ mode, onClose, externalTeams, onTeamsChange, country: countryProp }: TeamPickerProps) {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()

  // Standalone mode: use external state instead of profile
  const standalone = externalTeams !== undefined && onTeamsChange !== undefined
  const resolvedCountry = countryProp ?? profile?.country

  const [view, setView] = useState<View>('my-teams')
  const [allTeams, setAllTeams] = useState<SharedTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addTeamName, setAddTeamName] = useState<string | null>(null)

  // Add-squad form state
  const [selectedClub, setSelectedClub] = useState<{ id?: string; name: string } | null>(null)
  const [birthYear, setBirthYear] = useState(2014)
  const [teamLabel, setTeamLabel] = useState('A')
  const [coachRole, setCoachRole] = useState<CoachRole>('head')
  const [positions, setPositions] = useState<Position[]>(() => {
    // Default from profile positions
    const profilePositions = profile?.positions
    return profilePositions?.length ? [...profilePositions] : ['CM']
  })

  const squads: TeamEntry[] = useMemo(() => {
    const playerTeamSource = standalone ? (externalTeams ?? []) : (profile?.teams ?? [])
    if (mode === 'coach') {
      return (profile?.managedTeams ?? []).map((s) => ({
        id: s.teamId,
        name: s.teamName,
        clubName: s.clubName || s.teamName,
        clubId: s.clubId,
        birthYear: s.birthYear,
        teamLabel: s.teamLabel,
        coachRole: s.role,
      }))
    }
    // Player mode — use teams[]
    return playerTeamSource.filter((t) => t.active).map((t) => {
      const pos = Array.isArray(t.position) ? t.position : t.position ? [t.position] : []
      return {
        id: t.id,
        name: t.name,
        clubName: t.clubName || t.name,
        clubId: t.clubId,
        birthYear: t.birthYear,
        teamLabel: t.teamLabel || (t as unknown as Record<string, unknown>).squadLabel as string | undefined,
        positions: pos,
      }
    })
  }, [standalone, externalTeams, profile?.teams, profile?.managedTeams, mode])

  // Group by club
  const squadsByClub = useMemo(() => {
    const map = new Map<string, TeamEntry[]>()
    for (const sq of squads) {
      const key = sq.clubName
      const arr = map.get(key) ?? []
      arr.push(sq)
      map.set(key, arr)
    }
    return [...map.entries()]
      .map(([clubName, items]) => ({ clubName, squads: items }))
      .sort((a, b) => a.clubName.localeCompare(b.clubName))
  }, [squads])

  // Migrate old data
  useEffect(() => {
    if (!profile) return
    if (mode === 'coach' && profile.managedTeams?.some((s) => !s.clubName)) {
      setProfile({
        ...profile,
        managedTeams: profile.managedTeams!.map((s) => s.clubName ? s : { ...s, clubName: s.teamName }),
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = new URLSearchParams({ limit: '500' })
        if (resolvedCountry) params.set('country', resolvedCountry)
        const res = await fetch(`/api/teams?${params}`)
        if (res.ok && !cancelled) setAllTeams((await res.json()).teams || [])
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [resolvedCountry])

  const filteredTeams = useMemo(() => {
    if (!search) return allTeams
    const q = norm(search)
    return allTeams.filter((t) =>
      norm(t.name).includes(q)
      || (t.abbreviation && norm(t.abbreviation).includes(q))
      || t.aliases?.some((a) => norm(a).includes(q))
      || (t.city && norm(t.city).includes(q))
    )
  }, [allTeams, search])

  function removeTeam(id: string) {
    if (standalone) {
      onTeamsChange(externalTeams.filter((t) => t.id !== id))
      return
    }
    if (!profile) return
    if (mode === 'coach') {
      setProfile({ ...profile, managedTeams: (profile.managedTeams ?? []).filter((s) => s.teamId !== id) })
    } else {
      setProfile({ ...profile, teams: (profile.teams ?? []).filter((t) => t.id !== id) })
    }
  }

  function addTeam() {
    if (!selectedClub) return
    if (!standalone && !profile) return
    const fullName = `${selectedClub.name} ${birthYear} ${teamLabel}`.trim()

    // Look up colors from the shared registry
    const registryTeam = selectedClub.id ? allTeams.find((t) => t.id === selectedClub.id) : undefined
    const teamColors = registryTeam?.colors
    const teamLogo = registryTeam?.logoUrl

    if (mode === 'coach') {
      if (!profile) return
      const current = profile.managedTeams ?? []
      if (current.some((s) => s.clubName === selectedClub.name && s.birthYear === birthYear && s.teamLabel === teamLabel)) return
      const entry: ManagedTeam = {
        teamId: crypto.randomUUID(),
        teamName: fullName,
        clubName: selectedClub.name,
        clubId: selectedClub.id,
        birthYear,
        teamLabel,
        role: coachRole,
        claimedAt: new Date().toISOString(),
        verified: false,
      }
      setProfile({ ...profile, managedTeams: [...current, entry] })
    } else if (standalone) {
      const current = externalTeams
      if (current.some((t) => t.clubName === selectedClub.name && t.birthYear === birthYear && t.teamLabel === teamLabel)) return
      const entry: PlayerTeam = {
        id: crypto.randomUUID(),
        name: fullName,
        aliases: [],
        clubName: selectedClub.name,
        clubId: selectedClub.id,
        registryId: selectedClub.id,
        birthYear,
        teamLabel,
        position: positions,
        isPrimary: current.length === 0,
        active: true,
        colors: teamColors,
        logoUrl: teamLogo,
        createdAt: new Date().toISOString(),
      }
      onTeamsChange([...current, entry])
    } else {
      if (!profile) return
      const current = profile.teams ?? []
      if (current.some((t) => t.clubName === selectedClub.name && t.birthYear === birthYear && t.teamLabel === teamLabel)) return
      const entry: PlayerTeam = {
        id: crypto.randomUUID(),
        name: fullName,
        aliases: [],
        clubName: selectedClub.name,
        clubId: selectedClub.id,
        registryId: selectedClub.id,
        birthYear,
        teamLabel,
        position: positions,
        isPrimary: current.length === 0,
        active: true,
        colors: teamColors,
        logoUrl: teamLogo,
        createdAt: new Date().toISOString(),
      }
      setProfile({ ...profile, teams: [...current, entry] })
    }
  }

  function selectClub(team: SharedTeam) {
    setSelectedClub({ id: team.id, name: team.name })
    setSearch('')
    setView('add-teams')
  }

  function handleNewTeamAdded(_name: string, sharedTeam?: SharedTeam) {
    if (sharedTeam) {
      setAllTeams((prev) => prev.some((t) => t.id === sharedTeam.id) ? prev : [...prev, sharedTeam])
      setSelectedClub({ id: sharedTeam.id, name: sharedTeam.name })
      setView('add-teams')
    } else if (_name.trim()) {
      setSelectedClub({ name: _name.trim() })
      setView('add-teams')
    }
    setAddTeamName(null)
    setSearch('')
  }

  const clubTeams = useMemo(() => {
    if (!selectedClub) return []
    return squads.filter((s) => s.clubName === selectedClub.name)
  }, [squads, selectedClub])

  const title = mode === 'coach' ? t('coach.onboarding.selectSquads') : t('teams.title')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="app-shell w-full rounded-t-2xl sm:rounded-2xl animate-fade-up"
        style={{ maxHeight: '90dvh', overflowY: 'auto', background: 'var(--color-glass, #fff)' }}>

        {/* ═══ VIEW 1: My Teams ═══ */}
        {view === 'my-teams' && (
          <>
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-extrabold heading-display">
                  {mode === 'coach' ? '📋' : '⚽'} {title}
                </h3>
                <button onClick={onClose} className="tap-target text-xl" aria-label={t('common.close')}>✕</button>
              </div>
            </div>
            <div className="px-5 pb-5">
              {squadsByClub.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {squadsByClub.map((group) => (
                    <div key={group.clubName}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                          {group.clubName}
                        </p>
                        <button
                          className="text-xs font-bold px-2 py-1 rounded-lg tap-target"
                          style={{ color: 'var(--color-primary-dark)' }}
                          onClick={() => { setSelectedClub({ name: group.clubName }); setView('add-teams') }}
                        >
                          + Add
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {group.squads.map((sq) => (
                          <div key={sq.id} className="card flex items-center gap-3 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">
                                {sq.birthYear ? `${sq.birthYear} ${sq.teamLabel ?? ''}`.trim() : sq.name}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {mode === 'coach'
                                  ? t(`coach.role.${sq.coachRole ?? 'head'}`)
                                  : sq.positions?.join(' / ') ?? ''}
                              </p>
                            </div>
                            <button
                              className="tap-target text-xs px-2 py-1 rounded-lg"
                              style={{ color: 'var(--color-danger)', background: 'var(--color-error-bg)' }}
                              onClick={() => removeTeam(sq.id)}
                              aria-label={`Remove ${sq.name}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <span className="text-5xl mb-3 block">🏟️</span>
                  <p className="text-sm font-bold mb-1">
                    {mode === 'coach' ? t('coach.dashboard.noSquads') : t('teams.empty')}
                  </p>
                </div>
              )}
              <button
                className="btn-primary w-full text-sm py-3 rounded-xl tap-target mt-4"
                onClick={() => { setSearch(''); setView('select-club') }}
              >
                + {t('teams.addNewTitle')}
              </button>
              {squads.length > 0 && (
                <button
                  className="w-full text-sm font-bold py-3 rounded-xl tap-target mt-2"
                  style={{ background: 'var(--color-primary-dark)', color: '#fff' }}
                  onClick={onClose}
                >
                  ✓ {t('common.done')}
                </button>
              )}
            </div>
          </>
        )}

        {/* ═══ VIEW 2: Select Club ═══ */}
        {view === 'select-club' && (
          <>
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setView('my-teams')} className="tap-target text-xl">←</button>
                <h3 className="text-lg font-extrabold heading-display">{t('teams.search')}</h3>
              </div>
              <div className="flex gap-2">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('teams.search')}
                  className="flex-1 text-sm px-3 py-2 rounded-xl"
                  style={{ background: 'var(--color-glass-hover)' }} autoFocus />
                <button
                  className="text-xs font-bold px-3 py-2 rounded-xl tap-target shrink-0"
                  style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}
                  onClick={() => setAddTeamName(search || '')}
                >
                  + New
                </button>
              </div>
            </div>
            <div className="px-5 pb-5">
              {loading ? (
                <div className="text-center py-8"><span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span></div>
              ) : filteredTeams.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {filteredTeams.slice(0, 30).map((team) => (
                    <button key={team.id} className="card tap-target flex items-center gap-3 p-3 text-left"
                      onClick={() => selectClub(team)}>
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-lg object-contain shrink-0"
                          style={{ background: 'rgba(255,255,255,0.5)' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'var(--color-glass-hover)' }}>⚽</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{team.name}</p>
                        {team.city && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{team.city}</p>}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>→</span>
                    </button>
                  ))}
                </div>
              ) : search ? (
                <div className="card text-center py-8">
                  <p className="text-sm font-bold mb-3">{t('portal.noClubs', { age: search })}</p>
                  <button className="btn-primary text-xs px-4 py-2 rounded-xl tap-target"
                    onClick={() => setAddTeamName(search)}>
                    + {t('teams.addCustom', { name: search })}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* ═══ VIEW 3: Add Teams to Club ═══ */}
        {view === 'add-teams' && selectedClub && (
          <>
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setView('my-teams')} className="tap-target text-xl">←</button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold heading-display truncate">{selectedClub.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('teams.squads')}</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex flex-col gap-4">
              {/* Existing squads for this club */}
              {clubTeams.length > 0 && (
                <div>
                  <p className="section-label mb-2">{t('teams.squads')}</p>
                  <div className="flex flex-wrap gap-2">
                    {clubTeams.map((sq) => (
                      <span key={sq.id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                        {sq.birthYear ? `${sq.birthYear} ${sq.teamLabel ?? ''}`.trim() : sq.name}
                        {sq.positions?.length ? ` · ${sq.positions.join('/')}` : ''}
                        <button onClick={() => removeTeam(sq.id)} className="text-xs" style={{ color: 'var(--color-danger)' }}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add team form */}
              <div className="card p-4">
                <p className="section-label mb-3">{t('coach.squad.addSquad')}</p>

                {/* Birth year */}
                <div className="mb-3">
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('teams.birthYear')}
                  </p>
                  <div className="h-scroll gap-1.5">
                    {YEAR_OPTIONS.map((y) => (
                      <button key={y} className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 tap-target"
                        style={{
                          background: y === birthYear ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
                          color: y === birthYear ? '#fff' : 'var(--color-text-muted)',
                        }}
                        onClick={() => setBirthYear(y)}>{y}</button>
                    ))}
                  </div>
                </div>

                {/* Team label */}
                <div className="mb-3">
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('teams.squadLabel')}
                  </p>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map((lbl) => (
                      <button key={lbl} className="flex-1 text-sm font-bold py-2 rounded-xl tap-target text-center"
                        style={{
                          background: lbl === teamLabel ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
                          color: lbl === teamLabel ? '#fff' : 'var(--color-text-muted)',
                        }}
                        onClick={() => setTeamLabel(lbl)}>{lbl}</button>
                    ))}
                    <input type="text"
                      value={!['A', 'B', 'C', 'D'].includes(teamLabel) ? teamLabel : ''}
                      onChange={(e) => setTeamLabel(e.target.value)}
                      placeholder="Other"
                      className="flex-1 text-xs px-2 py-2 rounded-xl text-center"
                      style={{ background: !['A', 'B', 'C', 'D'].includes(teamLabel) && teamLabel ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)' }} />
                  </div>
                </div>

                {/* Coach role (coach mode only) */}
                {mode === 'coach' && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('coach.role')}
                    </p>
                    <div className="flex gap-2">
                      {COACH_ROLES.map(({ key, emoji }) => (
                        <button key={key} className="flex-1 text-xs font-bold py-2 rounded-xl tap-target text-center"
                          style={{
                            background: coachRole === key ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)',
                            color: coachRole === key ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                          }}
                          onClick={() => setCoachRole(key)}>
                          {emoji} {t(`coach.role.${key}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Position (player mode only) — multi-select */}
                {mode === 'player' && (
                  <div className="mb-3">
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('onboarding.position')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POSITION_OPTIONS.map(({ key, emoji }) => {
                        const selected = positions.includes(key)
                        return (
                          <button key={key} className="text-xs font-bold px-3 py-1.5 rounded-xl tap-target"
                            style={{
                              background: selected ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
                              color: selected ? '#fff' : 'var(--color-text-muted)',
                            }}
                            onClick={() => {
                              setPositions((prev) =>
                                prev.includes(key)
                                  ? prev.length > 1 ? prev.filter((p) => p !== key) : prev
                                  : [...prev, key]
                              )
                            }}>
                            {emoji} {key}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Preview + Add */}
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{selectedClub.name} {birthYear} {teamLabel}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {mode === 'coach' ? t(`coach.role.${coachRole}`) : positions.join(' / ')}
                    </p>
                  </div>
                  <button className="btn-primary text-sm px-4 py-2 rounded-xl tap-target" onClick={addTeam}>
                    + {t('teams.addBtn')}
                  </button>
                </div>
              </div>

              <button className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
                onClick={() => setView('my-teams')}>
                ✓ {t('common.done')}
              </button>
            </div>
          </>
        )}
      </div>

      {addTeamName !== null && (
        <AddTeamDialog initialName={addTeamName} defaultCountry={profile?.country}
          onAdd={handleNewTeamAdded} onCancel={() => setAddTeamName(null)} />
      )}
    </div>
  )
}
