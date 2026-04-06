import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import type { Announcement, AnnouncementPriority, AnnouncementAudience } from '../engine/types'

interface AnnouncementsPageProps {
  teamId: string
  teamName: string
  coachId: string
  coachName: string
  onBack: () => void
}

export function AnnouncementsPage({ teamId, teamName, coachId, coachName, onBack }: AnnouncementsPageProps) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<AnnouncementPriority>('normal')
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [linkUrl, setLinkUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/coach/squad/${encodeURIComponent(teamId)}/announcements`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setAnnouncements(data.announcements ?? [])
        }
      } catch { /* offline */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [teamId])

  async function send() {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/coach/squad/${encodeURIComponent(teamId)}/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: coachId,
          authorName: coachName,
          title: title.trim(),
          body: body.trim(),
          priority,
          audience,
          linkUrl: linkUrl.trim() || undefined,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setAnnouncements([created, ...announcements])
        showToast(t('coach.announce.sent'), 'success')
        setShowNew(false)
        setTitle('')
        setBody('')
        setLinkUrl('')
        setPriority('normal')
        setAudience('all')
      }
    } catch { /* offline */ }
    finally { setSaving(false) }
  }

  if (showNew) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-32">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNew(false)} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
          <h2 className="text-lg font-extrabold heading-display">{t('coach.announce.new')}</h2>
        </div>

        <div className="card animate-fade-up">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('coach.announce.titleLabel')}
              className="text-sm font-bold w-full"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('coach.announce.body')}
              className="w-full text-xs"
              rows={4}
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={t('coach.announce.link')}
              className="text-xs w-full"
            />
          </div>
        </div>

        {/* Priority */}
        <div className="card">
          <p className="section-label mb-2">{t('coach.announce.priority')}</p>
          <div className="flex gap-2">
            {(['normal', 'urgent'] as const).map((p) => (
              <button
                key={p}
                className="flex-1 text-xs font-bold py-2 rounded-xl tap-target"
                style={{
                  background: priority === p ? (p === 'urgent' ? 'var(--color-error-bg)' : 'var(--color-primary-bg)') : 'var(--color-glass-hover)',
                  color: priority === p ? (p === 'urgent' ? 'var(--color-danger)' : 'var(--color-primary-dark)') : 'var(--color-text-muted)',
                }}
                onClick={() => setPriority(p)}
              >
                {p === 'urgent' ? '🔴 ' : ''}{t(`coach.announce.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div className="card">
          <p className="section-label mb-2">{t('coach.announce.audience')}</p>
          <div className="flex gap-2">
            {(['all', 'players', 'parents'] as const).map((a) => (
              <button
                key={a}
                className="flex-1 text-xs font-bold py-2 rounded-xl tap-target"
                style={{
                  background: audience === a ? 'var(--color-primary-bg)' : 'var(--color-glass-hover)',
                  color: audience === a ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                }}
                onClick={() => setAudience(a)}
              >
                {t(`coach.announce.${a}`)}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary w-full text-sm py-3 rounded-xl tap-target"
          onClick={send}
          disabled={saving || !title.trim() || !body.trim()}
        >
          {saving ? '...' : `📢 ${t('coach.announce.send')}`}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="tap-target text-xl" aria-label={t('common.back')}>←</button>
          <div>
            <h2 className="text-lg font-extrabold heading-display">{t('coach.announce.title')}</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teamName}</p>
          </div>
        </div>
        <button
          className="text-xs font-bold px-3 py-1.5 rounded-lg tap-target"
          style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}
          onClick={() => setShowNew(true)}
        >
          + {t('coach.announce.new')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>...</span>
        </div>
      ) : announcements.length > 0 ? (
        <div className="flex flex-col gap-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="card animate-fade-up">
              <div className="flex items-start gap-2 mb-2">
                {ann.priority === 'urgent' && <span className="text-sm shrink-0">🔴</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{ann.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {ann.authorName} · {new Date(ann.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {ann.body}
              </p>
              {ann.linkUrl && (
                <a href={ann.linkUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-xs font-bold mt-2"
                  style={{ color: 'var(--color-primary-dark)' }}>
                  🔗 {ann.linkUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              )}
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                {t('coach.announce.readBy', { count: ann.readBy.length })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8 animate-fade-up">
          <span className="text-5xl mb-3 block">📢</span>
          <p className="text-sm font-bold">{t('coach.announce.empty')}</p>
        </div>
      )}
    </div>
  )
}
