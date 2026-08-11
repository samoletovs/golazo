import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { getRank } from '../engine/xp'
import { fifaCardRatings, overallRating } from '../engine/skills'
import { renderFifaCard } from '../engine/fifaCard'
import { PhotoUpload } from '../components/PhotoUpload'
import { AchievementsList } from '../components/AchievementsList'
import { PersonalGoals } from '../components/PersonalGoals'
import { ThemePicker } from '../components/ThemePicker'
import { TeamPicker } from '../components/TeamPicker'
import type { Language, AccountRole } from '../engine/types'
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

export function Profile() {
  const { t, i18n } = useTranslation()
  const { xp, skillTree, matches, trainings, profile, setProfile, physicalProfile, resetState } = useApp()
  const { user, logout } = useAuth()
  const rank = getRank(xp.level)
  const ratings = fifaCardRatings(skillTree)
  const overall = overallRating(skillTree)
  const [exporting, setExporting] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const [showPhysicalUpdate, setShowPhysicalUpdate] = useState(false)
  const [showFieldsEditor, setShowFieldsEditor] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

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

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('profile.title')}</h2>

      {/* Squad picker modal — portal to body to avoid mobile fixed-position issues */}
      {showTeams && createPortal(
        <TeamPicker mode={profile?.role === 'coach' ? 'coach' : 'player'} onClose={() => setShowTeams(false)} />,
        document.body
      )}

      {/* Photo upload */}
      <PhotoUpload />

      {/* Player-only: FIFA card, stats, achievements */}
      {profile?.role === 'player' && (
      <>
      {/* FIFA-style player card */}
      <div
        className="fifa-card animate-fade-up"
        style={{
          background: tierStyle.gradient,
          boxShadow: `0 4px 20px ${tierStyle.border}, 0 8px 40px ${tierStyle.border}`,
        }}
      >
        {/* ── Top: Rating + Photo + Name ── */}
        <div className="flex items-center gap-4 mb-5">
          {/* Overall rating — BIG number */}
          <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 56 }}>
            <span className="text-5xl font-black font-data leading-none" style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
              {overallDisplay}
            </span>
            <span
              className="mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              {t(rank.key)}
            </span>
          </div>

          {/* Player photo */}
          {profile?.photoUrl ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.25)' }}>
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.15)' }}>
              <span className="text-3xl">⚽</span>
            </div>
          )}

          {/* Name + position */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-extrabold leading-tight truncate heading-display" style={{ color: '#fff' }}>
              {profile?.name ?? 'Player'}
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {profile?.jerseyNumber ? `#${profile.jerseyNumber} · ` : ''}{profile?.positions?.slice(0, 3).join(' / ') ?? 'CM'}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {profile?.team ?? profile?.teams?.find(t => t.isPrimary)?.name ?? ''}
            </p>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 -20px', width: 'calc(100% + 40px)' }} />

        {/* ── Skill Ratings (3×2) ── */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          {ratings.map((r) => (
            <div
              key={r.category}
              className="text-center py-2.5 rounded-xl relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-2 right-2 h-[2px] rounded-full" style={{ background: CATEGORY_COLORS[r.category] }} />
              <p className="text-2xl font-black font-data leading-none mt-1" style={{ color: '#fff' }}>{r.rating * 10}</p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {FIFA_LABELS[r.category]}
              </p>
            </div>
          ))}
        </div>

        {/* ── Season Stats ── */}
        <div className="flex gap-3 mt-4">
          {[
            { val: matches.length, label: t('dashboard.matches'), color: '#fff' },
            { val: seasonGoals, label: t('dashboard.goals'), color: '#fbbf24' },
            { val: seasonAssists, label: t('dashboard.assists'), color: '#fff' },
            { val: trainings.length, label: t('log.training'), color: '#fff' },
          ].map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <p className="text-lg font-black font-data leading-none" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Streak (if any) ── */}
        {xp.streakDays > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span>🔥</span>
            <span className="text-sm font-bold" style={{ color: '#fbbf24' }}>{xp.streakDays} {t('dashboard.streak', { days: xp.streakDays })}</span>
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
      </>
      )}

      {/* Coach info header + squad management */}
      {profile?.role === 'coach' && (
        <div className="card animate-fade-up">
          <div className="flex items-center gap-4 mb-3">
            {profile?.photoUrl && (
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xl font-extrabold leading-tight truncate">{profile?.name ?? 'Coach'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                📋 {t('coach.role')}
                {(profile?.city || profile?.country) ? ` • 📍 ${[profile?.city, profile?.country].filter(Boolean).join(', ')}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mentor info header */}
      {profile?.role === 'mentor' && (
        <div className="card animate-fade-up">
          <div className="flex items-center gap-4">
            {profile?.photoUrl && (
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xl font-extrabold leading-tight truncate">{profile?.name ?? 'Mentor'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                🎯 {t('login.asMentor')}
                {(profile?.city || profile?.country) ? ` • 📍 ${[profile?.city, profile?.country].filter(Boolean).join(', ')}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Teams — player and mentor */}
      {(profile?.role === 'player' || profile?.role === 'mentor') && (
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
          <div className="flex flex-col gap-1.5">
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {t('teams.tapToSetMain')}
            </p>
            {profile!.teams!.filter((t) => t.active).map((team) => (
              <button
                key={team.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left tap-target transition-all"
                style={{
                  background: 'var(--color-glass-hover)',
                }}
                onClick={() => {
                  if (team.isPrimary) return
                  const updated = profile!.teams!.map((t) => ({ ...t, isPrimary: t.id === team.id }))
                  setProfile({ ...profile!, team: team.name, teams: updated })
                }}
              >
                {/* Color dot from club */}
                {team.colors?.[0] && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ background: team.colors[0], boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{team.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {team.position ? (Array.isArray(team.position) ? team.position.join(', ') : team.position) : ''}
                  </p>
                </div>
                {/* Star indicator for main club */}
                <span className="text-lg flex-shrink-0" style={{ color: team.isPrimary ? '#F59E0B' : 'var(--color-border-default)' }}>
                  {team.isPrimary ? '★' : '☆'}
                </span>
              </button>
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
      )}

      {/* My Teams — coach */}
      {profile?.role === 'coach' && (
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
        {(profile?.managedTeams?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-2">
            {profile!.managedTeams!.map((team) => (
              <div key={team.teamId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--color-glass-hover)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{team.teamName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t(`coach.role.${team.role}`)}
                    {team.clubName ? ` · ${team.clubName}` : ''}
                  </p>
                </div>
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
      )}

      {/* Achievements — player only */}
      {profile?.role === 'player' && (
      <div className="card animate-fade-up">
        <AchievementsList />
      </div>
      )}

      {/* Personalized goals — player only */}
      {profile?.role === 'player' && (
      <div className="card animate-fade-up">
        <PersonalGoals />
      </div>
      )}

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

      {/* Physical stats — player only */}
      {profile?.role === 'player' && (
      <>
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
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-muted)' }}>
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
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
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
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {groupInfo.emoji} {t(groupInfo.labelKey)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleFields.map((f: { key: string; unit: string; labelKey: string }) => {
                      const val = (m as unknown as Record<string, unknown>)[f.key]
                      const diff = getDiff(f.key)
                      return (
                        <div key={f.key} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--color-bg-warm)' }}>
                          <div className="min-w-0">
                            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{t(f.labelKey)}</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-black font-data">{String(val ?? '')}</span>
                              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.unit}</span>
                            </div>
                          </div>
                          {diff && (
                            <span className="text-xs font-bold font-data shrink-0 ml-1" style={{ color: diff.improved ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
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
      </>
      )}

      {/* Account section */}
      <div className="card">
        <p className="section-label mb-2">{t('profile.account')}</p>
        {user && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {user.userDetails}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {/* Role switcher */}
          {profile && (
            <div className="mb-2">
              <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                {t('profile.switchRole')}
              </p>
              <div className="flex gap-2">
                {([
                  { role: 'player' as AccountRole, emoji: '🏃', label: t('login.asPlayer') },
                  { role: 'mentor' as AccountRole, emoji: '🎯', label: t('login.asMentor') },
                  { role: 'coach' as AccountRole, emoji: '📋', label: t('coach.role') },
                ] as const).map(({ role, emoji, label }) => (
                  <button
                    key={role}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl tap-target text-center transition-all"
                    style={{
                      background: profile.role === role ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)',
                      color: profile.role === role ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                      border: profile.role === role ? '2px solid var(--color-primary)' : '2px solid transparent',
                    }}
                    onClick={() => {
                      if (profile.role !== role) {
                        setProfile({ ...profile, role })
                      }
                    }}
                    aria-pressed={profile.role === role}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
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
            onClick={() => setConfirmingReset(true)}
          >
            {t('profile.reset')}
          </button>
          {confirmingReset && (
            <div className="card mt-1 flex flex-col gap-2 animate-fade-up" role="alertdialog" aria-live="polite">
              <p className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>
                {t('profile.resetConfirm')}
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-choice tap-target text-xs flex-1"
                  onClick={() => setConfirmingReset(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="tap-target text-xs flex-1 rounded-xl py-2 font-bold"
                  style={{ background: 'var(--color-danger)', color: 'white' }}
                  onClick={() => {
                    setConfirmingReset(false)
                    resetState()
                    window.location.reload()
                  }}
                >
                  {t('profile.reset')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
