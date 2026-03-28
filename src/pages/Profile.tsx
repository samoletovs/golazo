import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { getRank } from '../engine/xp'
import { fifaCardRatings, overallRating } from '../engine/skills'
import { renderFifaCard } from '../engine/fifaCard'
import { PhotoUpload } from '../components/PhotoUpload'
import { AchievementsList } from '../components/AchievementsList'
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
  const { xp, skillTree, matches, trainings, profile, physicalProfile, resetState } = useApp()
  const { user, logout } = useAuth()
  const rank = getRank(xp.level)
  const ratings = fifaCardRatings(skillTree)
  const overall = overallRating(skillTree)
  const [exporting, setExporting] = useState(false)

  const seasonGoals = matches.reduce((s, m) => s + m.goals, 0)
  const seasonAssists = matches.reduce((s, m) => s + m.assists, 0)

  function changeLanguage(lang: Language) {
    i18n.changeLanguage(lang)
    localStorage.setItem('golazo-lang', lang)
  }

  async function exportCard() {
    if (!profile) return
    setExporting(true)
    try {
      const blob = await renderFifaCard(profile, xp, skillTree, {
        matches: matches.length,
        goals: seasonGoals,
        assists: seasonAssists,
      })
      const url = URL.createObjectURL(blob)

      // Try native share if available (mobile)
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'golazo-card.png', { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], 'golazo-card.png', { type: 'image/png' })],
          title: 'My Golazo Card',
        })
      } else {
        // Fallback: download
        const a = document.createElement('a')
        a.href = url
        a.download = `golazo-${profile.name.toLowerCase().replace(/\s+/g, '-')}.png`
        a.click()
      }
      URL.revokeObjectURL(url)
    } catch {
      // User cancelled share dialog — ignore
    } finally {
      setExporting(false)
    }
  }

  const rankGradient =
    rank.color === 'bronze' ? 'linear-gradient(135deg, #cd7f32, #a0622a)'
    : rank.color === 'silver' ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
    : rank.color === 'gold' ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
    : rank.color === 'diamond' ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
    : 'linear-gradient(135deg, #8b5cf6, #c4b5fd)'

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('profile.title')}</h2>

      {/* Photo upload */}
      <PhotoUpload />

      {/* FIFA-style player card */}
      <div
        className="card-gold relative overflow-hidden animate-fade-up"
      >
        <div className="flex items-center gap-4">
          {/* Overall rating */}
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black font-data" style={{ background: rankGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {Math.round(overall * 10)}
            </span>
            <span className="text-xs font-bold" style={{ background: rankGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t(rank.key)}
            </span>
          </div>

          {/* Player photo */}
          {profile?.photoUrl && (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.3)' }}>
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Player info */}
          <div className="flex-1">
            <p className="text-lg font-bold">{profile?.name ?? 'Player'}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {profile?.positions?.join(' / ') ?? 'CM'} • {profile?.team ?? 'RFS'}
            </p>
            <p className="text-xs font-data" style={{ color: 'var(--color-text-muted)' }}>
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
              <span className="text-sm font-black font-data">{r.rating * 10}</span>
            </div>
          ))}
        </div>

        {/* Season stats */}
        <div className="flex gap-4 mt-4 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
          <div className="text-center flex-1">
            <p className="text-lg font-black font-data">{matches.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.matches')}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-black font-data" style={{ color: 'var(--color-gold-500)' }}>{seasonGoals}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.goals')}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-black font-data" style={{ color: 'var(--color-cyan)' }}>{seasonAssists}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.assists')}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-black font-data">{trainings.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('log.training')}</p>
          </div>
        </div>
      </div>

      {/* Export FIFA card */}
      <button
        className="btn-primary w-full text-sm"
        onClick={exportCard}
        disabled={exporting || !profile}
        aria-label={t('profile.export')}
      >
        {exporting ? t('common.loading') : t('profile.export')}
      </button>

      {/* Achievements */}
      <div className="card animate-fade-up">
        <AchievementsList />
      </div>

      {/* Language selector */}
      <div className="card">
        <p className="section-label mb-3">
          {t('profile.language')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANG_OPTIONS.map((lang) => (
            <button
              key={lang.key}
              className="btn-choice tap-target text-sm text-center"
              onClick={() => changeLanguage(lang.key)}
              aria-pressed={i18n.language === lang.key}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Physical stats */}
      {physicalProfile && physicalProfile.measurements.length > 0 && (
        <div className="card">
          <p className="section-label mb-3">{t('profile.physical')}</p>
          {(() => {
            const m = physicalProfile.measurements[physicalProfile.latestIndex]
            return (
              <div className="grid grid-cols-2 gap-3">
                {m.heightCm > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-black font-data">{m.heightCm}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>cm</p>
                  </div>
                )}
                {m.weightKg > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-black font-data">{m.weightKg}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>kg</p>
                  </div>
                )}
                {m.sprintTime100m && (
                  <div className="text-center">
                    <p className="text-lg font-black font-data">{m.sprintTime100m}s</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>100m</p>
                  </div>
                )}
                {m.juggleRecord && (
                  <div className="text-center">
                    <p className="text-lg font-black font-data">{m.juggleRecord}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('profile.juggles')}</p>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Account section */}
      <div className="card">
        <p className="section-label mb-3">{t('profile.account')}</p>
        {user && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {user.userDetails}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {user && (
            <button
              className="btn-choice tap-target text-sm text-center"
              onClick={logout}
            >
              {t('profile.logout')}
            </button>
          )}
          <button
            className="tap-target text-xs text-center py-2"
            style={{ color: 'var(--color-danger)' }}
            onClick={() => {
              if (window.confirm(t('profile.resetConfirm'))) {
                resetState()
                window.location.reload()
              }
            }}
          >
            {t('profile.reset')}
          </button>
        </div>
      </div>
    </div>
  )
}
