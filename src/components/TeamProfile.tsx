import { useTranslation } from 'react-i18next'
import type { SharedTeam } from '../engine/types'

interface TeamProfileProps {
  team: SharedTeam
  onClose: () => void
}

const SOCIAL_ICONS: Record<string, string> = {
  youtube: '▶️', instagram: '📷', facebook: '👤', twitter: '🐦', x: '𝕏',
  tiktok: '🎵', linkedin: '💼', website: '🔗',
}

export function TeamProfile({ team, onClose }: TeamProfileProps) {
  const { t } = useTranslation()
  const primaryColor = team.colors?.[0] ?? 'var(--color-primary)'
  const secondaryColor = team.colors?.[1] ?? 'var(--color-primary-light)'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="app-shell w-full rounded-t-2xl animate-fade-up"
        style={{ maxHeight: '85dvh', overflowY: 'auto', background: 'var(--color-glass, #fff)' }}
      >
        {/* ── Hero header with team color gradient ── */}
        <div
          className="relative px-5 pt-5 pb-6 rounded-t-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          {/* Close button */}
          <button
            className="absolute top-4 right-4 tap-target w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            ✕
          </button>

          {/* Logo + Name row */}
          <div className="relative flex items-center gap-4">
            {team.logoUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <span className="text-3xl">⚽</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-extrabold text-white leading-tight truncate">
                {team.name}
              </h3>
              {team.abbreviation && (
                <p className="text-xs font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {team.abbreviation}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {[team.city, team.country].filter(Boolean).join(', ')}
                </p>
                {team.verified && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    ✓
                  </span>
                )}
              </div>
              {team.league && (
                <p className="text-xs font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {team.league}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Content body ── */}
        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Quick facts row */}
          {(team.foundedYear || team.stadium) && (
            <div className="flex gap-3">
              {team.foundedYear && (
                <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                  <p className="text-xl font-black font-data">{team.foundedYear}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {t('teams.founded')}
                  </p>
                </div>
              )}
              {team.stadium && (
                <div className="flex-1 text-center py-3 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
                  <p className="text-sm font-bold">🏟️</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {team.stadium}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Age groups */}
          {team.ageGroups && team.ageGroups.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                {t('teams.ageGroups')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {team.ageGroups.map((ag) => (
                  <span key={ag} className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-secondary)' }}>
                    {ag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Website + Social links */}
          {(team.website || (team.socialMedia && team.socialMedia.length > 0)) && (
            <div className="flex flex-wrap gap-2">
              {team.website && (
                <a
                  href={team.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  style={{ background: 'var(--color-glass-hover)', color: 'var(--color-primary-dark)' }}
                >
                  🔗 {team.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              )}
              {team.socialMedia?.map((sm, i) => (
                <a
                  key={i}
                  href={sm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-secondary)' }}
                >
                  {SOCIAL_ICONS[sm.platform] ?? '🔗'} {sm.platform}
                </a>
              ))}
            </div>
          )}

          {/* Aliases */}
          {team.aliases.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                {t('teams.knownAs')}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {team.aliases.join(' · ')}
              </p>
            </div>
          )}

          {/* Close button */}
          <button
            className="w-full text-center py-3 rounded-xl text-sm font-bold tap-target"
            style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-secondary)' }}
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
