import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { TeamProfile } from './TeamProfile'
import type { SharedTeam } from '../engine/types'

interface TeamPickerProps {
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
 */
export function TeamPicker({ value, onChange, country, placeholder, className, showAddNew, onAddNew }: TeamPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SharedTeam[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewTeam, setViewTeam] = useState<SharedTeam | null>(null)
  const debounceRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; openUp: boolean }>({ top: 0, left: 0, width: 0, openUp: false })

  // Sync external value
  useEffect(() => { setQuery(value) }, [value])

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
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
    onChange(team.name, team)
    setOpen(false)
  }

  const hasExactMatch = results.some((t) => normalize(t.name) === normalize(query))
  const showAddOption = showAddNew && query.length >= 2 && !hasExactMatch

  const dropdown = open && (results.length > 0 || showAddOption) ? createPortal(
    <div
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
          <div
            key={team.id}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
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
              <p className="text-[0.6rem] truncate" style={{ color: 'var(--color-text-muted)' }}>
                {alias
                  ? `"${alias}" · ${[team.city, team.country].filter(Boolean).join(' · ')}`
                  : [team.city, team.league, team.country].filter(Boolean).join(' · ')
                }
              </p>
            </div>
            {team.verified && (
              <span className="text-[0.6rem] shrink-0" title="Verified">✓</span>
            )}
            <button
              className="text-xs px-1.5 py-1 shrink-0 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={(e) => { e.stopPropagation(); setViewTeam(team); setOpen(false) }}
              aria-label="View team info"
            >
              ℹ️
            </button>
          </div>
        )
      })}
      {showAddOption && (
        <button
          className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-50 transition-colors"
          style={{ borderTop: results.length > 0 ? '1px solid var(--color-glass-border, #e2e8f0)' : undefined }}
          onClick={() => { onAddNew?.(query); setOpen(false) }}
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
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            updatePosition()
            if (results.length > 0 || (showAddNew && query.length >= 2)) setOpen(true)
          }}
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
      {dropdown}
      {viewTeam && <TeamProfile team={viewTeam} onClose={() => setViewTeam(null)} />}
    </>
  )
}
