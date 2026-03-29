import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import type { DiaryEntry, EnergyLevel } from '../engine/types'

const PROMPTS = [
  'diary.prompt.commitment',
  'diary.prompt.concentration',
  'diary.prompt.confidence',
  'diary.prompt.control',
  'diary.prompt.growth',
  'diary.prompt.modric',
]

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😄', '🔥']

export function DiaryPage({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()
  const { xp, setXp, addDiary } = useApp()
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [text, setText] = useState('')
  const [mood, setMood] = useState<EnergyLevel>(3)
  const [usedPrompts, setUsedPrompts] = useState<string[]>([])

  function togglePrompt(p: string) {
    setUsedPrompts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
    setText((prev) => prev + (prev ? '\n\n' : '') + t(p))
  }

  function handleSave() {
    if (!text.trim()) return
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      playerId: 'default',
      date: today,
      text,
      mood,
      promptsUsed: usedPrompts,
      linkedTrainingIds: [],
      linkedMatchIds: [],
      createdAt: new Date().toISOString(),
    }
    addDiary(entry)
    setXp(awardXp(xp, XP_AWARDS.diaryEntry, today))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 pb-32 animate-fade-up">
        <span className="text-5xl animate-float">📝</span>
        <p className="text-lg font-bold" style={{ color: 'var(--color-primary-dark)' }}>
          {t('diary.saved', { xp: 15 })}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        )}
        <h2 className="text-lg font-bold">{t('diary.title')}</h2>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {t('diary.private')}
      </p>

      {/* Prompt shortcuts */}
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            className="btn-choice tap-target text-xs px-3 py-2"
            onClick={() => togglePrompt(p)}
            aria-pressed={usedPrompts.includes(p)}
          >
            {t(p)}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        className="w-full rounded-xl p-3 text-sm"
        style={{ resize: 'none', minHeight: '160px' }}
        placeholder={t('diary.write')}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Mood */}
      <div>
        <p className="section-label mb-2">{t('training.mood')}</p>
        <div className="flex gap-2 justify-center">
          {MOOD_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              className="emoji-btn"
              data-selected={mood === (i + 1)}
              onClick={() => setMood((i + 1) as EnergyLevel)}
              aria-label={`Mood ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        disabled={!text.trim()}
        aria-label={t('diary.save')}
      >
        {t('diary.save')} (+15 XP)
      </button>
    </div>
  )
}
