import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { getRank } from '../engine/xp'
import { fifaCardRatings, overallRating } from '../engine/skills'
import type { Language } from '../engine/types'

const LANG_OPTIONS: { key: Language; label: string }[] = [
  { key: 'ru', label: '🇷🇺 Русский' },
  { key: 'lv', label: '🇱🇻 Latviešu' },
  { key: 'en', label: '🇬🇧 English' },
  { key: 'es', label: '🇪🇸 Español' },
]

const FIFA_LABELS: Record<string, string> = {
  technical: 'TEC', physical: 'PHY', tactical: 'TAC',
  mental: 'MEN', matchPlay: 'MAT', knowledge: 'KNO',
}

export function Profile() {
  const { t, i18n } = useTranslation()
  const { xp, skillTree, matches, trainings, profile } = useApp()
  const rank = getRank(xp.level)
  const ratings = fifaCardRatings(skillTree)
  const overall = overallRating(skillTree)

  const seasonGoals = matches.reduce((s, m) => s + m.goals, 0)
  const seasonAssists = matches.reduce((s, m) => s + m.assists, 0)

  function changeLanguage(lang: Language) {
    i18n.changeLanguage(lang)
    localStorage.setItem('golazo-lang', lang)
  }

  const rankColor =
    rank.color === 'bronze' ? 'var(--color-bronze)'
    : rank.color === 'silver' ? 'var(--color-silver)'
    : rank.color === 'gold' ? 'var(--color-gold)'
    : rank.color === 'diamond' ? 'var(--color-diamond)'
    : 'var(--color-platinum)'

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h2 className="text-lg font-bold">{t('profile.title')}</h2>

      {/* FIFA-style player card */}
      <div
        className="card relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-surface) 0%, ${rankColor}22 100%)`,
          borderColor: rankColor,
        }}
      >
        <div className="flex items-center gap-4">
          {/* Overall rating */}
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black" style={{ color: rankColor }}>
              {Math.round(overall * 10)}
            </span>
            <span className="text-xs font-bold" style={{ color: rankColor }}>
              {t(rank.key)}
            </span>
          </div>

          {/* Player info */}
          <div className="flex-1">
            <p className="text-lg font-bold">{profile?.name ?? 'Player'}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {profile?.positions?.join(' / ') ?? 'CM'} • {profile?.team ?? 'RFS'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Level {xp.level} • {xp.totalXp.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Skill ratings grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {ratings.map((r) => (
            <div key={r.category} className="flex items-center gap-2">
              <span className="text-xs font-bold w-8" style={{ color: 'var(--color-text-muted)' }}>
                {FIFA_LABELS[r.category]}
              </span>
              <span className="text-sm font-bold">{r.rating * 10}</span>
            </div>
          ))}
        </div>

        {/* Season stats */}
        <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-pitch-line)' }}>
          <div className="text-center flex-1">
            <p className="text-lg font-bold">{matches.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.matches')}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold" style={{ color: 'var(--color-gold)' }}>{seasonGoals}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.goals')}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold" style={{ color: 'var(--color-diamond)' }}>{seasonAssists}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.assists')}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold">{trainings.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('log.training')}</p>
          </div>
        </div>
      </div>

      {/* Language selector */}
      <div className="card">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          {t('profile.language')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANG_OPTIONS.map((lang) => (
            <button
              key={lang.key}
              className="card tap-target text-sm text-center"
              style={{
                borderColor: i18n.language === lang.key ? 'var(--color-pitch-green-light)' : undefined,
                background: i18n.language === lang.key ? 'var(--color-surface-light)' : undefined,
              }}
              onClick={() => changeLanguage(lang.key)}
              aria-pressed={i18n.language === lang.key}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
