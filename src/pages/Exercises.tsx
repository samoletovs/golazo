import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exercises } from '../data/exercises'
import { VideoPlayer } from '../components/VideoPlayer'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import type { SkillCategory } from '../engine/types'

const FILTER_OPTIONS: { key: SkillCategory | 'all'; labelKey: string; emoji: string }[] = [
  { key: 'all', labelKey: 'exercises.all', emoji: '🎯' },
  { key: 'technical', labelKey: 'skills.technical', emoji: '⚽' },
  { key: 'physical', labelKey: 'skills.physical', emoji: '💪' },
  { key: 'tactical', labelKey: 'skills.tactical', emoji: '🧠' },
  { key: 'mental', labelKey: 'skills.mental', emoji: '🧘' },
  { key: 'knowledge', labelKey: 'skills.knowledge', emoji: '📚' },
]

const CAT_CLASS: Record<string, string> = {
  technical: 'cat-technical',
  physical: 'cat-physical',
  tactical: 'cat-tactical',
  mental: 'cat-mental',
  knowledge: 'cat-knowledge',
  matchPlay: 'cat-matchPlay',
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

export function Exercises() {
  const { t } = useTranslation()
  const { xp, setXp } = useApp()
  const [filter, setFilter] = useState<SkillCategory | 'all'>('all')
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter === 'all' ? exercises : exercises.filter((e) => e.category === filter)

  function markDone(id: string) {
    setDoneIds((prev) => new Set(prev).add(id))
    const today = new Date().toISOString().split('T')[0]
    setXp(awardXp(xp, XP_AWARDS.completeExercise, today))
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('exercises.title')}</h2>

      {/* Filter chips */}
      <div className="filter-scroll">
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

      {/* Exercise cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((ex) => {
          const isDone = doneIds.has(ex.id)
          const isExpanded = expandedId === ex.id
          const thumbnail = ex.thumbnailUrl || (ex.videoUrl ? getThumbnailUrl(ex.videoUrl) : null)

          return (
            <div
              key={ex.id}
              className={`card ${CAT_CLASS[ex.category] ?? ''}`}
              style={{ cursor: ex.videoUrl ? 'pointer' : undefined }}
              onClick={() => ex.videoUrl && setExpandedId(isExpanded ? null : ex.id)}
            >
              {/* Thumbnail + info row */}
              <div className="flex gap-3 items-start">
                {thumbnail && (
                  <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: '#f3f4f6' }}>
                    <img src={thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-lg drop-shadow-lg">▶</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {t(ex.nameKey)}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {t(ex.descriptionKey)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-data" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                      {ex.durationMinutes} min
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
                      {'⭐'.repeat(ex.difficulty)}
                    </span>
                    {ex.equipment.filter(e => e !== 'none').length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                        {ex.equipment.filter(e => e !== 'none').map(e => t(`equipment.${e}`)).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="tap-target rounded-xl px-3 py-1.5 text-xs font-bold ml-1 shrink-0 whitespace-nowrap"
                  style={{
                    background: isDone ? '#16a34a' : '#dcfce7',
                    color: isDone ? '#fff' : '#15803d',
                    border: 'none',
                  }}
                  onClick={(e) => { e.stopPropagation(); if (!isDone) markDone(ex.id) }}
                  disabled={isDone}
                  aria-label={isDone ? t('exercises.done', { xp: XP_AWARDS.completeExercise }) : t('exercises.markDone')}
                >
                  {isDone ? '✓' : `+${XP_AWARDS.completeExercise}`}
                </button>
              </div>

              {/* Expanded video player */}
              {isExpanded && ex.videoUrl && (
                <div className="mt-3 animate-fade-up" onClick={(e) => e.stopPropagation()}>
                  <VideoPlayer videoUrl={ex.videoUrl} title={t(ex.nameKey)} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
