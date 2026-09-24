import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { useToast } from '../../contexts/ToastContext'
import { getAgeTier } from '../../engine/types'
import { awardXp, scaleXp } from '../../engine/xp'
import { ageTierToChallengeDifficulty, getChallengeOfDay, getChallengeReasonKey, getDailyChallengeCompletionKey } from '../../engine/challenges'
import { MorningRoutine } from '../MorningRoutine'
import { DailyQuiz } from '../DailyQuiz'
import { AcademyPanel } from './AcademyPage'
import { dayKey } from './AcademyWeekboard'

function completedIds(key: string): string[] {
  const stored: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
  if (!Array.isArray(stored) || !stored.every(item => typeof item === 'string')) throw new Error('Invalid challenge completion data')
  return stored
}

export function AcademyDailyPractice({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const { profile, skillTree, setXp, checkIns, quizAnswers } = useApp()
  const { showToast } = useToast()
  const [showRoutine, setShowRoutine] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const today = dayKey(new Date())
  const tier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const storageKey = getDailyChallengeCompletionKey(today)
  const challenge = getChallengeOfDay(profile?.id || 'anonymous', today, ageTierToChallengeDifficulty(tier), profile?.positions ?? [], skillTree)
  let stored: string[] = []
  let readError = false
  try { stored = completedIds(storageKey) }
  catch (cause) { console.error('Challenge completions could not be read:', cause); readError = true }
  const done = !challenge || [...stored, ...completed].includes(challenge.templateId)
  const routineDone = checkIns.some(item => item.date === today) && quizAnswers.some(item => item.date === today) && done
  function complete() {
    if (!challenge) return
    try {
      const previous = completedIds(storageKey)
      if (previous.includes(challenge.templateId)) return
      const next = [...previous, challenge.templateId]
      localStorage.setItem(storageKey, JSON.stringify(next))
      try { setXp(current => awardXp(current, challenge.xpReward, today, tier)) }
      catch (cause) { localStorage.setItem(storageKey, JSON.stringify(previous)); throw cause }
      setCompleted(next)
    } catch (cause) {
      console.error('Challenge completion could not be saved:', cause)
      showToast(t('academy.preferenceError'), 'error')
    }
  }
  return <div className="academy-daily-grid">
    <AcademyPanel title={t('routine.cta')}>
      <p className="academy-muted mb-4">{routineDone ? t('checkin.done') : t('routine.ctaSub')}</p>
      {!routineDone && <button className="academy-button secondary" onClick={() => setShowRoutine(true)}>{t('routine.go')}</button>}
    </AcademyPanel>
    {challenge && <AcademyPanel title={t('dashboard.challengeOfDay')}>
      <div className="academy-stack">
        <h3>{t(challenge.textKey)}</h3><p>{t(challenge.descKey)}</p>
        <p className="academy-muted">{challenge.target} {challenge.unit} · {challenge.estimateMin} {t('learn.minutes')}</p>
        <p className="academy-muted">{t(getChallengeReasonKey(challenge.reason), { category: t(`learn.cat.${challenge.category}`) })}</p>
        {readError && <p role="alert" className="academy-error">{t('academy.preferenceError')}</p>}
        {done ? <p className="academy-complete-label">{t('challenges.done')}</p>
          : <button className="academy-button" onClick={complete} disabled={readError}>{t('challenges.markDone')} (+{scaleXp(challenge.xpReward, tier)} XP)</button>}
        <button className="academy-link" onClick={() => onNavigate?.('challenges')}>{t('nav.challenges')} <span aria-hidden="true">→</span></button>
      </div>
    </AcademyPanel>}
    <DailyQuiz />
    {showRoutine && <MorningRoutine onClose={() => { setShowRoutine(false); setCompleted([]) }} />}
  </div>
}
