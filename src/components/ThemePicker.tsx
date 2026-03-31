import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SURFACE_PRESETS, applySurfaceTheme, saveSurfaceTheme, loadSurfaceTheme } from '../utils/surfaceTheme'
import { getPrimaryTeamColor } from '../utils/teamTheme'
import { useApp } from '../contexts/AppContext'

export function ThemePicker() {
  const { t } = useTranslation()
  const { profile } = useApp()
  const [selected, setSelected] = useState(loadSurfaceTheme)
  const teamColor = getPrimaryTeamColor(profile?.teams)

  function pick(id: string) {
    setSelected(id)
    saveSurfaceTheme(id)
    applySurfaceTheme(id, teamColor)
  }

  return (
    <div className="card">
      <p className="section-label mb-3">{t('theme.title')}</p>
      <div className="grid grid-cols-4 gap-2">
        {SURFACE_PRESETS.map((preset) => {
          const isActive = selected === preset.id
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
              {/* Color swatch — 3-layer preview */}
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)', border: '2px solid rgba(255,255,255,0.8)' }}
              >
                <div className="w-full h-1/2" style={{ background: preset.swatch[0] }} />
                <div className="w-full h-1/2" style={{ background: preset.swatch[1] }} />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 10, height: 10,
                    bottom: 3, right: 3,
                    background: preset.swatch[2],
                    border: '1.5px solid rgba(255,255,255,0.9)',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-bold leading-tight text-center"
                style={{ color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}
              >
                {t(`theme.${preset.id}`)}
              </span>
            </button>
          )
        })}
      </div>
      {selected === 'team' && !teamColor && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {t('theme.noTeamHint')}
        </p>
      )}
    </div>
  )
}
