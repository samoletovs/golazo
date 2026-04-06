import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { TeamPicker } from './TeamPicker'
import { AddTeamDialog } from './AddTeamDialog'
import type { PlayerTeam, SharedTeam } from '../engine/types'

/** Resolved hierarchy info for a player team */
interface TeamWithContext {
  team: PlayerTeam
  registry?: SharedTeam
  parent?: SharedTeam
  /** Display label: "Club", "Academy", or "2013 A" */
  hierarchyLabel?: string
}

export function TeamsManager({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { profile, setProfile, matches } = useApp()

  const teams: PlayerTeam[] = profile?.teams ?? []
  const [addTeamName, setAddTeamName] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [aliasInput, setAliasInput] = useState('')
  const [websiteInput, setWebsiteInput] = useState('')
  const [fetchingInfo, setFetchingInfo] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mergeFrom, setMergeFrom] = useState<string | null>(null)
  const [mergeTo, setMergeTo] = useState<string | null>(null)

  // Collect all unique opponent names from matches for suggestions
  const allOpponents = [...new Set(matches.map((m) => m.opponent).filter(Boolean))].sort()
  const teamNames = new Set(teams.map((t) => t.name.toLowerCase()))
  const unknownOpponents = allOpponents.filter((o) => !teamNames.has(o.toLowerCase()) && !teams.some((t) => t.aliases.some((a) => a.toLowerCase() === o.toLowerCase())))

  // Fetch registry data for hierarchy context
  const [registryTeams, setRegistryTeams] = useState<SharedTeam[]>([])
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = new URLSearchParams({ limit: '500' })
        if (profile?.country) params.set('country', profile.country)
        const res = await fetch(`/api/teams?${params}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setRegistryTeams(data.teams || [])
        }
      } catch { /* offline — hierarchy context just won't show */ }
    }
    if (teams.some((t) => t.registryId)) load()
    return () => { cancelled = true }
  }, [profile?.country, teams.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build registry lookup and resolve hierarchy
  const teamsWithContext = useMemo((): TeamWithContext[] => {
    const byId = new Map(registryTeams.map((rt) => [rt.id, rt]))
    return teams.map((team) => {
      const registry = team.registryId ? byId.get(team.registryId) : undefined
      const parent = registry?.parentClubId ? byId.get(registry.parentClubId) : undefined
      let hierarchyLabel: string | undefined
      if (registry?.type === 'squad') {
        hierarchyLabel = [registry.birthYear, registry.squadLabel].filter(Boolean).join(' ')
      } else if (registry?.type === 'academy') {
        hierarchyLabel = t('teams.academy')
      } else if (registry?.type === 'club') {
        hierarchyLabel = t('teams.club')
      }
      return { team, registry, parent, hierarchyLabel }
    })
  }, [teams, registryTeams, t])

  // Group teams by parent club for display
  const groupedTeams = useMemo(() => {
    const groups: { parentName: string; parentLogo?: string; items: TeamWithContext[] }[] = []
    const grouped = new Set<string>()

    // First, group teams that share a parent
    for (const tc of teamsWithContext) {
      if (tc.parent && !grouped.has(tc.team.id)) {
        const siblings = teamsWithContext.filter((s) => s.parent?.id === tc.parent?.id)
        groups.push({
          parentName: tc.parent.name,
          parentLogo: tc.parent.logoUrl,
          items: siblings,
        })
        for (const s of siblings) grouped.add(s.team.id)
      }
    }

    // Then, add ungrouped teams
    const ungrouped = teamsWithContext.filter((tc) => !grouped.has(tc.team.id))
    if (ungrouped.length > 0) {
      groups.push({ parentName: '', items: ungrouped })
    }

    return groups
  }, [teamsWithContext])

  function updateTeams(updated: PlayerTeam[]) {
    if (!profile) return
    setProfile({ ...profile, teams: updated })
  }

  function addTeamFromPicker(name: string, sharedTeam?: SharedTeam) {
    const already = teams.some((t) => t.name.toLowerCase() === name.toLowerCase())
    if (already) return
    const now = new Date().toISOString()
    const team: PlayerTeam = {
      id: crypto.randomUUID(),
      name,
      aliases: sharedTeam?.aliases ?? [],
      registryId: sharedTeam?.id,
      logoUrl: sharedTeam?.logoUrl,
      colors: sharedTeam?.colors,
      isPrimary: teams.length === 0,
      active: true,
      createdAt: now,
    }
    updateTeams([...teams, team])
  }

  async function fetchTeamInfo(teamId: string, url: string) {
    if (!url.startsWith('https://')) return
    setFetchingInfo(true)
    try {
      const res = await fetch('/api/team-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) return
      const info = await res.json()
      updateTeams(teams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              website: url,
              logoUrl: info.logoUrl || info.favicon || t.logoUrl,
              shortInfo: info.description || t.shortInfo,
            }
          : t
      ))
    } catch { /* ignore */ }
    finally { setFetchingInfo(false) }
  }

  function setTeamWebsite(teamId: string, url: string) {
    updateTeams(teams.map((t) =>
      t.id === teamId ? { ...t, website: url } : t
    ))
  }

  function removeTeam(id: string) {
    updateTeams(teams.filter((t) => t.id !== id))
  }

  function toggleActive(id: string) {
    updateTeams(teams.map((t) => t.id === id ? { ...t, active: !t.active } : t))
  }

  function addAlias(teamId: string) {
    if (!aliasInput.trim()) return
    updateTeams(teams.map((t) =>
      t.id === teamId
        ? { ...t, aliases: [...t.aliases, aliasInput.trim()] }
        : t
    ))
    setAliasInput('')
  }

  function removeAlias(teamId: string, alias: string) {
    updateTeams(teams.map((t) =>
      t.id === teamId
        ? { ...t, aliases: t.aliases.filter((a) => a !== alias) }
        : t
    ))
  }

  function handleMerge() {
    if (!mergeFrom || !mergeTo || mergeFrom === mergeTo) return
    const from = teams.find((t) => t.id === mergeFrom)
    const to = teams.find((t) => t.id === mergeTo)
    if (!from || !to) return

    const mergedAliases = [...new Set([...to.aliases, from.name, ...from.aliases])]
    const updated = teams
      .filter((t) => t.id !== mergeFrom)
      .map((t) => t.id === mergeTo ? { ...t, aliases: mergedAliases } : t)
    updateTeams(updated)
    setMergeFrom(null)
    setMergeTo(null)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <h2 className="text-lg font-extrabold heading-display">⚽ {t('teams.title')}</h2>
      </div>

        {/* Selected teams as chips */}
        {teams.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {teams.map((team, i) => (
              <span
                key={team.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: team.active
                    ? (i === 0 ? 'var(--color-primary-light, #dcfce7)' : 'var(--color-glass-active, #f1f5f9)')
                    : 'var(--color-glass-hover, #e2e8f0)',
                  color: team.active
                    ? (i === 0 ? 'var(--color-primary-dark, #166534)' : 'var(--color-text)')
                    : 'var(--color-text-muted)',
                  opacity: team.active ? 1 : 0.6,
                }}
              >
                {team.logoUrl && (
                  <img
                    src={team.logoUrl}
                    alt=""
                    className="w-4 h-4 rounded object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                {team.name}
                {i === 0 && <span className="text-[0.5rem] opacity-60">★</span>}
                <button
                  className="ml-0.5 text-xs opacity-50 hover:opacity-100"
                  onClick={() => removeTeam(team.id)}
                  aria-label={`Remove ${team.name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {teams.length === 0 && (
          <p className="text-xs text-center py-2 mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {t('teams.empty')}
          </p>
        )}

        {/* Team search input — same as onboarding */}
        <TeamPicker
          value=""
          onChange={(_name, sharedTeam) => {
            if (sharedTeam) {
              addTeamFromPicker(sharedTeam.name, sharedTeam)
            }
          }}
          country={profile?.country}
          placeholder={teams.length === 0 ? t('teams.search') : t('onboarding.addAnotherTeam')}
          className="w-full"
          showAddNew
          onAddNew={(name) => setAddTeamName(name)}
        />

        {/* Team details — grouped by parent club */}
        {teams.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            {groupedTeams.map((group) => (
              <div key={group.parentName || 'ungrouped'}>
                {/* Parent club header */}
                {group.parentName && (
                  <div className="flex items-center gap-2 mb-2">
                    {group.parentLogo && (
                      <img src={group.parentLogo} alt="" className="w-5 h-5 rounded object-contain shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    )}
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {group.parentName}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {group.items.map(({ team, hierarchyLabel }) => (
              <div key={team.id} className="card p-3">
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs"
                    onClick={() => toggleActive(team.id)}
                    aria-label={team.active ? 'Deactivate' : 'Activate'}
                    style={{ color: team.active ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}
                  >
                    {team.active ? '✅' : '⏸️'}
                  </button>
                  {team.logoUrl && (
                    <img
                      src={team.logoUrl}
                      alt=""
                      className="w-6 h-6 rounded object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold">{team.name}</span>
                      {hierarchyLabel && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                          style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>
                          {hierarchyLabel}
                        </span>
                      )}
                    </div>
                    {team.website && (
                      <a
                        href={team.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs truncate"
                        style={{ color: 'var(--color-primary-light)' }}
                      >
                        🔗 {team.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    )}
                  </div>
                  <button
                    className="text-xs px-2 py-1"
                    onClick={() => {
                      setEditingId(editingId === team.id ? null : team.id)
                      setWebsiteInput(team.website ?? '')
                    }}
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ✏️
                  </button>
                </div>

                {/* Aliases */}
                {team.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {team.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-secondary)' }}
                      >
                        {alias}
                        <button
                          className="text-xs"
                          onClick={() => removeAlias(team.id, alias)}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Edit mode: add alias + website */}
                {editingId === team.id && (
                  <div className="flex flex-col gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={websiteInput}
                        onChange={(e) => setWebsiteInput(e.target.value)}
                        placeholder={t('teams.website')}
                        className="flex-1 text-xs"
                      />
                      <button
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-dark)' }}
                        onClick={() => {
                          if (websiteInput.startsWith('https://')) {
                            setTeamWebsite(team.id, websiteInput)
                            fetchTeamInfo(team.id, websiteInput)
                          }
                        }}
                        disabled={fetchingInfo || !websiteInput.startsWith('https://')}
                      >
                        {fetchingInfo ? '...' : '🔍'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aliasInput}
                        onChange={(e) => setAliasInput(e.target.value)}
                        placeholder={t('teams.addAlias')}
                        className="flex-1 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && addAlias(team.id)}
                      />
                      <button
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: 'var(--color-glass-active)', color: 'var(--color-primary-dark)' }}
                        onClick={() => addAlias(team.id)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Advanced: merge teams + unknown opponents */}
        {(teams.length >= 2 || unknownOpponents.length > 0) && (
          <div className="mt-4">
            <button
              className="text-xs font-bold w-full text-center py-2"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▲' : '▼'} {t('teams.merge')} / {t('teams.fromMatches')}
            </button>

            {showAdvanced && (
              <div className="flex flex-col gap-3 mt-2">
                {teams.length >= 2 && (
                  <div className="card p-3">
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('teams.merge')}
                    </p>
                    <div className="flex gap-2 items-end">
                      <select
                        value={mergeFrom ?? ''}
                        onChange={(e) => setMergeFrom(e.target.value || null)}
                        className="flex-1 text-xs p-2 rounded-lg border"
                      >
                        <option value="">{t('teams.mergeFrom')}</option>
                        {teams.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                      </select>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>→</span>
                      <select
                        value={mergeTo ?? ''}
                        onChange={(e) => setMergeTo(e.target.value || null)}
                        className="flex-1 text-xs p-2 rounded-lg border"
                      >
                        <option value="">{t('teams.mergeTo')}</option>
                        {teams.filter((tm) => tm.id !== mergeFrom).map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                      </select>
                      <button
                        className="btn-primary text-xs px-3"
                        onClick={handleMerge}
                        disabled={!mergeFrom || !mergeTo}
                      >
                        {t('teams.mergeBtn')}
                      </button>
                    </div>
                  </div>
                )}

                {unknownOpponents.length > 0 && (
                  <div className="card p-3">
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('teams.fromMatches')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {unknownOpponents.slice(0, 20).map((opp) => (
                        <button
                          key={opp}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-secondary)' }}
                          onClick={() => addTeamFromPicker(opp)}
                        >
                          + {opp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Add new team dialog — same as onboarding */}
      {addTeamName !== null && (
        <AddTeamDialog
          initialName={addTeamName}
          defaultCountry={profile?.country}
          onAdd={(name, sharedTeam) => {
            addTeamFromPicker(name, sharedTeam)
            setAddTeamName(null)
          }}
          onCancel={() => setAddTeamName(null)}
        />
      )}
    </div>
  )
}
