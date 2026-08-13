import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { getRank } from '../engine/xp'
import { SocialChallenges } from '../components/SocialChallenges'

interface LeaderboardEntry {
  userId: string
  name: string
  level: number
  totalXp: number
  streakDays: number
}

export function LeaderboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { xp, profile } = useApp()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) fetchLeaderboard()
  }, [user])

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      const res = await fetch('/api/leaderboard')
      if (res.ok) {
        setEntries(await res.json())
      }
    } catch { /* offline — show local only */ } finally {
      setLoading(false)
    }
  }

  async function createInvite() {
    try {
      const res = await fetch('/api/invite', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setInviteCode(data.code)
      }
    } catch {
      setMessage(t('leaderboard.offlineError'))
    }
  }

  async function acceptInvite() {
    if (!joinCode || joinCode.length !== 6) return
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.toUpperCase() }),
      })
      if (res.ok) {
        setMessage(t('leaderboard.linked'))
        setJoinCode('')
        fetchLeaderboard()
      } else {
        const err = await res.json()
        setMessage(err.error || t('leaderboard.invalidCode'))
      }
    } catch {
      setMessage(t('leaderboard.offlineError'))
    }
  }

  // Show local-only leaderboard entry when offline
  const localEntry: LeaderboardEntry = {
    userId: user?.userId ?? 'local',
    name: profile?.name ?? t('profile.title'),
    level: xp.level,
    totalXp: xp.totalXp,
    streakDays: xp.streakDays,
  }

  const displayEntries = entries.length > 0 ? entries : [localEntry]

  return (
    <div className="flex flex-col gap-5 p-4 pb-32">
      <h1 className="text-xl font-extrabold">{t('leaderboard.title')}</h1>

      {/* ── Leaderboard Table ── */}
      <div className="card animate-fade-up">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayEntries.map((entry, i) => {
              const rank = getRank(entry.level)
              const isMe = entry.userId === (user?.userId ?? 'local')
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 rounded-lg ${isMe ? 'bg-green-50 border border-green-200' : ''}`}
                >
                  <span className="text-lg font-black font-data w-8 text-center" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--color-text-muted)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{entry.name} {isMe && '(you)'}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t(rank.key)} · Lv.{entry.level} · {entry.streakDays}🔥
                    </p>
                  </div>
                  <span className="stat-pill stat-pill-gold text-sm font-bold">
                    {entry.totalXp.toLocaleString()} XP
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Invite Section ── */}
      {user && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('leaderboard.inviteFriends')}</h2>

          {inviteCode ? (
            <div className="flex flex-col gap-2 items-center">
              <p className="text-3xl font-black font-data tracking-widest">{inviteCode}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('leaderboard.shareCode')}
              </p>
              <button
                className="btn-choice text-sm"
                onClick={() => navigator.clipboard?.writeText(inviteCode)}
                aria-label={t('leaderboard.copy')}
              >
                📋 {t('leaderboard.copy')}
              </button>
            </div>
          ) : (
            <button className="btn-primary w-full text-sm" onClick={createInvite} aria-label={t('leaderboard.generateCode')}>
              {t('leaderboard.generateCode')}
            </button>
          )}
        </div>
      )}

      {/* ── Social Challenges ── */}
      {user && (
        <div className="card animate-fade-up">
          <SocialChallenges userId={user.userId} name={localEntry.name} />
        </div>
      )}

      {/* ── Join with Code ── */}
      {user && (
        <div className="card animate-fade-up">
          <h2 className="text-sm font-bold mb-3">{t('leaderboard.joinWithCode')}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="flex-1 text-center font-data text-lg tracking-widest uppercase"
              aria-label={t('leaderboard.enterCode')}
            />
            <button
              className="btn-primary text-sm py-2 px-4"
              onClick={acceptInvite}
              disabled={joinCode.length !== 6}
              aria-label={t('leaderboard.join')}
            >
              {t('leaderboard.join')}
            </button>
          </div>
          {message && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
          )}
        </div>
      )}
    </div>
  )
}
