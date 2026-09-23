import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { AcademyPanel } from './AcademyPage'
import { AcademyError } from './AcademyState'

interface SharedTournament {
  id: string; name: string; startDate: string; location: string; participantCount: number; sourceUrl?: string
}
function isTournament(value: unknown): value is SharedTournament {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string'
    && 'name' in value && typeof value.name === 'string' && 'startDate' in value && typeof value.startDate === 'string'
    && 'location' in value && typeof value.location === 'string' && 'participantCount' in value && typeof value.participantCount === 'number'
}
export function AcademyTournamentDiscovery({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t } = useTranslation()
  const { profile, tournaments } = useApp()
  const [items, setItems] = useState<SharedTournament[]>([])
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const names = [...new Set((profile?.teams ?? []).filter(team => team.active).flatMap(team => [team.name, ...team.aliases]))].slice(0, 3)
    if (!names.length) return
    const controller = new AbortController()
    async function discover() {
      setFailed(false)
      try {
        const result = await Promise.all(names.map(async name => {
          const response = await fetch(`/api/shared-tournaments?team=${encodeURIComponent(name)}&status=live`, { signal: controller.signal })
          if (!response.ok) throw new Error(`Tournament discovery failed: ${response.status}`)
          const payload: unknown = await response.json()
          if (typeof payload !== 'object' || payload === null || !('tournaments' in payload) || !Array.isArray(payload.tournaments) || !payload.tournaments.every(isTournament)) throw new Error('Invalid tournament response')
          return payload.tournaments
        }))
        const existing = new Set(tournaments.map(item => item.sourceUrl).filter(Boolean))
        const unique = new Map(result.flat().filter(item => !existing.has(item.sourceUrl)).map(item => [item.id, item]))
        if (!controller.signal.aborted) setItems([...unique.values()])
      } catch (cause) {
        if (controller.signal.aborted) return
        console.error('Shared tournament discovery failed:', cause)
        setFailed(true)
      }
    }
    void discover()
    return () => controller.abort()
  }, [profile?.teams, tournaments, attempt])
  if (!items.length && !failed) return null
  return <AcademyPanel title={t('portal.tournaments')}>
    {failed && <AcademyError message={t('academy.loadError')} onRetry={() => setAttempt(value => value + 1)} />}
    {items.map(item => <div key={item.id} className="academy-agenda-row"><time>{item.startDate}</time><div>
      <h3>{item.name}</h3><p>{item.location} · {t('academy.participants', { count: item.participantCount })}</p>
      <button className="academy-link" onClick={() => onNavigate?.('schedule')}>{t('nav.schedule')} →</button>
    </div></div>)}
  </AcademyPanel>
}
