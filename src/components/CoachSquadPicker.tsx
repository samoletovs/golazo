import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { AddTeamDialog } from './AddTeamDialog'
import type { SharedTeam, ManagedSquad, CoachRole } from '../engine/types'

interface CoachSquadPickerProps {
  onClose: () => void
}

type View = 'my-squads' | 'select-club' | 'add-squads'

const ROLE_OPTIONS: { key: CoachRole; emoji: string }[] = [
  { key: 'head', emoji: '👔' },
  { key: 'assistant', emoji: '🤝' },
  { key: 'goalkeeper', emoji: '🧤' },
  { key: 'fitness', emoji: '🏋️' },
]

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 6 - i)

/** Strip accents for search */
function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[āàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēėèêë]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[īìîï]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[ōõöò]/g, 'o')
    .replace(/[šś]/g, 's').replace(/[ūùûü]/g, 'u').replace(/[žź]/g, 'z')
}

export function CoachSquadPicker({ onClose }: CoachSquadPickerProps) {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()

  const [view, setView] = useState<View>('my-squads')
  const [allTeams, setAllTeams] = useState<SharedTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [addTeamName, setAddTeamName] = useState<string | null>(null)

  // View 3 state
  const [selectedClub, setSelectedClub] = useState<{ id?: string; name: string; logoUrl?: string } | null>(null)
  const [birthYear, setBirthYear] = useState(2014)
  const [squadLabel, setSquadLabel] = useState('A')
  const [coachRole, setCoachRole] = useState<CoachRole>('head')

  const squads = profile?.managedSquads ?? []

  // Migrate old-format squads that are missing clubName
  useEffect(() => {
    if (!profile?.managedSquads?.length) return
    const needsMigration = profile.managedSquads.some((s) => !s.clubName)
    if (!needsMigration) return
    setProfile({
      ...profile,
      managedSquads: profile.managedSquads.map((s) =>
        s.clubName ? s : { ...s, clubName: s.squadName }
      ),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Group squads by club
  const squadsByClub = useMemo(() => {
    const map = new Map<string, ManagedSquad[]>()
    for (const sq of squads) {
      const key = sq.clubName || sq.squadName
      const arr = map.get(key) ?? []
      arr.push(sq)
      map.set(key, arr)
    }
    return [...map.entries()]
      .map(([clubName, items]) => ({ clubName, clubId: items[0].clubId, squads: items }))
      .sort((a, b) => a.clubName.localeCompare(b.clubName))
  }, [squads])

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

  function removeSquad(squadId: string) {
    if (!profile) return
    setProfile({ ...profile, managedSquads: squads.filter((s) => s.squadId !== squadId) })
  }

  function addSquad() {
    if (!profile || !selectedClub) return
    const name = `${selectedClub.name} ${birthYear} ${squadLabel}`.trim()
    const current = profile.managedSquads ?? []
    if (current.some((s) => s.clubName === selectedClub.name && s.birthYear === birthYear && s.squadLabel === squadLabel)) return

    const entry: ManagedSquad = {
      squadId: crypto.randomUUID(),
      squadName: name,
      clubName: selectedClub.name,
      clubId: selectedClub.id,
      birthYear,
      squadLabel,
      role: coachRole,
      claimedAt: new Date().toISOString(),
      verified: false,
    }
    setProfile({ ...profile, managedSquads: [...current, entry] })
  }

  function selectClub(team: SharedTeam) {
    setSelectedClub({ id: team.id, name: team.name, logoUrl: team.logoUrl })
    setSearch('')
    setView('add-squads')
  }

  function handleNewTeamAdded(_name: string, sharedTeam?: SharedTeam) {
    if (sharedTeam) {
      setAllTeams((prev) => prev.some((t) => t.id === sharedTeam.id) ? prev : [...prev, sharedTeam])
      setSelectedClub({ id: sharedTeam.id, name: sharedTeam.name, logoUrl: sharedTeam.logoUrl })
      setView('add-squads')
    } else if (_name.trim()) {
      setSelectedClub({ name: _name.trim() })
      setView('add-squads')
    }
    setAddTeamName(null)
    setSearch('')
  }

  const clubSquads = useMemo(() => {
    if (!selectedClub) return []
    return squads.filter((s) => s.clubName === selectedClub.name)
  }, [squads, selectedClub])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="app-shell w-full rounded-t-2xl sm:rounded-2xl animate-fade-up"
        style={{ maxHeight: '90dvh', overflowY: 'auto', background: 'var(--color-glass, #fff)' }}>

        {/* ═══ VIEW 1: My Squads ═══ */}
        {view === 'my-squads' && (
          <>
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-extrabold heading-display">📋 {t('coach.onboarding.selectSquads')}</h3>
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
                          onClick={() => {
                            setSelectedClub({ id: group.clubId, name: group.clubName })
                            setView('add-squads')
                          }}
                        >
                          + Add
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {group.squads.map((sq) => (
                          <div key={sq.squadId} className="card flex items-center gap-3 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">
                                {sq.birthYear ? `${sq.birthYear} ${sq.squadLabel ?? ''}`.trim() : sq.squadName}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                {t(`coach.role.${sq.role}`)}
                              </p>
                            </div>
                            <button
                              className="tap-target text-xs px-2 py-1 rounded-lg"
                              style={{ color: 'var(--color-danger)', background: 'var(--color-error-bg)' }}
                              onClick={() => removeSquad(sq.squadId)}
                              aria-label={`Remove ${sq.squadName}`}
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
                  <p className="text-sm font-bold mb-1">{t('coach.dashboard.noSquads')}</p>
                </div>
              )}
              <button
                className="btn-primary w-full text-sm py-3 rounded-xl tap-target mt-4"
                onClick={() => { setSearch(''); setView('select-club') }}
              >
                + {t('teams.addNewTitle')}
              </button>
            </div>
            {squads.length > 0 && (
              <div className="sticky bottom-0 p-5 pt-3" style={{ background: 'var(--color-glass, #fff)' }}>
                <button className="btn-primary w-full text-sm py-3 rounded-xl tap-target" onClick={onClose}>
                  ✓ {t('common.done')}
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══ VIEW 2: Select Club ═══ */}
        {view === 'select-club' && (
          <>
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setView('my-squads')} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
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
                <div className="text-center py-8">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
                </div>
              ) : filteredTeams.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {filteredTeams.slice(0, 30).map((team) => (
                    <button key={team.id} className="card tap-target flex items-center gap-3 p-3 text-left"
                      onClick={() => selectClub(team)}>
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

        {/* ═══ VIEW 3: Add Squads to Club ═══ */}
        {view === 'add-squads' && selectedClub && (
          <>
            <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'var(--color-glass, #fff)' }}>
              <div className="flex items-center gap-3 mb-1">
                <button onClick={() => setView('my-squads')} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold heading-display truncate">{selectedClub.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('teams.squads')}</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex flex-col gap-4">
              {/* Existing squads for this club */}
              {clubSquads.length > 0 && (
                <div>
                  <p className="section-label mb-2">{t('teams.squads')}</p>
                  <div className="flex flex-wrap gap-2">
                    {clubSquads.map((sq) => (
                      <span key={sq.squadId}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                        {sq.birthYear ? `${sq.birthYear} ${sq.squadLabel ?? ''}`.trim() : sq.squadName}
                        <button onClick={() => removeSquad(sq.squadId)} className="text-xs" style={{ color: 'var(--color-danger)' }}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add squad form */}
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
                        onClick={() => setBirthYear(y)}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Squad label */}
                <div className="mb-3">
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('teams.squadLabel')}
                  </p>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map((lbl) => (
                      <button key={lbl} className="flex-1 text-sm font-bold py-2 rounded-xl tap-target text-center"
                        style={{
                          background: lbl === squadLabel ? 'var(--color-primary-dark)' : 'var(--color-glass-hover)',
                          color: lbl === squadLabel ? '#fff' : 'var(--color-text-muted)',
                        }}
                        onClick={() => setSquadLabel(lbl)}>
                        {lbl}
                      </button>
                    ))}
                    <input type="text"
                      value={!['A', 'B', 'C', 'D'].includes(squadLabel) ? squadLabel : ''}
                      onChange={(e) => setSquadLabel(e.target.value)}
                      placeholder="Other"
                      className="flex-1 text-xs px-2 py-2 rounded-xl text-center"
                      style={{ background: !['A', 'B', 'C', 'D'].includes(squadLabel) && squadLabel ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)' }} />
                  </div>
                </div>

                {/* Coach role */}
                <div className="mb-3">
                  <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('coach.role')}
                  </p>
                  <div className="flex gap-2">
                    {ROLE_OPTIONS.map(({ key, emoji }) => (
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

                {/* Preview + Add */}
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{selectedClub.name} {birthYear} {squadLabel}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t(`coach.role.${coachRole}`)}</p>
                  </div>
                  <button className="btn-primary text-sm px-4 py-2 rounded-xl tap-target" onClick={addSquad}>
                    + {t('teams.addBtn')}
                  </button>
                </div>
              </div>

              <button className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
                onClick={() => setView('my-squads')}>
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
