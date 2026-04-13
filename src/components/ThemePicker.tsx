import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SURFACE_PRESETS, applySurfaceTheme, saveSurfaceTheme, loadSurfaceTheme, deriveTeamSurface } from '../utils/surfaceTheme'
import { getPrimaryTeamColor } from '../utils/teamTheme'
import { useApp } from '../contexts/AppContext'

export function ThemePicker() {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()
  const [selected, setSelected] = useState(loadSurfaceTheme)
  const teamColor = getPrimaryTeamColor(profile?.teams)

  // Get teams that have colors (for team color picker)
  const teamsWithColors = (profile?.teams ?? []).filter((t) => t.active && t.colors?.length)

  function pick(id: string) {
    setSelected(id)
    saveSurfaceTheme(id)
    applySurfaceTheme(id, getPrimaryTeamColor(profile?.teams))
  }

  function setPrimaryTeam(teamId: string) {
    if (!profile?.teams) return
    const updated = profile.teams.map((t) => ({ ...t, isPrimary: t.id === teamId }))
    setProfile({ ...profile, teams: updated })
    // Re-apply theme with new team color
    const newColor = getPrimaryTeamColor(updated)
    if (selected === 'team') {
      applySurfaceTheme('team', newColor)
    }
  }

  // For "My Club" preset, compute the real swatch from actual team color
  function getSwatchForPreset(preset: typeof SURFACE_PRESETS[0]): [string, string, string] {
    if (preset.id === 'team' && teamColor) {
      return deriveTeamSurface(teamColor).swatch
    }
    return preset.swatch
  }

  return (
    <div className="card">
      <p className="section-label mb-3">{t('theme.title')}</p>
      <div className="grid grid-cols-3 gap-2">
        {SURFACE_PRESETS.map((preset) => {
          const isActive = selected === preset.id
          const sw = getSwatchForPreset(preset)
          return (
            <button
              key={preset.id}
              className="tap-target flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all"
              style={{
                border: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: isActive ? 'var(--color-glass-active)' : 'transparent',
              }}
              onClick={() => pick(preset.id)}
              aria-pressed={isActive}
              aria-label={t(`theme.${preset.id}`)}
            >
              {/* Mini card preview — shows actual bg + accent color */}
              <div
                className="w-14 h-10 rounded-lg overflow-hidden relative flex-shrink-0"
                style={{
                  background: sw[2],
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {/* Accent bar at top */}
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: 3, background: sw[0], borderRadius: '6px 6px 0 0' }}
                />
                {/* Mini content lines */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-1">
                  <div style={{ height: 2, width: '60%', background: sw[0], borderRadius: 1, opacity: 0.7 }} />
                  <div style={{ height: 2, width: '40%', background: sw[1], borderRadius: 1, opacity: 0.5 }} />
                </div>
              </div>
              <span
                className="text-xs font-bold leading-tight text-center"
                style={{ color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}
              >
                {t(`theme.${preset.id}`)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Team color picker — shown when My Club is selected and player has multiple teams with colors */}
      {selected === 'team' && teamsWithColors.length > 1 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {t('theme.pickClub')}
          </p>
          <div className="flex flex-wrap gap-2">
            {teamsWithColors.map((team) => {
              const isTeamPrimary = team.isPrimary
              const color = team.colors![0]
              return (
                <button
                  key={team.id}
                  className="tap-target flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left"
                  style={{
                    border: isTeamPrimary ? `2px solid ${color}` : '2px solid var(--color-glass-border)',
                    background: isTeamPrimary ? `${color}10` : 'transparent',
                  }}
                  onClick={() => setPrimaryTeam(team.id)}
                  aria-pressed={isTeamPrimary}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                  />
                  <span className="text-xs font-bold truncate" style={{ maxWidth: 120 }}>
                    {team.clubName ?? team.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selected === 'team' && !teamColor && !(profile?.teams?.length) && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {t('theme.noTeamHint')}
        </p>
      )}
      {selected === 'team' && !teamColor && (profile?.teams?.length ?? 0) > 0 && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {t('theme.colorsLoading')}
        </p>
      )}
    </div>
  )
}
