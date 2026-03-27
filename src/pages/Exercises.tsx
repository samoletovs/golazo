import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exercises } from '../data/exercises'
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

export function Exercises() {
  const { t } = useTranslation()
  const { xp, setXp } = useApp()
  const [filter, setFilter] = useState<SkillCategory | 'all'>('all')
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

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
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            className="btn-choice tap-target text-xs px-3 py-2 whitespace-nowrap flex items-center gap-1.5"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
          >
            <span>{f.emoji}</span>
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Exercise cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((ex) => {
          const isDone = doneIds.has(ex.id)
          return (
            <div key={ex.id} className={`card ${CAT_CLASS[ex.category] ?? ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
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
                  </div>
                </div>
                <button
                  className="tap-target rounded-xl px-4 py-2 text-xs font-bold ml-3"
                  style={{
                    background: isDone ? '#16a34a' : '#dcfce7',
                    color: isDone ? '#fff' : '#15803d',
                    border: 'none',
                  }}
                  onClick={() => !isDone && markDone(ex.id)}
                  disabled={isDone}
                  aria-label={isDone ? t('exercises.done', { xp: XP_AWARDS.completeExercise }) : t('exercises.markDone')}
                >
                  {isDone ? '✓' : t('exercises.markDone')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
