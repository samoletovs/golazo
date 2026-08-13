import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SocialChallenge } from '../engine/types'
import {
  SOCIAL_CHALLENGE_CODE_LENGTH,
  SOCIAL_CHALLENGE_LIMITS,
  challengeProgressPercent,
  findParticipant,
  getChallengeStatus,
  isValidJoinCode,
  normalizeJoinCode,
  rankParticipants,
} from '../engine/socialChallenges'

interface SocialChallengesProps {
  userId: string
  name: string
}

export function SocialChallenges({ userId, name }: SocialChallengesProps) {
  const { t } = useTranslation()
  const [challenges, setChallenges] = useState<SocialChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState(5)
  const [days, setDays] = useState(7)
  const [joinCode, setJoinCode] = useState('')

  const loadChallenges = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/social-challenges')
      if (!response.ok) throw new Error('Failed to load challenges')
      const data: { challenges?: SocialChallenge[] } = await response.json()
      setChallenges(data.challenges ?? [])
    } catch {
      setError(t('socialChallenges.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadChallenges()
  }, [loadChallenges])

  async function createChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/social-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, target, days, name }),
      })
      if (!response.ok) throw new Error('Failed to create challenge')
      setShowForm(false)
      setTitle('')
      await loadChallenges()
    } catch {
      setError(t('socialChallenges.createError'))
    }
  }

  async function joinChallenge() {
    if (!isValidJoinCode(joinCode)) return
    setError('')
    try {
      const response = await fetch('/api/social-challenges/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizeJoinCode(joinCode), name }),
      })
      if (!response.ok) throw new Error('Failed to join challenge')
      setJoinCode('')
      await loadChallenges()
    } catch {
      setError(t('socialChallenges.joinError'))
    }
  }

  async function logProgress(challengeId: string) {
    setError('')
    try {
      const response = await fetch(`/api/social-challenges/${encodeURIComponent(challengeId)}/progress`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to log progress')
      await loadChallenges()
    } catch {
      setError(t('socialChallenges.updateError'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold">🤝 {t('socialChallenges.title')}</h2>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('socialChallenges.howItWorks')}</p>

      {error && <p className="text-xs font-bold" role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <button
        className="btn-primary tap-target w-full text-sm"
        onClick={() => setShowForm((value) => !value)}
        aria-label={t('socialChallenges.create')}
      >
        {showForm ? t('common.cancel') : t('socialChallenges.create')}
      </button>

      {showForm && (
        <form className="flex flex-col gap-3" onSubmit={createChallenge}>
          <label className="text-xs font-bold">
            {t('socialChallenges.challengeTitle')}
            <input
              className="input w-full mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={SOCIAL_CHALLENGE_LIMITS.titleMaxLength}
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold">
              {t('socialChallenges.target')}
              <input
                className="input w-full mt-1"
                type="number"
                min={SOCIAL_CHALLENGE_LIMITS.minTarget}
                max={SOCIAL_CHALLENGE_LIMITS.maxTarget}
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
                required
              />
            </label>
            <label className="text-xs font-bold">
              {t('socialChallenges.days')}
              <input
                className="input w-full mt-1"
                type="number"
                min={SOCIAL_CHALLENGE_LIMITS.minDays}
                max={SOCIAL_CHALLENGE_LIMITS.maxDays}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                required
              />
            </label>
          </div>
          <button className="btn-primary tap-target w-full text-sm" type="submit">
            {t('socialChallenges.send')}
          </button>
        </form>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          maxLength={SOCIAL_CHALLENGE_CODE_LENGTH + 4}
          value={joinCode}
          onChange={(event) => setJoinCode(normalizeJoinCode(event.target.value))}
          placeholder="ABC123"
          className="flex-1 text-center font-data text-lg tracking-widest uppercase"
          aria-label={t('socialChallenges.enterCode')}
        />
        <button
          className="btn-primary text-sm py-2 px-4"
          onClick={joinChallenge}
          disabled={!isValidJoinCode(joinCode)}
          aria-label={t('socialChallenges.join')}
        >
          {t('socialChallenges.join')}
        </button>
      </div>

      {loading && <div className="skeleton" style={{ height: 96 }} />}
      {!loading && challenges.length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
          {t('socialChallenges.empty')}
        </p>
      )}

      {!loading && challenges.map((challenge) => {
        const status = getChallengeStatus(challenge)
        const me = findParticipant(challenge, userId)
        return (
          <div key={challenge.id} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'var(--color-glass-hover)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{challenge.title}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('socialChallenges.code', { code: challenge.code })}
                </p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--color-surface)' }}>
                {t(`socialChallenges.status.${status}`)}
              </span>
            </div>

            {rankParticipants(challenge).map((participant) => (
              <div key={participant.userId}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{participant.name}{participant.userId === userId && ` ${t('socialChallenges.you')}`}</span>
                  <span>{participant.progress}/{challenge.target}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${challengeProgressPercent(participant.progress, challenge.target)}%` }} />
                </div>
              </div>
            ))}

            {status === 'active' && me && (
              <button
                className="btn-primary tap-target w-full text-sm"
                onClick={() => void logProgress(challenge.id)}
                aria-label={t('socialChallenges.logSession')}
              >
                {t('socialChallenges.logSession')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
