import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { SharedTeam } from '../engine/types'

interface TeamPickerProps {
  value: string
  onChange: (name: string, team?: SharedTeam) => void
  country?: string
  placeholder?: string
  className?: string
}

/**
 * Autocomplete team picker — searches the shared team registry.
 * Falls back to free text input if API is unavailable.
 */
export function TeamPicker({ value, onChange, country, placeholder, className }: TeamPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SharedTeam[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value
  useEffect(() => { setQuery(value) }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(text: string) {
    setQuery(text)
    onChange(text, undefined) // Update parent with typed text (no registry match yet)

    // Debounced search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 2) { setResults([]); setOpen(false); return }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: text, limit: '10' })
        if (country) params.set('country', country)
        const res = await fetch(`/api/teams?${params}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.teams || [])
          setOpen((data.teams || []).length > 0)
        }
      } catch {
        // API unavailable — just use free text
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function selectTeam(team: SharedTeam) {
    setQuery(team.name)
    onChange(team.name, team)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder ?? t('teams.search')}
          className={className ?? 'w-full'}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ...
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-40 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg"
          style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', maxHeight: '240px', overflowY: 'auto' }}
        >
          {results.map((team) => (
            <button
              key={team.id}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              onClick={() => selectTeam(team)}
            >
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt=""
                  className="w-6 h-6 rounded object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0" style={{ background: 'var(--color-glass-active)' }}>
                  ⚽
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{team.name}</p>
                <p className="text-[0.6rem]" style={{ color: 'var(--color-text-muted)' }}>
                  {[team.city, team.league, team.country].filter(Boolean).join(' · ')}
                </p>
              </div>
              {team.verified && (
                <span className="text-[0.6rem] shrink-0" title="Verified">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
