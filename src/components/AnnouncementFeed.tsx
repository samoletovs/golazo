import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import type { Announcement } from '../engine/types'

/**
 * Shows recent announcements from coaches for the player's teams.
 * Displayed on player Dashboard and mentor Dashboard.
 */
export function AnnouncementFeed() {
  const { t } = useTranslation()
  const { profile } = useApp()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!profile?.teams?.length) { setLoading(false); return }

      try {
        // Fetch announcements for all teams the player is part of
        const teamIds = profile.teams
          .filter((t) => t.active && t.registryId)
          .map((t) => t.registryId!)

        const allAnnouncements: Announcement[] = []
        for (const teamId of teamIds.slice(0, 5)) {
          try {
            const res = await fetch(`/api/coach/team/${encodeURIComponent(teamId)}/announcements`)
            if (res.ok) {
              const data = await res.json()
              const items: Announcement[] = data.announcements ?? []
              // Filter by audience
              const role = profile.role
              const filtered = items.filter((a) =>
                a.audience === 'all'
                || (a.audience === 'players' && role === 'player')
                || (a.audience === 'parents' && role === 'mentor')
              )
              allAnnouncements.push(...filtered)
            }
          } catch { /* skip this team */ }
        }

        if (!cancelled) {
          // Sort by date, most recent first, take latest 5
          allAnnouncements.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          setAnnouncements(allAnnouncements.slice(0, 5))
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.teams, profile?.role])

  if (loading || announcements.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="section-label">📢 {t('player.announcements')}</p>
      {announcements.map((ann) => (
        <div key={ann.id} className="card animate-fade-up">
          <div className="flex items-start gap-2">
            {ann.priority === 'urgent' && <span className="text-sm shrink-0">🔴</span>}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{ann.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {ann.authorName} · {new Date(ann.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {ann.body.length > 120 ? ann.body.slice(0, 120) + '…' : ann.body}
              </p>
              {ann.linkUrl && (
                <a href={ann.linkUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-xs font-bold mt-1"
                  style={{ color: 'var(--color-primary-dark)' }}>
                  🔗 {t('common.link')}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
