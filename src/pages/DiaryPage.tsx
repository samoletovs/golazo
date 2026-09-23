import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { XP_AWARDS, scaleXp } from '../engine/xp'
import { useToast } from '../contexts/ToastContext'
import { AcademyPage } from '../components/academy/AcademyPage'
import { AcademySaved } from '../components/academy/AcademySaved'
import type { ActivityReceipt } from '../engine/activitySave'
import { getAgeTier } from '../engine/types'
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
  const { saveDiary, profile } = useApp()
  const { showToast, dismissToast } = useToast()
  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : undefined
  const scaledDiaryXp = scaleXp(XP_AWARDS.diaryEntry, ageTier)
  const [receipt, setReceipt] = useState<ActivityReceipt | null>(null)
  const [failed, setFailed] = useState(false)
  const [draftId] = useState(() => crypto.randomUUID())
  const [createdAt] = useState(() => new Date().toISOString())
  const saving = useRef(false)
  const errorToast = useRef<number | null>(null)
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
    if (saving.current || receipt) return
    if (!text.trim()) {
      showToast(t('diary.placeholder'), 'error')
      return
    }
    saving.current = true
    const entry: DiaryEntry = {
      id: draftId,
      playerId: profile?.id ?? 'default',
      date: today,
      text,
      mood,
      promptsUsed: usedPrompts,
      linkedTrainingIds: [],
      linkedMatchIds: [],
      moodContext: moodContext ?? undefined,
      aiConsent,
      createdAt,
    }
    try {
      const saved = saveDiary(entry)
      setFailed(false)
      if (errorToast.current !== null) dismissToast(errorToast.current)
      setReceipt(saved)
    } catch (cause) {
      console.error('Reflection could not be saved on this device:', cause)
      setFailed(true)
      if (errorToast.current !== null) dismissToast(errorToast.current)
      errorToast.current = showToast(t('academy.saveError'), 'error')
      saving.current = false
      return
    }
    onSaved?.()
  }

  if (receipt) return <AcademySaved receipt={receipt} title={t('diary.title')} onDone={onBack} />

  return (
    <AcademyPage surface="reflection-log" title={t('diary.title')} subtitle={t('diary.private')} onBack={!inline ? onBack : undefined} backLabel={t('common.back')} className="academy-entry-form">
      {failed && <p role="alert" className="academy-error">{t('academy.saveError')}</p>}

      {!inline && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {t('diary.private')}
        </p>
      )}

      {/* Guided prompts (new structured questions) */}
      <div>
        <p className="section-label mb-2">{t('diary.guidedTitle')}</p>
        <div className="flex flex-col gap-2">
          {GUIDED_PROMPTS.map((gp) => (
            <button
              key={gp.key}
              className="btn-choice tap-target text-sm text-left flex items-center gap-2"
              onClick={() => {
                const label = t(gp.labelKey)
                setText((prev) => prev + (prev ? '\n\n' : '') + `${gp.emoji} ${label}\n`)
                setUsedPrompts((prev) => [...new Set([...prev, gp.key])])
              }}
              aria-pressed={usedPrompts.includes(gp.key)}
            >
              <span>{gp.emoji}</span>
              <span>{t(gp.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mental model prompt shortcuts */}
      <div>
        <p className="section-label mb-2">{t('diary.promptTitle')}</p>
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
        <p className="section-label mb-2">{t('diary.moodContext')}</p>
        <div className="flex flex-wrap gap-2">
          {MOOD_CONTEXTS.map((ctx) => (
            <button
              key={ctx.key}
              className="btn-choice tap-target text-xs px-3 py-2"
              onClick={() => setMoodContext(moodContext === ctx.key ? null : ctx.key)}
              aria-pressed={moodContext === ctx.key}
            >
              {ctx.emoji} {t(ctx.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* AI consent toggle */}
      <label className="flex items-center gap-3 min-h-12"><input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)} /><span>{t('diary.aiConsent')}</span></label>

      <button
        className="btn-primary tap-target w-full"
        onClick={handleSave}
        disabled={!text.trim()}
        aria-label={t('diary.save')}
      >
        {t(failed ? 'training.retry' : 'diary.save')} (+{scaledDiaryXp} XP)
      </button>
      <p className="academy-hint">{t('training.localHint')}</p>
    </AcademyPage>
  )
}
