import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { RosterPlayer } from '../engine/types'

interface SquadRosterProps {
  squadId: string
  squadName: string
  onBack: () => void
  onEvaluate: (playerId: string) => void
}

export function SquadRoster({ squadId, squadName, onBack, onEvaluate }: SquadRosterProps) {
  const { t } = useTranslation()
  const [players, setPlayers] = useState<RosterPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/coach/squad/${encodeURIComponent(squadId)}/roster`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setPlayers(data.players ?? [])
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [squadId])

  if (selectedPlayer) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-32">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPlayer(null)} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
          <h2 className="text-lg font-extrabold heading-display">{t('coach.roster.detail')}</h2>
        </div>

        {/* Player hero */}
        <div className="card animate-fade-up">
          <div className="flex items-center gap-4 mb-3">
            {selectedPlayer.photoUrl ? (
              <img src={selectedPlayer.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--color-glass-hover)' }}>
                <span className="text-2xl">⚽</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-extrabold">{selectedPlayer.playerName}</p>
              <div className="flex gap-2 mt-1">
                {selectedPlayer.jerseyNumber && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                    #{selectedPlayer.jerseyNumber}
                  </span>
                )}
                {selectedPlayer.positions.map((pos) => (
                  <span key={pos} className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-glass-hover)', color: 'var(--color-text-secondary)' }}>
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
              <p className="text-sm font-bold">{new Date(selectedPlayer.birthDate).toLocaleDateString()}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('onboarding.birthDate')}
              </p>
            </div>
            <div className="py-2 rounded-xl" style={{ background: 'var(--color-glass-hover)' }}>
              <p className="text-sm font-bold">{new Date(selectedPlayer.joinedAt).toLocaleDateString()}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('coach.roster.lastActive')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
          onClick={() => onEvaluate(selectedPlayer.playerId)}
        >
          📊 {t('coach.dashboard.evaluate')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-extrabold heading-display">{t('coach.roster.title')}</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{squadName}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
        </div>
      ) : players.length > 0 ? (
        <div className="flex flex-col gap-2">
          {players.map((player) => (
            <button
              key={player.playerId}
              className="card tap-target flex items-center gap-3 p-3 text-left"
              onClick={() => setSelectedPlayer(player)}
            >
              {player.photoUrl ? (
                <img src={player.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-glass-hover)' }}>
                  <span className="text-lg">⚽</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{player.playerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {player.jerseyNumber && (
                    <span className="text-xs font-data font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                      #{player.jerseyNumber}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {player.positions.join(', ')}
                  </span>
                </div>
              </div>
              <span className="text-xs shrink-0" style={{ color: player.active ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {player.active ? '●' : '○'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8 animate-fade-up">
          <span className="text-5xl mb-3 block">👥</span>
          <p className="text-sm font-bold mb-1">{t('coach.roster.empty')}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('coach.roster.emptyHint')}</p>
        </div>
      )}
    </div>
  )
}
