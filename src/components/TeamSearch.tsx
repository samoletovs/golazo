import { useState, useEffect, useRef, useCallback } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'
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
  const [unavailable, setUnavailable] = useState(false)
  const [selected, setSelected] = useState(false) // true when a registry team was picked
  const debounceRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const clearRef = useRef<HTMLButtonElement>(null)
  const focusNext = useRef<'input' | 'clear' | null>(null)
  const requestSequence = useRef(0)
  const [dropdownRoot, setDropdownRoot] = useState<HTMLElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number; openUp: boolean }>({ top: 0, left: 0, width: 0, openUp: false })

  // Sync external value
  useEffect(() => { setQuery(value); if (!value) setSelected(false) }, [value])
  useEffect(() => {
    if (focusNext.current === 'clear' && selected) clearRef.current?.focus()
    if (focusNext.current === 'input' && !selected) inputRef.current?.focus()
    focusNext.current = null
  }, [selected])
  useEffect(() => () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    requestSequence.current++
  }, [])

  // Calculate dropdown position relative to viewport
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return
    setDropdownRoot(inputRef.current.closest('dialog') ?? document.body)
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
    const request = ++requestSequence.current
    setUnavailable(false)
    setQuery(text)
    setSelected(false)
    onChange(text, undefined)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 2) { setResults([]); setOpen(false); setLoading(false); return }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: text, limit: '10' })
        if (country) params.set('country', country)
        const res = await fetch(`/api/teams?${params}`)
        if (!res.ok) throw new Error(`Team search failed: ${res.status}`)
        if (request === requestSequence.current) {
          const data = await res.json()
          if (request !== requestSequence.current) return
          setResults(data.teams || [])
          updatePosition()
          setOpen(document.activeElement === inputRef.current || Boolean(dropdownRef.current?.contains(document.activeElement)))
        }
      } catch (cause) {
        if (request === requestSequence.current) {
          console.error('Team search is unavailable; free-text entry remains available:', cause)
          setUnavailable(true)
          setOpen(false)
        }
      } finally {
        if (request === requestSequence.current) setLoading(false)
      }
    }, 300)
  }

  function selectTeam(team: SharedTeam) {
    requestSequence.current++
    setLoading(false)
    focusNext.current = 'clear'
    setQuery(team.name)
    setSelected(true)
    onChange(team.name, team)
    setOpen(false)
  }

  function closeOnBlur(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget
    if (!(next instanceof Node) || (next !== inputRef.current && !dropdownRef.current?.contains(next))) setOpen(false)
  }

  function searchKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      inputRef.current?.focus()
      setOpen(false)
      return
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || results.length === 0) return
    event.preventDefault()
    setOpen(true)
    const backwards = event.key === 'ArrowUp'
    requestAnimationFrame(() => {
      const options = [...(dropdownRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      const active = options.findIndex(option => option === document.activeElement)
      const next = active < 0 ? (backwards ? options.length - 1 : 0) : (active + (backwards ? -1 : 1) + options.length) % options.length
      options[next]?.focus()
    })
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
      onBlur={closeOnBlur}
      onKeyDown={searchKeys}
      role="group"
      aria-label={t('teams.search')}
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
                alt={team.name}
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
    dropdownRoot ?? document.body
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
              ref={clearRef}
              className="tap-target text-xs px-1.5 py-0.5 rounded-lg"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => {
                requestSequence.current++
                focusNext.current = 'input'
                setQuery(''); setSelected(false); setResults([]); setOpen(false); setLoading(false); setUnavailable(false)
                onChange('', undefined)
              }}
              aria-label={t('academy.clearSelection')}
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
              onBlur={closeOnBlur}
              onKeyDown={searchKeys}
              onFocus={() => {
                updatePosition()
                if (results.length > 0) setOpen(true)
              }}
              placeholder={placeholder ?? t('teams.search')}
              aria-label={placeholder ?? t('teams.search')}
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
      {unavailable && <p className="academy-hint mt-2" role="status">{t('academy.teamSearchUnavailable')}</p>}
    </>
  )
}
