/**
 * Surface Theme — controls page background + card surface colors.
 * Users can pick a preset or let club colors drive the palette.
 */

export interface SurfacePreset {
  id: string
  /** Page background */
  bg: string
  /** Warm/secondary page bg */
  bgWarm: string
  /** Card surface */
  surface: string
  /** Card border tint (rgba) */
  borderTint: string
  /** Card hover surface */
  surfaceHover: string
  /** Active/pressed surface */
  surfaceActive: string
  /** Header backdrop */
  headerBg: string
  /** Swatch colors for the picker UI [bg, surface] */
  swatch: [string, string]
}

export const SURFACE_PRESETS: SurfacePreset[] = [
  {
    id: 'classic',
    bg: '#FAFAFA',
    bgWarm: '#F5F5F5',
    surface: '#ffffff',
    borderTint: 'rgba(0, 0, 0, 0.06)',
    surfaceHover: '#F7F7F7',
    surfaceActive: 'rgba(0, 0, 0, 0.03)',
    headerBg: 'rgba(250, 250, 250, 0.88)',
    swatch: ['#FAFAFA', '#ffffff'],
  },
  {
    id: 'team',
    // Placeholder — overridden dynamically from club colors
    bg: '#F0FDF4',
    bgWarm: '#ECFDF5',
    surface: '#F7FEF9',
    borderTint: 'rgba(5, 150, 105, 0.08)',
    surfaceHover: '#ECFDF5',
    surfaceActive: 'rgba(5, 150, 105, 0.06)',
    headerBg: 'rgba(240, 253, 244, 0.88)',
    swatch: ['#ECFDF5', '#F7FEF9'],
  },
  {
    id: 'pitch',
    bg: '#F0FDF4',
    bgWarm: '#ECFDF5',
    surface: '#F7FEF9',
    borderTint: 'rgba(22, 163, 74, 0.08)',
    surfaceHover: '#ECFDF5',
    surfaceActive: 'rgba(22, 163, 74, 0.06)',
    headerBg: 'rgba(240, 253, 244, 0.88)',
    swatch: ['#ECFDF5', '#F7FEF9'],
  },
  {
    id: 'ocean',
    bg: '#EFF6FF',
    bgWarm: '#DBEAFE',
    surface: '#F5F9FF',
    borderTint: 'rgba(59, 130, 246, 0.08)',
    surfaceHover: '#EFF6FF',
    surfaceActive: 'rgba(59, 130, 246, 0.06)',
    headerBg: 'rgba(239, 246, 255, 0.88)',
    swatch: ['#DBEAFE', '#F5F9FF'],
  },
  {
    id: 'sunset',
    bg: '#FFF7ED',
    bgWarm: '#FFEDD5',
    surface: '#FFFBF5',
    borderTint: 'rgba(249, 115, 22, 0.08)',
    surfaceHover: '#FFF7ED',
    surfaceActive: 'rgba(249, 115, 22, 0.06)',
    headerBg: 'rgba(255, 247, 237, 0.88)',
    swatch: ['#FFEDD5', '#FFFBF5'],
  },
  {
    id: 'lavender',
    bg: '#F5F3FF',
    bgWarm: '#EDE9FE',
    surface: '#FAF8FF',
    borderTint: 'rgba(139, 92, 246, 0.08)',
    surfaceHover: '#F5F3FF',
    surfaceActive: 'rgba(139, 92, 246, 0.06)',
    headerBg: 'rgba(245, 243, 255, 0.88)',
    swatch: ['#EDE9FE', '#FAF8FF'],
  },
  {
    id: 'sand',
    bg: '#FEFCE8',
    bgWarm: '#FEF9C3',
    surface: '#FEFEF5',
    borderTint: 'rgba(202, 138, 4, 0.08)',
    surfaceHover: '#FEFCE8',
    surfaceActive: 'rgba(202, 138, 4, 0.06)',
    headerBg: 'rgba(254, 252, 232, 0.88)',
    swatch: ['#FEF9C3', '#FEFEF5'],
  },
  {
    id: 'rose',
    bg: '#FFF1F2',
    bgWarm: '#FFE4E6',
    surface: '#FFF8F8',
    borderTint: 'rgba(244, 63, 94, 0.08)',
    surfaceHover: '#FFF1F2',
    surfaceActive: 'rgba(244, 63, 94, 0.06)',
    headerBg: 'rgba(255, 241, 242, 0.88)',
    swatch: ['#FFE4E6', '#FFF8F8'],
  },
]

/** Derive a surface preset from a team's primary hex color */
export function deriveTeamSurface(hex: string): SurfacePreset {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Very light tints (~95% white mix)
  const mix = (c: number, pct: number) => Math.round(c + (255 - c) * pct)
  const bg = `rgb(${mix(r, 0.92)}, ${mix(g, 0.92)}, ${mix(b, 0.92)})`
  const bgWarm = `rgb(${mix(r, 0.88)}, ${mix(g, 0.88)}, ${mix(b, 0.88)})`
  const surface = `rgb(${mix(r, 0.96)}, ${mix(g, 0.96)}, ${mix(b, 0.96)})`
  const surfaceHover = `rgb(${mix(r, 0.92)}, ${mix(g, 0.92)}, ${mix(b, 0.92)})`

  return {
    id: 'team',
    bg,
    bgWarm,
    surface,
    borderTint: `rgba(${r}, ${g}, ${b}, 0.08)`,
    surfaceHover,
    surfaceActive: `rgba(${r}, ${g}, ${b}, 0.06)`,
    headerBg: `rgba(${mix(r, 0.92)}, ${mix(g, 0.92)}, ${mix(b, 0.92)}, 0.88)`,
    swatch: [bgWarm, surface],
  }
}

const SURFACE_VARS = [
  '--color-bg', '--color-bg-warm', '--color-game-surface',
  '--color-glass', '--color-glass-border', '--color-glass-hover',
  '--color-glass-active', '--surface-header-bg',
] as const

/** Apply surface theme CSS variables to document root */
export function applySurfaceTheme(presetId: string, teamHex?: string): void {
  const root = document.documentElement

  if (presetId === 'classic') {
    // Remove overrides — let index.css defaults apply
    SURFACE_VARS.forEach((v) => root.style.removeProperty(v))
    return
  }

  let preset: SurfacePreset
  if (presetId === 'team' && teamHex) {
    preset = deriveTeamSurface(teamHex)
  } else if (presetId === 'team') {
    // No team color — fall back to pitch
    preset = SURFACE_PRESETS.find((p) => p.id === 'pitch')!
  } else {
    preset = SURFACE_PRESETS.find((p) => p.id === presetId) ?? SURFACE_PRESETS[0]
  }

  root.style.setProperty('--color-bg', preset.bg)
  root.style.setProperty('--color-bg-warm', preset.bgWarm)
  root.style.setProperty('--color-game-surface', preset.surface)
  root.style.setProperty('--color-glass', preset.surface)
  root.style.setProperty('--color-glass-border', preset.borderTint)
  root.style.setProperty('--color-glass-hover', preset.surfaceHover)
  root.style.setProperty('--color-glass-active', preset.surfaceActive)
  root.style.setProperty('--surface-header-bg', preset.headerBg)
}

const STORAGE_KEY = 'golazo-surface-theme'

export function loadSurfaceTheme(): string {
  return localStorage.getItem(STORAGE_KEY) ?? 'team'
}

export function saveSurfaceTheme(presetId: string): void {
  localStorage.setItem(STORAGE_KEY, presetId)
}
