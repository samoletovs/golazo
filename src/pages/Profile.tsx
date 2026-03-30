import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { getRank } from '../engine/xp'
import { fifaCardRatings, overallRating } from '../engine/skills'
import { renderFifaCard } from '../engine/fifaCard'
import { PhotoUpload } from '../components/PhotoUpload'
import { AchievementsList } from '../components/AchievementsList'
import { TeamsManager } from '../components/TeamsManager'
import type { Language } from '../engine/types'
import { getAgeTier } from '../engine/types'
import { getTrackedFieldConfigs, PHYSICAL_GROUPS } from '../engine/physical'
import { PhysicalUpdateFlow } from '../components/PhysicalUpdateFlow'
import { TrackedFieldsEditor } from '../components/TrackedFieldsEditor'

const LANG_OPTIONS: { key: Language; label: string }[] = [
  { key: 'en', label: '🇬🇧 English' },
  { key: 'et', label: '🇪🇪 Eesti' },
  { key: 'es', label: '🇪🇸 Español' },
  { key: 'lv', label: '🇱🇻 Latviešu' },
  { key: 'ru', label: '🇷🇺 Русский' },
  { key: 'lt', label: '🇱🇹 Lietuvių' },
]

const FIFA_LABELS: Record<string, string> = {
  technical: 'TEC', physical: 'PHY', tactical: 'TAC',
  mental: 'MEN', performance: 'PER', knowledge: 'KNO',
}

export function Profile({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t, i18n } = useTranslation()
  const { xp, skillTree, matches, trainings, profile, physicalProfile, resetState } = useApp()
  const { user, logout } = useAuth()
  const rank = getRank(xp.level)
  const ratings = fifaCardRatings(skillTree)
  const overall = overallRating(skillTree)
  const [exporting, setExporting] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const [showPhysicalUpdate, setShowPhysicalUpdate] = useState(false)
  const [showFieldsEditor, setShowFieldsEditor] = useState(false)

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
              {profile?.jerseyNumber ? `#${profile.jerseyNumber} • ` : ''}{profile?.positions?.join(' / ') ?? 'CM'} • {profile?.team ?? '???'}
            </p>
            {(profile?.city || profile?.country) && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                📍 {[profile?.city, profile?.country].filter(Boolean).join(', ')}
              </p>
            )}
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

        {/* Activity Streaks */}
        <div className="flex gap-3 mt-3">
          {xp.streakDays > 0 && (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#fef3c7' }}>
              <span>🔥</span>
              <div>
                <p className="text-sm font-bold">{xp.streakDays}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.streak', { days: xp.streakDays })}</p>
              </div>
            </div>
          )}
          {xp.checkInStreakDays > 0 && (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#dcfce7' }}>
              <span>✅</span>
              <div>
                <p className="text-sm font-bold">{xp.checkInStreakDays}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t('checkin.streak', { days: xp.checkInStreakDays })}</p>
              </div>
            </div>
          )}
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

      {/* My Teams */}
      <button
        className="card w-full text-left flex items-center gap-3 animate-fade-up"
        onClick={() => setShowTeams(true)}
      >
        <span className="text-xl">⚽</span>
        <div className="flex-1">
          <p className="text-sm font-bold">{t('teams.title')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {(profile?.teams?.length ?? 0) > 0
              ? profile!.teams!.filter((t) => t.active).map((t) => t.name).join(', ')
              : t('teams.empty')}
          </p>
        </div>
        <span style={{ color: 'var(--color-text-muted)' }}>→</span>
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
      {showPhysicalUpdate && (
        <PhysicalUpdateFlow onClose={() => setShowPhysicalUpdate(false)} />
      )}
      {showFieldsEditor && (
        <TrackedFieldsEditor onClose={() => setShowFieldsEditor(false)} />
      )}
      {physicalProfile && physicalProfile.measurements.length > 0 && (() => {
        const m = physicalProfile.measurements[physicalProfile.latestIndex]
        const tier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
        const fields = getTrackedFieldConfigs(physicalProfile, tier)
        const groups: string[] = [...new Set(fields.map((f: { group: string }) => f.group))]

        return (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">{t('profile.physical')}</p>
              <div className="flex items-center gap-2">
                <button
                  className="text-xs tap-target"
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => setShowFieldsEditor(true)}
                  aria-label={t('physical.customize')}
                >
                  ⚙️
                </button>
                <button
                  className="text-xs font-bold tap-target"
                  style={{ color: 'var(--color-primary-dark)' }}
                  onClick={() => setShowPhysicalUpdate(true)}
                >
                  {t('physical.update')}
                </button>
              </div>
            </div>
            {groups.map((group) => {
              const groupFields = fields.filter((f: { group: string }) => f.group === group)
              const groupInfo = PHYSICAL_GROUPS[group]
              const visibleFields = groupFields.filter((f: { key: string }) => {
                const val = (m as unknown as Record<string, unknown>)[f.key]
                return val !== null && val !== undefined && val !== 0
              })
              if (visibleFields.length === 0) return null
              return (
                <div key={group} className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {groupInfo.emoji} {t(groupInfo.labelKey)}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {visibleFields.map((f: { key: string; unit: string }) => (
                      <div key={f.key} className="text-center">
                        <p className="text-lg font-black font-data">{String((m as unknown as Record<string, unknown>)[f.key] ?? '')}{f.unit === 'sec' || f.unit === '%' ? f.unit.charAt(0) : ''}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <p className="text-[10px] text-right" style={{ color: 'var(--color-text-muted)' }}>
              {t('physical.lastUpdated', { date: new Date(m.measuredAt).toLocaleDateString() })}
            </p>
          </div>
        )
      })()}

      {/* Account section */}
      <div className="card">
        <p className="section-label mb-3">{t('profile.account')}</p>
        {user && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {user.userDetails}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {/* Parent/Mentor Dashboard */}
          {onNavigate && (
            <button
              className="btn-choice tap-target text-sm text-center w-full flex items-center justify-center gap-2"
              onClick={() => onNavigate('mentor')}
            >
              👨‍👩‍👦 {t('profile.mentorDashboard')}
            </button>
          )}

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

      {showTeams && <TeamsManager onClose={() => setShowTeams(false)} />}
    </div>
  )
}
