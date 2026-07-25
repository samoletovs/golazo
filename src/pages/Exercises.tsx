import { useState, useMemo, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { exercises } from '../data/exercises'
import { VideoPlayer } from '../components/VideoPlayer'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { getAgeTier } from '../engine/types'
import type { SkillCategory, Exercise, UserDrill, Equipment } from '../engine/types'

const Challenges = lazy(() => import('./Challenges').then(m => ({ default: m.Challenges })))

const FILTER_OPTIONS: { key: SkillCategory | 'all'; labelKey: string; emoji: string }[] = [
  { key: 'all', labelKey: 'exercises.all', emoji: '🎯' },
  { key: 'technical', labelKey: 'skills.technical', emoji: '⚽' },
  { key: 'physical', labelKey: 'skills.physical', emoji: '💪' },
  { key: 'tactical', labelKey: 'skills.tactical', emoji: '🧠' },
  { key: 'mental', labelKey: 'skills.mental', emoji: '🧘' },
  { key: 'knowledge', labelKey: 'skills.knowledge', emoji: '📚' },
]

type SortKey = 'name' | 'difficulty' | 'duration'

const CAT_STRIPE: Record<string, string> = {
  technical: 'cat-stripe-technical',
  physical: 'cat-stripe-physical',
  tactical: 'cat-stripe-tactical',
  mental: 'cat-stripe-mental',
  knowledge: 'cat-stripe-knowledge',
  performance: 'cat-stripe-performance',
}

const CAT_EMOJI: Record<string, string> = {
  technical: '⚽',
  physical: '🏃',
  tactical: '🧠',
  mental: '🧘',
  knowledge: '📚',
  performance: '📊',
}

function getThumbnailUrl(videoUrl: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = videoUrl.match(pattern)
    if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
  }
  return null
}

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="difficulty-dots" aria-label={`${level}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`difficulty-dot ${i < level ? 'active' : ''}`} />
      ))}
    </span>
  )
}

function ExerciseDetailModal({
  exercise,
  isDone,
  isSaved,
  onClose,
  onMarkDone,
  onToggleSave,
  t,
}: {
  exercise: Exercise
  isDone: boolean
  isSaved: boolean
  onClose: () => void
  onMarkDone: () => void
  onToggleSave: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const thumbnail = exercise.thumbnailUrl || (exercise.videoUrl ? getThumbnailUrl(exercise.videoUrl) : null)

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="exercise-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label={t('exercises.detail.close')}>×</button>

        {/* Video or thumbnail */}
        {exercise.videoUrl ? (
          <div className="exercise-modal-video">
            <VideoPlayer videoUrl={exercise.videoUrl} title={t(exercise.nameKey)} />
          </div>
        ) : thumbnail ? (
          <div className="exercise-modal-thumb">
            <img src={thumbnail} alt={t(exercise.nameKey)} />
          </div>
        ) : (
          <div className="exercise-modal-icon">{CAT_EMOJI[exercise.category] ?? '⚽'}</div>
        )}

        {/* Title & description */}
        <h3 className="exercise-modal-title">{t(exercise.nameKey)}</h3>
        <p className="exercise-modal-desc">{t(exercise.descriptionKey)}</p>

        {/* Metadata grid */}
        <div className="exercise-modal-meta">
          <div className="meta-item">
            <span className="meta-label">{t('exercises.detail.duration')}</span>
            <span className="meta-value">{exercise.durationMinutes} min</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t('exercises.detail.difficulty')}</span>
            <span className="meta-value"><DifficultyDots level={exercise.difficulty} /></span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t('exercises.detail.equipment')}</span>
            <span className="meta-value">{exercise.equipment.map((e) => t(`equipment.${e}`)).join(', ')}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t('exercises.detail.positions')}</span>
            <span className="meta-value">
              {exercise.positions.length > 0 ? exercise.positions.join(', ') : t('exercises.detail.allPositions')}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">{t('exercises.detail.methodology')}</span>
            <span className="meta-value">{t(`methodology.${exercise.methodology}`)}</span>
          </div>
        </div>

        {/* Save / Action buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 tap-target text-sm font-bold py-3 rounded-full"
            style={{
              background: isSaved ? 'var(--color-gold-300)' : 'var(--color-bg-warm)',
              color: isSaved ? 'var(--color-amber-text)' : 'var(--color-text-secondary)',
            }}
            onClick={onToggleSave}
          >
            {isSaved ? '★ Saved' : '☆ Save'}
          </button>
          <button
            className="flex-1 exercise-modal-action"
            onClick={onMarkDone}
            disabled={isDone}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
            }}
          >
            {isDone ? `✓ ${t('exercises.done', { xp: XP_AWARDS.completeExercise })}` : `${t('exercises.markDone')} +${XP_AWARDS.completeExercise} XP`}
          </button>
        </div>
      </div>
    </div>
  )
}

const EQUIPMENT_OPTIONS: Equipment[] = ['ballOnly', 'cones', 'wall', 'partner', 'none']
const DIFFICULTY_OPTIONS: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5]
const CATEGORY_OPTIONS: SkillCategory[] = ['technical', 'physical', 'tactical', 'mental', 'knowledge']

function userDrillToExercise(drill: UserDrill): Exercise {
  return {
    id: drill.id,
    nameKey: drill.name,
    descriptionKey: drill.description,
    category: drill.category,
    subSkill: drill.category,
    difficulty: drill.difficulty,
    durationMinutes: drill.durationMinutes,
    equipment: drill.equipment,
    positions: [],
    methodology: 'coerver',
    videoUrl: drill.videoUrl,
    source: 'community',
  }
}

function SubmitDrillModal({
  onClose,
  onSubmit,
  t,
}: {
  onClose: () => void
  onSubmit: (drill: UserDrill) => void
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SkillCategory>('technical')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [durationMinutes, setDurationMinutes] = useState(10)
  const [equipment, setEquipment] = useState<Equipment[]>(['ballOnly'])
  const [videoUrl, setVideoUrl] = useState('')
  const [error, setError] = useState('')

  function toggleEquipment(eq: Equipment) {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    )
  }

  function handleSubmit() {
    if (!name.trim()) { setError(t('exercises.submitDrill.errorName')); return }
    if (!description.trim()) { setError(t('exercises.submitDrill.errorDesc')); return }
    if (equipment.length === 0) { setError(t('exercises.submitDrill.errorEquipment')); return }
    const drill: UserDrill = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      difficulty,
      durationMinutes,
      equipment,
      videoUrl: videoUrl.trim() || undefined,
      submittedAt: new Date().toISOString(),
    }
    onSubmit(drill)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('exercises.submitDrill.title')}>
      <div className="exercise-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose} aria-label={t('exercises.detail.close')}>×</button>

        <h3 className="exercise-modal-title">{t('exercises.submitDrill.title')}</h3>

        {error && (
          <p className="text-sm mb-3" style={{ color: 'var(--color-error, #ef4444)' }}>{error}</p>
        )}

        <div className="flex flex-col gap-3">
          {/* Name */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.name')} *
            </label>
            <input
              type="text"
              className="exercise-search w-full"
              style={{ paddingLeft: '12px' }}
              placeholder={t('exercises.submitDrill.namePlaceholder')}
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              maxLength={80}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.description')} *
            </label>
            <textarea
              className="exercise-search w-full"
              style={{ paddingLeft: '12px', minHeight: '80px', resize: 'vertical' }}
              placeholder={t('exercises.submitDrill.descriptionPlaceholder')}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError('') }}
              maxLength={400}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.category')}
            </label>
            <select
              className="exercise-sort w-full"
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory)}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{CAT_EMOJI[c]} {t(`skills.${c}`)}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.difficulty')}
            </label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="tap-target flex-1 rounded-lg text-sm font-bold py-2"
                  style={{
                    background: difficulty === d ? 'var(--color-primary)' : 'var(--color-bg-warm)',
                    color: difficulty === d ? '#fff' : 'var(--color-text-secondary)',
                  }}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.duration')}
            </label>
            <input
              type="number"
              className="exercise-search w-full"
              style={{ paddingLeft: '12px' }}
              value={durationMinutes}
              min={1}
              max={120}
              onChange={(e) => setDurationMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.equipment')} *
            </label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  className="rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: equipment.includes(eq) ? 'var(--color-primary)' : 'var(--color-bg-warm)',
                    color: equipment.includes(eq) ? '#fff' : 'var(--color-text-secondary)',
                  }}
                  onClick={() => { toggleEquipment(eq); setError('') }}
                >
                  {t(`equipment.${eq}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              {t('exercises.submitDrill.videoUrl')}
            </label>
            <input
              type="url"
              className="exercise-search w-full"
              style={{ paddingLeft: '12px' }}
              placeholder={t('exercises.submitDrill.videoPlaceholder')}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 tap-target text-sm font-bold py-3 rounded-full"
            style={{ background: 'var(--color-bg-warm)', color: 'var(--color-text-secondary)' }}
            onClick={onClose}
          >
            {t('exercises.submitDrill.cancel')}
          </button>
          <button
            className="flex-1 tap-target text-sm font-bold py-3 rounded-full"
            style={{ background: 'var(--color-primary)', color: '#fff' }}
            onClick={handleSubmit}
          >
            {t('exercises.submitDrill.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Exercises({ embedded }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const { xp, setXp, savedExercises, toggleSavedExercise, profile, userDrills, addUserDrill, deleteUserDrill } = useApp()
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined
  const [activeTab, setActiveTab] = useState<'exercises' | 'challenges'>('exercises')
  const [filter, setFilter] = useState<SkillCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const communityExercises = useMemo(() => userDrills.map(userDrillToExercise), [userDrills])

  const allExercises = useMemo(() => [...exercises, ...communityExercises], [communityExercises])

  const sortedFiltered = useMemo(() => {
    let list = filter === 'all' ? [...allExercises] : allExercises.filter((e) => e.category === filter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          t(e.nameKey).toLowerCase().includes(q) ||
          t(e.descriptionKey).toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return t(a.nameKey).localeCompare(t(b.nameKey))
      if (sortBy === 'difficulty') return a.difficulty - b.difficulty
      return a.durationMinutes - b.durationMinutes
    })

    return list
  }, [filter, search, sortBy, t, allExercises])

  function markDone(id: string) {
    setDoneIds((prev) => new Set(prev).add(id))
    const today = new Date().toISOString().split('T')[0]
    setXp(awardXp(xp, XP_AWARDS.completeExercise, today, ageTier))
  }

  return (
    <div className={embedded ? 'flex flex-col gap-4' : 'flex flex-col gap-4 p-4 pb-32'}>
      {/* Tab switcher: Exercises | Challenges — hidden when embedded in LearnPage */}
      {!embedded && (
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-glass-active, #f1f5f9)' }}>
        <button
          className="flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all"
          style={{
            background: activeTab === 'exercises' ? '#fff' : 'transparent',
            color: activeTab === 'exercises' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'exercises' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
          onClick={() => setActiveTab('exercises')}
        >
          ⚽ {t('exercises.title')}
        </button>
        <button
          className="flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all"
          style={{
            background: activeTab === 'challenges' ? '#fff' : 'transparent',
            color: activeTab === 'challenges' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'challenges' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
          onClick={() => setActiveTab('challenges')}
        >
          🏆 {t('challenges.title')}
        </button>
      </div>
      )}

      {(!embedded && activeTab === 'challenges') ? (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-3xl">🏆</span></div>}>
          <Challenges />
        </Suspense>
      ) : (
      <>

      {/* Search bar */}
      <div className="exercise-search-wrap">
        <span className="exercise-search-icon">🔍</span>
        <input
          type="text"
          className="exercise-search"
          placeholder={t('exercises.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('exercises.search')}
        />
        {search && (
          <button className="exercise-search-clear" onClick={() => setSearch('')} aria-label="Clear">×</button>
        )}
      </div>

      {/* Filter chips + sort */}
      <div className="flex items-center gap-2">
        <div className="filter-scroll flex-1">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              className="filter-chip"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
            >
              <span>{f.emoji}</span>
              <span>{t(f.labelKey)}</span>
            </button>
          ))}
        </div>
        <select
          className="exercise-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          aria-label={t('exercises.sortBy')}
        >
          <option value="name">{t('exercises.sort.name')}</option>
          <option value="difficulty">{t('exercises.sort.difficulty')}</option>
          <option value="duration">{t('exercises.sort.duration')}</option>
        </select>
      </div>

      {/* Submit a Drill button */}
      <button
        className="tap-target w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
        style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', border: '1.5px dashed var(--color-primary)' }}
        onClick={() => setShowSubmitModal(true)}
        aria-label={t('exercises.submitDrill.title')}
      >
        <span>➕</span>
        <span>{t('exercises.submitDrill.cta')}</span>
      </button>

      {/* Exercise cards */}
      <div className="exercise-grid">
        {sortedFiltered.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)', gridColumn: '1 / -1' }}>
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">{t('exercises.noResults')}</p>
          </div>
        )}
        {sortedFiltered.map((ex) => {
          const isDone = doneIds.has(ex.id)
          const thumbnail = ex.thumbnailUrl || (ex.videoUrl ? getThumbnailUrl(ex.videoUrl) : null)
          const isCommunity = ex.source === 'community'

          return (
            <div
              key={ex.id}
              className={`exercise-card ${CAT_STRIPE[ex.category] ?? ''}`}
              onClick={() => setDetailExercise(ex)}
            >
              {/* Thumbnail (if video) */}
              {thumbnail && (
                <div className="w-full h-24 rounded-lg overflow-hidden mb-3 relative" style={{ background: 'var(--color-bg-warm)' }}>
                  <img src={thumbnail} alt={t(ex.nameKey)} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xl drop-shadow-lg">▶</span>
                  </div>
                </div>
              )}

              {/* Category emoji badge (when no thumbnail) */}
              {!thumbnail && (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-lg"
                  style={{ background: 'var(--color-field-input)' }}>
                  {CAT_EMOJI[ex.category] ?? '⚽'}
                </div>
              )}

              {/* Community badge */}
              {isCommunity && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 inline-block"
                  style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                  🌐 {t('exercises.communityBadge')}
                </span>
              )}

              {/* Title */}
              <p className="text-base font-bold heading-display" style={{ color: 'var(--color-text)' }}>
                {t(ex.nameKey)}
              </p>

              {/* Description (truncated) */}
              <p className="text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t(ex.descriptionKey)}
              </p>

              {/* Metadata row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-data font-bold" style={{ background: 'var(--color-bg-warm)', color: 'var(--color-text-muted)' }}>
                  {ex.durationMinutes} min
                </span>
                <DifficultyDots level={ex.difficulty} />
                {/* Delete button for community drills */}
                {isCommunity && (
                  <button
                    className="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                    style={{ background: 'var(--color-bg-warm)', color: 'var(--color-text-muted)', border: 'none' }}
                    onClick={(e) => { e.stopPropagation(); deleteUserDrill(ex.id) }}
                    aria-label={t('exercises.submitDrill.delete')}
                  >
                    🗑
                  </button>
                )}
                {/* XP button */}
                <button
                  className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                  style={{
                    background: isDone ? 'var(--color-primary)' : 'var(--color-primary-bg)',
                    color: isDone ? '#fff' : 'var(--color-primary-dark)',
                    border: 'none',
                  }}
                  onClick={(e) => { e.stopPropagation(); if (!isDone) markDone(ex.id) }}
                  disabled={isDone}
                  aria-label={isDone ? t('exercises.done', { xp: XP_AWARDS.completeExercise }) : t('exercises.markDone')}
                >
                  {isDone ? '✓' : `+${XP_AWARDS.completeExercise}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail modal — portal to escape transform stacking context */}
      {detailExercise && createPortal(
        <ExerciseDetailModal
          exercise={detailExercise}
          isDone={doneIds.has(detailExercise.id)}
          isSaved={savedExercises.includes(detailExercise.id)}
          onClose={() => setDetailExercise(null)}
          onMarkDone={() => {
            markDone(detailExercise.id)
          }}
          onToggleSave={() => toggleSavedExercise(detailExercise.id)}
          t={t}
        />,
        document.body
      )}

      {/* Submit drill modal */}
      {showSubmitModal && createPortal(
        <SubmitDrillModal
          onClose={() => setShowSubmitModal(false)}
          onSubmit={addUserDrill}
          t={t}
        />,
        document.body
      )}
      </>
      )}
    </div>
  )
}