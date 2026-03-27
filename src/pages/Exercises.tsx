import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exercises } from '../data/exercises'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import type { SkillCategory } from '../engine/types'

const FILTER_OPTIONS: { key: SkillCategory | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'exercises.all' },
  { key: 'technical', labelKey: 'skills.technical' },
  { key: 'physical', labelKey: 'skills.physical' },
  { key: 'tactical', labelKey: 'skills.tactical' },
  { key: 'mental', labelKey: 'skills.mental' },
  { key: 'knowledge', labelKey: 'skills.knowledge' },
]

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
      <h2 className="text-lg font-bold">{t('exercises.title')}</h2>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.key}
            className="btn-choice tap-target text-xs px-3 py-2 whitespace-nowrap"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Exercise cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((ex) => {
          const isDone = doneIds.has(ex.id)
          return (
            <div key={ex.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t(ex.nameKey)}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {t(ex.descriptionKey)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-data" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>
                      {ex.durationMinutes} min
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-gold-400)' }}>
                      {'⭐'.repeat(ex.difficulty)}
                    </span>
                  </div>
                </div>
                <button
                  className="tap-target rounded-xl px-3 py-2 text-xs font-bold ml-3"
                  style={{
                    background: isDone ? 'linear-gradient(135deg, var(--color-green-600), var(--color-green-500))' : 'transparent',
                    color: isDone ? '#fff' : 'var(--color-green-400)',
                    border: isDone ? 'none' : '1px solid rgba(34,197,94,0.3)',
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
