import { useTranslation } from 'react-i18next'
import type { SharedTeam } from '../engine/types'

interface TeamProfileProps {
  team: SharedTeam
  onClose: () => void
}

export function TeamProfile({ team, onClose }: TeamProfileProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="app-shell w-full bg-white rounded-t-2xl p-4 pb-8 animate-fade-up" style={{ maxHeight: '75dvh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold truncate flex-1">{team.name}</h3>
          <button className="tap-target text-lg ml-2" onClick={onClose} aria-label={t('common.cancel')}>✕</button>
        </div>

        {/* Header: logo + key info */}
        <div className="flex items-center gap-4 mb-4">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={team.name}
              className="w-16 h-16 rounded-xl object-contain shrink-0"
              style={{ background: 'var(--color-glass-hover)' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '' }}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-glass-hover)' }}>
              <span className="text-3xl">⚽</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {team.abbreviation && (
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>{team.abbreviation}</p>
            )}
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {[team.city, team.country].filter(Boolean).join(', ')}
            </p>
            {team.league && (
              <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-green-500)' }}>{team.league}</p>
            )}
            {team.verified && (
              <span className="inline-block text-[0.6rem] px-2 py-0.5 rounded-full mt-1"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-green-600)' }}>
                ✓ {t('teams.verified')}
              </span>
            )}
          </div>
        </div>

        {/* Colors */}
        {team.colors && team.colors.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {team.colors.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full"
                style={{ background: color, border: '1px solid rgba(0,0,0,0.1)' }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {team.foundedYear && (
            <div className="card p-2 text-center">
              <p className="text-lg font-black font-data">{team.foundedYear}</p>
              <p className="text-[0.6rem]" style={{ color: 'var(--color-text-muted)' }}>{t('teams.founded')}</p>
            </div>
          )}
          {team.stadium && (
            <div className="card p-2 text-center">
              <p className="text-xs font-bold">🏟️</p>
              <p className="text-[0.6rem]" style={{ color: 'var(--color-text-muted)' }}>{team.stadium}</p>
            </div>
          )}
        </div>

        {/* Age groups */}
        {team.ageGroups && team.ageGroups.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('teams.ageGroups')}</p>
            <div className="flex flex-wrap gap-1">
              {team.ageGroups.map((ag) => (
                <span key={ag} className="text-[0.65rem] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-secondary)' }}>
                  {ag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Aliases */}
        {team.aliases.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>{t('teams.knownAs')}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {team.aliases.join(', ')}
            </p>
          </div>
        )}

        {/* Website + social */}
        {team.website && (
          <a
            href={team.website}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-bold mb-2 truncate"
            style={{ color: 'var(--color-cyan)' }}
          >
            🔗 {team.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
          </a>
        )}

        {team.socialMedia && team.socialMedia.length > 0 && (
          <div className="flex gap-2 mb-3">
            {team.socialMedia.map((sm, i) => (
              <a
                key={i}
                href={sm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded"
                style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-secondary)' }}
              >
                {sm.platform}
              </a>
            ))}
          </div>
        )}

        <button className="btn-primary w-full mt-2" onClick={onClose}>
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
