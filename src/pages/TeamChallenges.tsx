import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeamChallenge } from '../engine/types'

interface TeamChallengesProps {
  teamId: string
  teamName: string
  onBack: () => void
}

type RequestAction = 'accept' | 'decline' | 'progress'

function isOpponent(challenge: TeamChallenge, teamId: string) {
  return challenge.opponentTeamId === teamId
}

export function TeamChallenges({ teamId, teamName, onBack }: TeamChallengesProps) {
  const { t } = useTranslation()
  const [challenges, setChallenges] = useState<TeamChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [opponentTeamId, setOpponentTeamId] = useState('')
  const [opponentTeamName, setOpponentTeamName] = useState('')
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState(3)
  const [days, setDays] = useState(7)

  async function loadChallenges() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/social-challenges`)
      if (!response.ok) throw new Error('Failed to load challenges')
      const data: { challenges?: TeamChallenge[] } = await response.json()
      setChallenges(data.challenges ?? [])
    } catch {
      setError(t('teamChallenges.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadChallenges()
  }, [teamId])

  async function createChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/social-challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponentTeamId, opponentTeamName, title, target, days }),
      })
      if (!response.ok) throw new Error('Failed to create challenge')
      setShowForm(false)
      setOpponentTeamId('')
      setOpponentTeamName('')
      setTitle('')
      await loadChallenges()
    } catch {
      setError(t('teamChallenges.createError'))
    }
  }

  async function updateChallenge(challengeId: string, action: RequestAction) {
    setError('')
    try {
      const response = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/social-challenges/${encodeURIComponent(challengeId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) throw new Error('Failed to update challenge')
      await loadChallenges()
    } catch {
      setError(t('teamChallenges.updateError'))
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        <button className="tap-target text-sm font-bold" onClick={onBack} aria-label={t('common.back')}>
          ← {t('common.back')}
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold heading-display truncate">🏆 {t('teamChallenges.title')}</h2>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{teamName}</p>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--color-primary-bg)' }}>
        <p className="text-sm font-bold">{t('teamChallenges.howItWorksTitle')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('teamChallenges.howItWorks')}</p>
        <p className="text-xs font-bold mt-3" style={{ color: 'var(--color-text-secondary)' }}>{t('teamChallenges.yourCode')}</p>
        <p className="text-xs font-data break-all" style={{ color: 'var(--color-primary-dark)' }}>{teamId}</p>
      </div>

      {error && <p className="text-sm font-bold" role="alert" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <button className="btn-primary tap-target w-full" onClick={() => setShowForm((value) => !value)}>
        {showForm ? t('common.cancel') : t('teamChallenges.create')}
      </button>

      {showForm && (
        <form className="card flex flex-col gap-3" onSubmit={createChallenge}>
          <label className="text-xs font-bold">
            {t('teamChallenges.challengeTitle')}
            <input className="input w-full mt-1" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required />
          </label>
          <label className="text-xs font-bold">
            {t('teamChallenges.opponentName')}
            <input className="input w-full mt-1" value={opponentTeamName} onChange={(event) => setOpponentTeamName(event.target.value)} maxLength={80} required />
          </label>
          <label className="text-xs font-bold">
            {t('teamChallenges.opponentCode')}
            <input className="input w-full mt-1" value={opponentTeamId} onChange={(event) => setOpponentTeamId(event.target.value)} maxLength={100} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold">
              {t('teamChallenges.target')}
              <input className="input w-full mt-1" type="number" min="1" max="50" value={target} onChange={(event) => setTarget(Number(event.target.value))} required />
            </label>
            <label className="text-xs font-bold">
              {t('teamChallenges.days')}
              <input className="input w-full mt-1" type="number" min="1" max="31" value={days} onChange={(event) => setDays(Number(event.target.value))} required />
            </label>
          </div>
          <button className="btn-primary tap-target w-full" type="submit">{t('teamChallenges.send')}</button>
        </form>
      )}

      <p className="section-label">{t('teamChallenges.active')}</p>
      {loading && <div className="skeleton" style={{ height: 120 }} />}
      {!loading && challenges.length === 0 && (
        <div className="card text-center py-7">
          <p className="text-sm font-bold">{t('teamChallenges.empty')}</p>
        </div>
      )}
      {!loading && challenges.map((challenge) => {
        const opponent = isOpponent(challenge, teamId)
        const ownProgress = opponent ? challenge.opponentProgress : challenge.teamProgress
        const otherProgress = opponent ? challenge.teamProgress : challenge.opponentProgress
        const otherName = opponent ? challenge.teamName : challenge.opponentTeamName
        const progress = Math.min((ownProgress / challenge.target) * 100, 100)

        return (
          <div key={challenge.id} className="card flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{challenge.title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('teamChallenges.vs', { team: otherName })}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--color-glass-hover)' }}>
                {t(`teamChallenges.status.${challenge.status}`)}
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{teamName}: {ownProgress}/{challenge.target}</span>
                <span>{otherName}: {otherProgress}/{challenge.target}</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
            {challenge.status === 'pending' && opponent && (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-primary tap-target" onClick={() => void updateChallenge(challenge.id, 'accept')}>{t('teamChallenges.accept')}</button>
                <button className="tap-target rounded-xl font-bold" style={{ background: 'var(--color-glass-hover)' }} onClick={() => void updateChallenge(challenge.id, 'decline')}>{t('teamChallenges.decline')}</button>
              </div>
            )}
            {challenge.status === 'active' && (
              <button className="btn-primary tap-target w-full" onClick={() => void updateChallenge(challenge.id, 'progress')}>
                {t('teamChallenges.logSession')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
