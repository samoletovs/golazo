import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SharedTeam } from '../engine/types'

interface AddTeamDialogProps {
  initialName: string
  defaultCountry?: string
  onAdd: (name: string, sharedTeam?: SharedTeam) => void
  onCancel: () => void
}

/**
 * Mini-dialog for adding a new team that wasn't found in the registry.
 * Asks for name + country + city, then validates against API for duplicates.
 * If duplicate found, proposes using the existing team.
 */
export function AddTeamDialog({ initialName, defaultCountry, onAdd, onCancel }: AddTeamDialogProps) {
  const { t } = useTranslation()

  const [name, setName] = useState(initialName)
  const [country, setCountry] = useState(defaultCountry ?? 'LV')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<SharedTeam | null>(null)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    setDuplicate(null)

    try {
      // Try creating via API — it checks for duplicates
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          country,
          city: city.trim() || undefined,
        }),
      })

      if (res.status === 409) {
        // Duplicate found — fetch the existing team to show it
        const data = await res.json()
        if (data.existingId) {
          const searchRes = await fetch(`/api/teams?q=${encodeURIComponent(name.trim())}&country=${country}&limit=1`)
          if (searchRes.ok) {
            const searchData = await searchRes.json()
            const match = searchData.teams?.[0]
            if (match) {
              setDuplicate(match)
              setSaving(false)
              return
            }
          }
        }
        setError(t('teams.duplicateError'))
        setSaving(false)
        return
      }

      if (res.ok) {
        const created = await res.json() as SharedTeam
        onAdd(created.name, created)
        return
      }

      // API unavailable — add locally without registry link
      onAdd(name.trim())
    } catch {
      // API unavailable — add locally
      onAdd(name.trim())
    } finally {
      setSaving(false)
    }
  }

  function useDuplicate() {
    if (duplicate) {
      onAdd(duplicate.name, duplicate)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} role="dialog" aria-modal="true">
      <div
        className="w-full bg-white rounded-2xl p-4 animate-fade-up"
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-extrabold mb-3">
          {t('teams.addNewTitle')}
        </h3>

        {/* Duplicate suggestion */}
        {duplicate && (
          <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--color-primary-bg-subtle, #f0fdf4)', border: '1px solid var(--color-primary-light, #bbf7d0)' }}>
            <p className="text-xs font-bold mb-2">{t('teams.duplicateFound')}</p>
            <div className="flex items-center gap-2 mb-2">
              {duplicate.logoUrl ? (
                <img src={duplicate.logoUrl} alt="" className="w-8 h-8 rounded object-contain" />
              ) : (
                <span className="w-8 h-8 rounded flex items-center justify-center text-sm" style={{ background: 'var(--color-glass-active)' }}>⚽</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{duplicate.name}</p>
                <p className="text-[0.65rem]" style={{ color: 'var(--color-text-muted)' }}>
                  {[duplicate.city, duplicate.league, duplicate.country].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 text-xs font-bold py-2 rounded-lg"
                style={{ background: 'var(--color-primary-dark)', color: '#fff' }}
                onClick={useDuplicate}
              >
                {t('teams.useThis')}
              </button>
              <button
                className="flex-1 text-xs font-bold py-2 rounded-lg"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-secondary)' }}
                onClick={() => setDuplicate(null)}
              >
                {t('teams.addAnyway')}
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!duplicate && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {t('teams.clubName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.country')}
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-sm p-2 rounded-lg border mt-1"
                >
                  <option value="LV">🇱🇻 Latvia</option>
                  <option value="EE">🇪🇪 Estonia</option>
                  <option value="LT">🇱🇹 Lithuania</option>
                  <option value="PL">🇵🇱 Poland</option>
                  <option value="FI">🇫🇮 Finland</option>
                  <option value="SE">🇸🇪 Sweden</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.city')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('onboarding.cityPlaceholder')}
                  className="w-full mt-1"
                />
              </div>
            </div>

            {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}

            <div className="flex gap-2 mt-1">
              <button
                className="flex-1 text-sm font-bold py-2.5 rounded-xl"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-secondary)' }}
                onClick={onCancel}
              >
                {t('common.cancel')}
              </button>
              <button
                className="flex-1 text-sm font-bold py-2.5 rounded-xl"
                style={{ background: 'var(--color-primary-dark)', color: '#fff' }}
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >
                {saving ? '...' : t('teams.addBtn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
