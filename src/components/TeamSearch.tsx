import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import type { SharedTeam } from '../engine/types'

interface TeamSearchProps {
  value: string
  onChange: (name: string, team?: SharedTeam) => void
  country?: string
  placeholder?: string
  className?: string
  /** Show "Add new team" option when no match found */
  showAddNew?: boolean
  onAddNew?: (name: string) => void
}

/** Strip accents for search highlighting (mirrors API normalize) */
function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[āàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēėèêë]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[īìîï]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[ōõöò]/g, 'o')
    .replace(/[šś]/g, 's').replace(/[ūùûü]/g, 'u').replace(/[žź]/g, 'z')
}

/** Find which alias matched the query */
function matchedAlias(team: SharedTeam, q: string): string | undefined {
  if (!q || q.length < 2) return undefined
  const normQ = normalize(q)
  if (normalize(team.name).includes(normQ)) return undefined
  return team.aliases?.find((a) => normalize(a).includes(normQ))
}

/**
 * Autocomplete team picker — searches the shared team registry.
 * Dropdown renders via portal to avoid clipping in scrollable containers.
 * Falls back to free text input if API is unavailable.
 *
 * Flow: type → see suggestions → tap row to select.
 * If nothing selected and input has text, an inline "+ Add" button appears.
 */
export function TeamSearch({ value, onChange, country, placeholder, className, showAddNew, onAddNew }: TeamSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SharedTeam[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(false) // true when a registry team was picked
  const debounceRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; openUp: boolean }>({ top: 0, left: 0, width: 0, openUp: false })

  // Sync external value
  useEffect(() => { setQuery(value); if (!value) setSelected(false) }, [value])

  // Calculate dropdown position relative to viewport
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 260
    setDropdownPos({
      top: openUp ? rect.top : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    })
  }, [])

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    function handleClose(e: MouseEvent) {
      const target = e.target as Node
      if (inputRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleScroll() { updatePosition() }
    document.addEventListener('mousedown', handleClose)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClose)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  function handleInput(text: string) {
    setQuery(text)
    setSelected(false)
    onChange(text, undefined)

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
          updatePosition()
          setOpen(true)
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
    setSelected(true)
    onChange(team.name, team)
    setOpen(false)
  }

  // Show inline add button when: text typed, not loading, no selection made, dropdown is closed (or no exact match)
  const hasExactMatch = results.some((t) => normalize(t.name) === normalize(query))
  const showInlineAdd = showAddNew && query.length >= 2 && !selected && !loading && !hasExactMatch

  const dropdown = open && results.length > 0 ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] rounded-xl overflow-hidden shadow-lg"
      style={{
        top: dropdownPos.openUp ? undefined : `${dropdownPos.top}px`,
        bottom: dropdownPos.openUp ? `${window.innerHeight - dropdownPos.top + 4}px` : undefined,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
        background: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-glass-border, #e2e8f0)',
        maxHeight: '240px',
        overflowY: 'auto',
      }}
      onMouseDown={(e) => e.preventDefault()} // prevent input blur
    >
      {results.map((team) => {
        const alias = matchedAlias(team, query)
        return (
          <button
            key={team.id}
            className="flex items-center gap-2 px-3 py-2.5 w-full text-left hover:bg-gray-50 transition-colors"
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
              <span className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0" style={{ background: 'var(--color-glass-active, #f1f5f9)' }}>
                ⚽
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{team.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                {alias
                  ? `"${alias}" · ${[team.city, team.country].filter(Boolean).join(' · ')}`
                  : [team.city, team.league, team.country].filter(Boolean).join(' · ')
                }
              </p>
            </div>
            {team.verified && (
              <span className="text-xs shrink-0" title="Verified">✓</span>
            )}
          </button>
        )
      })}
      {showAddNew && query.length >= 2 && !hasExactMatch && (
        <button
          className="flex items-center gap-2 px-3 py-2.5 w-full text-left hover:bg-gray-50 transition-colors"
          style={{ borderTop: results.length > 0 ? '1px solid var(--color-glass-border, #e2e8f0)' : undefined }}
          onClick={() => { onAddNew?.(query); setOpen(false); setQuery(''); setSelected(false) }}
        >
          <span className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0" style={{ background: 'var(--color-primary-light, #dcfce7)', color: 'var(--color-primary-dark, #166534)' }}>
            +
          </span>
          <span className="text-sm">
            {t('teams.addCustom', { name: query })}
          </span>
        </button>
      )}
    </div>,
    document.body
  ) : null

  return (
    <>
      <div className="relative">
        {/* Selected team chip — shown when a registry team is picked */}
        {selected && query ? (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: 'var(--color-primary-bg, #dcfce7)',
              border: '1.5px solid var(--color-primary, #22c55e)',
            }}
          >
            <span className="text-sm">✓</span>
            <span className="text-sm font-bold flex-1 truncate">{query}</span>
            <button
              className="tap-target text-xs px-1.5 py-0.5 rounded-lg"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => { setQuery(''); setSelected(false); onChange('', undefined); inputRef.current?.focus() }}
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => {
                updatePosition()
                if (results.length > 0) setOpen(true)
              }}
              placeholder={placeholder ?? t('teams.search')}
              className={className ?? 'w-full'}
              style={showInlineAdd ? { paddingRight: '4.5rem' } : undefined}
              autoComplete="off"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                ...
              </span>
            )}
            {showInlineAdd && !open && (
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--color-primary-dark, #166534)', color: '#fff' }}
                onClick={() => { onAddNew?.(query); setQuery(''); setSelected(false) }}
                aria-label={t('teams.addCustom', { name: query })}
              >
                + {t('teams.addBtn')}
              </button>
            )}
          </>
        )}
      </div>
      {dropdown}
    </>
  )
}
