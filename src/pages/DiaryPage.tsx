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

const GUIDED_PROMPTS = [
  { key: 'whatWentWell', emoji: '✅', labelKey: 'diary.guided.whatWentWell', defaultLabel: 'What went well today?' },
  { key: 'whatWasHard', emoji: '😤', labelKey: 'diary.guided.whatWasHard', defaultLabel: 'What was hard?' },
  { key: 'oneThing', emoji: '💡', labelKey: 'diary.guided.oneThing', defaultLabel: 'One thing I learned' },
  { key: 'grateful', emoji: '🙏', labelKey: 'diary.guided.grateful', defaultLabel: 'What am I grateful for?' },
]

const MOOD_CONTEXTS = [
  { key: 'training', emoji: '⚽', labelKey: 'diary.context.training', defaultLabel: 'Training' },
  { key: 'match', emoji: '🏟️', labelKey: 'diary.context.match', defaultLabel: 'Match' },
  { key: 'school', emoji: '📚', labelKey: 'diary.context.school', defaultLabel: 'School' },
  { key: 'friends', emoji: '👥', labelKey: 'diary.context.friends', defaultLabel: 'Friends' },
  { key: 'family', emoji: '👨‍👩‍👦', labelKey: 'diary.context.family', defaultLabel: 'Family' },
]

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😄', '🔥']

export interface DiaryPageProps {
  onBack?: () => void
  inline?: boolean
  onSaved?: () => void
}

export function DiaryPage({ onBack, inline, onSaved }: DiaryPageProps) {
  const { t } = useTranslation()
  const { xp, setXp, addDiary } = useApp()
  const [saved, setSaved] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [text, setText] = useState('')
  const [mood, setMood] = useState<EnergyLevel>(3)
  const [usedPrompts, setUsedPrompts] = useState<string[]>([])
  const [moodContext, setMoodContext] = useState<string | null>(null)
  const [aiConsent, setAiConsent] = useState(true)
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
    onSaved?.()
    if (!inline) setTimeout(() => setSaved(false), 3000)
  }

  if (saved && !inline) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 pb-32 animate-fade-up">
        <span className="text-5xl animate-float">📝</span>
        <p className="text-lg font-bold" style={{ color: 'var(--color-primary-dark)' }}>
          {t('diary.saved', { xp: 15 })}
        </p>
      </div>
    )
  }

  if (saved && inline) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-primary-bg-subtle)' }}>
        <span className="text-xl">✅</span>
        <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>
          {t('diary.saved', { xp: 15 })}
        </p>
      </div>
    )
  }

  return (
    <div className={inline ? 'flex flex-col gap-4' : 'flex flex-col gap-4 p-4 pb-32'}>
      {!inline && (
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
          )}
          <h2 className="text-lg font-bold">{t('diary.title')}</h2>
        </div>
      )}

      {!inline && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {t('diary.private')}
        </p>
      )}

      {/* Guided prompts (new structured questions) */}
      <div>
        <p className="section-label mb-2">{t('diary.guidedTitle', { defaultValue: 'Guided reflection' })}</p>
        <div className="flex flex-col gap-2">
          {GUIDED_PROMPTS.map((gp) => (
            <button
              key={gp.key}
              className="btn-choice tap-target text-sm text-left flex items-center gap-2"
              onClick={() => {
                const label = t(gp.labelKey, { defaultValue: gp.defaultLabel })
                setText((prev) => prev + (prev ? '\n\n' : '') + `${gp.emoji} ${label}\n`)
                setUsedPrompts((prev) => [...new Set([...prev, gp.key])])
              }}
              aria-pressed={usedPrompts.includes(gp.key)}
            >
              <span>{gp.emoji}</span>
              <span>{t(gp.labelKey, { defaultValue: gp.defaultLabel })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mental model prompt shortcuts */}
      <div>
        <p className="section-label mb-2">{t('diary.promptTitle', { defaultValue: '4C Framework' })}</p>
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

      {/* Mood context */}
      <div>
        <p className="section-label mb-2">{t('diary.moodContext', { defaultValue: 'What is this about?' })}</p>
        <div className="flex flex-wrap gap-2">
          {MOOD_CONTEXTS.map((ctx) => (
            <button
              key={ctx.key}
              className="btn-choice tap-target text-xs px-3 py-2"
              onClick={() => setMoodContext(moodContext === ctx.key ? null : ctx.key)}
              aria-pressed={moodContext === ctx.key}
            >
              {ctx.emoji} {t(ctx.labelKey, { defaultValue: ctx.defaultLabel })}
            </button>
          ))}
        </div>
      </div>

      {/* AI consent toggle */}
      <div className="flex items-center gap-3 px-1">
        <button
          className="tap-target w-10 h-6 rounded-full transition-colors relative"
          style={{ background: aiConsent ? 'var(--color-primary)' : '#d1d5db' }}
          onClick={() => setAiConsent(!aiConsent)}
          aria-label="AI consent"
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{ left: aiConsent ? 18 : 2 }}
          />
        </button>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {t('diary.aiConsent', { defaultValue: 'Let AI Coach read this entry for better advice' })}
        </p>
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
