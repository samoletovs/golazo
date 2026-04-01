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
import { ThemePicker } from '../components/ThemePicker'
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

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'var(--color-cat-technical)',
  physical: 'var(--color-cat-physical)',
  tactical: 'var(--color-cat-tactical)',
  mental: 'var(--color-cat-mental)',
  performance: 'var(--color-cat-matchplay)',
  knowledge: 'var(--color-cat-knowledge)',
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

  // FUT-style card tier based on overall skill rating (not XP level)
  // Aligns with EA FC card tiers: Bronze ≤64, Silver 65-74, Gold 75-84, Diamond 85-89, Elite 90+
  const overallDisplay = Math.round(overall * 10)
  const cardTier =
    overallDisplay >= 90 ? 'elite'
    : overallDisplay >= 85 ? 'diamond'
    : overallDisplay >= 75 ? 'gold'
    : overallDisplay >= 65 ? 'silver'
    : 'bronze'

  // FUT-inspired card tier gradients (premium, not muddy)
  const CARD_TIER_STYLES: Record<string, { gradient: string; border: string; label: string }> = {
    bronze:  { gradient: 'linear-gradient(135deg, #92400e, #b45309)', border: 'rgba(180, 83, 9, 0.3)', label: '#d97706' },
    silver:  { gradient: 'linear-gradient(135deg, #475569, #64748b)', border: 'rgba(100, 116, 139, 0.3)', label: '#94a3b8' },
    gold:    { gradient: 'linear-gradient(135deg, #b45309, #d97706)', border: 'rgba(217, 119, 6, 0.3)', label: '#fbbf24' },
    diamond: { gradient: 'linear-gradient(135deg, #1d4ed8, #2563eb)', border: 'rgba(37, 99, 235, 0.3)', label: '#60a5fa' },
    elite:   { gradient: 'linear-gradient(135deg, #6d28d9, #7c3aed)', border: 'rgba(124, 58, 237, 0.3)', label: '#a78bfa' },
  }
  const tierStyle = CARD_TIER_STYLES[cardTier]

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

  // Show Teams page when active
  if (showTeams) {
    return <TeamsManager onClose={() => setShowTeams(false)} />
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('profile.title')}</h2>

      {/* Photo upload */}
      <PhotoUpload />

      {/* FIFA-style player card */}
      <div
        className="card-gold relative overflow-hidden animate-fade-up"
        style={{ borderColor: tierStyle.border }}
      >
        {/* ── Hero: Rating + Identity ── */}
        <div className="flex items-start gap-4">
          {/* Overall rating badge */}
          <div className="flex flex-col items-center pt-1">
            <span className="text-5xl font-black font-data leading-none" style={{ background: tierStyle.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {overallDisplay}
            </span>
            <span
              className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
              style={{ background: tierStyle.gradient }}
            >
              {t(rank.key)}
            </span>
          </div>

          {/* Player photo */}
          {profile?.photoUrl && (
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold leading-tight truncate">{profile?.name ?? 'Player'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {profile?.jerseyNumber ? `#${profile.jerseyNumber} • ` : ''}{profile?.positions?.join(' / ') ?? 'CM'} • {profile?.team ?? '???'}
            </p>
            {(profile?.city || profile?.country) && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                📍 {[profile?.city, profile?.country].filter(Boolean).join(', ')}
              </p>
            )}
            <p className="text-xs font-data mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Level {xp.level} • {xp.totalXp.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* ── Skill Ratings (3×2 colored grid) ── */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          {ratings.map((r) => (
            <div
              key={r.category}
              className="relative rounded-lg px-3 py-2.5 text-center overflow-hidden"
              style={{ background: 'var(--color-bg-warm)' }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-lg"
                style={{ background: CATEGORY_COLORS[r.category] }}
              />
              <p className="text-lg font-black font-data leading-none">{r.rating * 10}</p>
              <p
                className="text-[10px] font-bold uppercase tracking-wider mt-1"
                style={{ color: CATEGORY_COLORS[r.category] }}
              >
                {FIFA_LABELS[r.category]}
              </p>
            </div>
          ))}
        </div>

        {/* ── Season Stats ── */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center py-2 rounded-lg" style={{ background: 'var(--color-bg-warm)' }}>
            <p className="text-xl font-black font-data leading-none">{matches.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.matches')}</p>
          </div>
          <div className="text-center py-2 rounded-lg" style={{ background: 'var(--color-bg-warm)' }}>
            <p className="text-xl font-black font-data leading-none" style={{ color: 'var(--color-gold-500)' }}>{seasonGoals}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.goals')}</p>
          </div>
          <div className="text-center py-2 rounded-lg" style={{ background: 'var(--color-bg-warm)' }}>
            <p className="text-xl font-black font-data leading-none" style={{ color: 'var(--color-primary-light)' }}>{seasonAssists}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.assists')}</p>
          </div>
          <div className="text-center py-2 rounded-lg" style={{ background: 'var(--color-bg-warm)' }}>
            <p className="text-xl font-black font-data leading-none">{trainings.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('log.training')}</p>
          </div>
        </div>

        {/* ── Activity Streaks ── */}
        {(xp.streakDays > 0 || xp.checkInStreakDays > 0) && (
          <div className="flex gap-2 mt-3">
            {xp.streakDays > 0 && (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: '#fef3c7' }}>
                <span>🔥</span>
                <span className="text-sm font-bold">{xp.streakDays}</span>
                <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.streak', { days: xp.streakDays })}</span>
              </div>
            )}
            {xp.checkInStreakDays > 0 && (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: '#dcfce7' }}>
                <span>✅</span>
                <span className="text-sm font-bold">{xp.checkInStreakDays}</span>
                <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{t('checkin.streak', { days: xp.checkInStreakDays })}</span>
              </div>
            )}
          </div>
        )}
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

      {/* My Teams — inline display */}
      <div className="card animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">{t('teams.title')}</p>
          <button
            className="text-xs font-bold tap-target"
            style={{ color: 'var(--color-primary-dark)' }}
            onClick={() => setShowTeams(true)}
          >
            {t('teams.manage')}
          </button>
        </div>
        {(profile?.teams?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-2">
            {profile!.teams!.filter((t) => t.active).map((team, i) => (
              <div
                key={team.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: i === 0
                    ? 'rgba(var(--color-primary-rgb), 0.08)'
                    : 'var(--color-glass-hover)',
                  border: i === 0
                    ? '1.5px solid rgba(var(--color-primary-rgb), 0.15)'
                    : '1.5px solid transparent',
                }}
              >
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt=""
                    className="w-8 h-8 rounded-lg object-contain shrink-0"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <span className="text-lg">⚽</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{team.name}</p>
                  {i === 0 && (
                    <p className="text-[10px] font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                      ★ {t('teams.primary')}
                    </p>
                  )}
                </div>
                {team.colors && team.colors.length > 0 && (
                  <div className="flex gap-1">
                    {team.colors.slice(0, 3).map((color, ci) => (
                      <div
                        key={ci}
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ background: color, border: '1px solid rgba(0,0,0,0.08)' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <button
            className="w-full text-center py-3 rounded-xl text-sm"
            style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-muted)' }}
            onClick={() => setShowTeams(true)}
          >
            + {t('teams.addFirst')}
          </button>
        )}
      </div>

      {/* Achievements */}
      <div className="card animate-fade-up">
        <AchievementsList />
      </div>

      {/* Language selector */}
      <div className="card">
        <p className="section-label mb-2">
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

      {/* App Theme */}
      <ThemePicker />

      {/* Physical stats */}
      {showPhysicalUpdate && (
        <PhysicalUpdateFlow onClose={() => setShowPhysicalUpdate(false)} />
      )}
      {showFieldsEditor && (
        <TrackedFieldsEditor onClose={() => setShowFieldsEditor(false)} />
      )}
      {physicalProfile && physicalProfile.measurements.length > 0 && (() => {
        const m = physicalProfile.measurements[physicalProfile.latestIndex]
        const prev = physicalProfile.measurements.length >= 2
          ? physicalProfile.measurements[physicalProfile.latestIndex - 1] ?? physicalProfile.measurements[physicalProfile.measurements.length - 2]
          : null
        const tier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
        const fields = getTrackedFieldConfigs(physicalProfile, tier)
        const groups: string[] = [...new Set(fields.map((f: { group: string }) => f.group))]
        const totalMeasurements = physicalProfile.measurements.length

        // Fields where lower is better (sprint times, agility course time)
        const lowerIsBetter = new Set(['sprintTime10m', 'sprintTime20m', 'sprintTime30m', 'agilityCourseTime', 'restingHeartRate', 'bodyFatPct'])

        function getDiff(key: string): { value: number; improved: boolean } | null {
          if (!prev) return null
          const curr = (m as unknown as Record<string, number | undefined>)[key]
          const old = (prev as unknown as Record<string, number | undefined>)[key]
          if (curr === null || curr === undefined || old === null || old === undefined || curr === 0 || old === 0) return null
          const diff = curr - old
          if (diff === 0) return null
          const improved = lowerIsBetter.has(key) ? diff < 0 : diff > 0
          return { value: diff, improved }
        }

        return (
          <div className="card animate-fade-up">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <p className="section-label">{t('profile.physical')}</p>
                {totalMeasurements > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-muted)' }}>
                    {t('physical.measurementCount', { count: totalMeasurements })}
                  </span>
                )}
              </div>
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
                  className="text-xs font-bold px-3 py-1.5 rounded-lg tap-target"
                  style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}
                  onClick={() => setShowPhysicalUpdate(true)}
                >
                  {t('physical.update')}
                </button>
              </div>
            </div>
            <p className="text-[10px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
              {t('physical.lastUpdated', { date: new Date(m.measuredAt).toLocaleDateString() })}
            </p>
            {groups.map((group) => {
              const groupFields = fields.filter((f: { group: string }) => f.group === group)
              const groupInfo = PHYSICAL_GROUPS[group]
              const visibleFields = groupFields.filter((f: { key: string }) => {
                const val = (m as unknown as Record<string, unknown>)[f.key]
                return val !== null && val !== undefined && val !== 0
              })
              if (visibleFields.length === 0) return null
              return (
                <div key={group} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {groupInfo.emoji} {t(groupInfo.labelKey)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleFields.map((f: { key: string; unit: string; labelKey: string }) => {
                      const val = (m as unknown as Record<string, unknown>)[f.key]
                      const diff = getDiff(f.key)
                      return (
                        <div key={f.key} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--color-bg-warm)' }}>
                          <div className="min-w-0">
                            <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{t(f.labelKey)}</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-black font-data">{String(val ?? '')}</span>
                              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{f.unit}</span>
                            </div>
                          </div>
                          {diff && (
                            <span className="text-[10px] font-bold font-data shrink-0 ml-1" style={{ color: diff.improved ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
                              {diff.improved ? '↑' : '↓'}{Math.abs(diff.value).toFixed(f.unit === 'sec' ? 2 : f.unit === '%' || f.unit === 'kg' ? 1 : 0)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Account section */}
      <div className="card">
        <p className="section-label mb-2">{t('profile.account')}</p>
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
              className="btn-choice tap-target text-sm text-center w-full flex items-center justify-center gap-2"
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
