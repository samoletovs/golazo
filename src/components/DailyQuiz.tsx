import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { getQuizOfTheDay } from '../data/quizzes'
import { getAgeTier } from '../engine/types'
import type { QuizAnswer, QuizDifficulty } from '../engine/types'

/** Map age tier to quiz difficulty */
function tierToDifficulty(tier: string): QuizDifficulty {
  if (tier === 'u8') return 'u10'
  if (tier === 'u12') return 'u12'
  if (tier === 'u16') return 'u16'
  return 'u16'
}

interface DailyQuizProps {
  onComplete?: (correct: boolean) => void
  compact?: boolean
}

export function DailyQuiz({ onComplete, compact }: DailyQuizProps) {
  const { t } = useTranslation()
  const { xp, setXp, quizAnswers, addQuizAnswer, profile } = useApp()

  const today = new Date().toISOString().slice(0, 10)
  const alreadyAnswered = quizAnswers.some((q) => q.date === today)

  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const difficulty = tierToDifficulty(ageTier)
  const question = getQuizOfTheDay(today, difficulty)

  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(alreadyAnswered)

  function handleAnswer(index: number) {
    if (revealed) return
    setSelected(index)
    setRevealed(true)

    const correct = index === question.correctIndex
    const answer: QuizAnswer = {
      questionId: question.id,
      date: today,
      correct,
      category: question.category,
      answeredAt: new Date().toISOString(),
    }
    addQuizAnswer(answer)

    if (correct) {
      setXp(awardXp(xp, XP_AWARDS.quizCorrect, today, ageTier))
    }

    // Auto-advance after a delay
    setTimeout(() => {
      onComplete?.(correct)
    }, 1500)
  }

  if (alreadyAnswered && !compact) {
    const todayAnswer = quizAnswers.find((q) => q.date === today)
    return (
      <div className="card flex items-center gap-3 animate-fade-up">
        <span className="text-xl">{todayAnswer?.correct ? '✅' : '❌'}</span>
        <p className="text-sm font-bold" style={{ color: todayAnswer?.correct ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
          {todayAnswer?.correct
            ? t('quiz.alreadyCorrect')
            : t('quiz.alreadyWrong')}
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'flex flex-col gap-3' : 'card flex flex-col gap-3 animate-fade-up'}>
      {!compact && (
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <p className="section-label">{t('quiz.title')}</p>
        </div>
      )}

      <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        {question.questionKey}
      </p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          let style: React.CSSProperties = {}
          let className = 'btn-choice tap-target text-sm text-left'

          if (revealed) {
            if (i === question.correctIndex) {
              style = { background: 'var(--color-primary-bg)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-dark)' }
              className += ' correct-answer'
            } else if (i === selected) {
              style = { background: '#FEE2E2', borderColor: '#EF4444', color: '#DC2626' }
              className += ' wrong-answer'
            }
          }

          return (
            <button
              key={i}
              className={className}
              style={style}
              onClick={() => handleAnswer(i)}
              disabled={revealed}
            >
              {option}
            </button>
          )
        })}
      </div>

      {revealed && selected !== null && (
        <div className="flex items-center gap-2 animate-fade-up">
          <span className="text-lg">{selected === question.correctIndex ? '🎉' : '💪'}</span>
          <p className="text-xs font-bold" style={{ color: selected === question.correctIndex ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)' }}>
            {selected === question.correctIndex
              ? t('quiz.correct')
              : t('quiz.wrong')}
          </p>
        </div>
      )}
    </div>
  )
}
