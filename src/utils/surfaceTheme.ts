/**
 * Surface Theme — controls page background, card surfaces, button tints, and nav.
 * Each preset is a cohesive color story, not just a light tint.
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
  /** Bottom nav backdrop */
  navBg: string
  /** Choice button bg */
  choiceBg: string
  /** Choice button border */
  choiceBorder: string
  /** Swatch colors for the picker UI [top, bottom, accent dot] */
  swatch: [string, string, string]
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
    navBg: 'rgba(255, 255, 255, 0.92)',
    choiceBg: '#ffffff',
    choiceBorder: '#e5e7eb',
    swatch: ['#F0F0F0', '#ffffff', '#9CA3AF'],
  },
  {
    id: 'team',
    // Placeholder — overridden dynamically from club colors
    bg: '#EEF9F0',
    bgWarm: '#E0F5E4',
    surface: '#F4FBF5',
    borderTint: 'rgba(5, 150, 105, 0.10)',
    surfaceHover: '#EAF7EC',
    surfaceActive: 'rgba(5, 150, 105, 0.08)',
    headerBg: 'rgba(238, 249, 240, 0.90)',
    navBg: 'rgba(244, 251, 245, 0.92)',
    choiceBg: '#F4FBF5',
    choiceBorder: 'rgba(5, 150, 105, 0.15)',
    swatch: ['#D1FAE5', '#F0FDF4', '#059669'],
  },
  {
    id: 'pitch',
    bg: '#E8F5E9',
    bgWarm: '#C8E6C9',
    surface: '#F1F8F2',
    borderTint: 'rgba(46, 125, 50, 0.12)',
    surfaceHover: '#E0F2E1',
    surfaceActive: 'rgba(46, 125, 50, 0.08)',
    headerBg: 'rgba(232, 245, 233, 0.90)',
    navBg: 'rgba(241, 248, 242, 0.92)',
    choiceBg: '#F1F8F2',
    choiceBorder: 'rgba(46, 125, 50, 0.18)',
    swatch: ['#A5D6A7', '#E8F5E9', '#2E7D32'],
  },
  {
    id: 'ocean',
    bg: '#E3F2FD',
    bgWarm: '#BBDEFB',
    surface: '#EDF5FC',
    borderTint: 'rgba(25, 118, 210, 0.12)',
    surfaceHover: '#DBE9F7',
    surfaceActive: 'rgba(25, 118, 210, 0.08)',
    headerBg: 'rgba(227, 242, 253, 0.90)',
    navBg: 'rgba(237, 245, 252, 0.92)',
    choiceBg: '#EDF5FC',
    choiceBorder: 'rgba(25, 118, 210, 0.18)',
    swatch: ['#90CAF9', '#E3F2FD', '#1565C0'],
  },
  {
    id: 'sunset',
    bg: '#FFF3E0',
    bgWarm: '#FFE0B2',
    surface: '#FFF8F0',
    borderTint: 'rgba(230, 81, 0, 0.10)',
    surfaceHover: '#FFECDB',
    surfaceActive: 'rgba(230, 81, 0, 0.06)',
    headerBg: 'rgba(255, 243, 224, 0.90)',
    navBg: 'rgba(255, 248, 240, 0.92)',
    choiceBg: '#FFF8F0',
    choiceBorder: 'rgba(230, 81, 0, 0.15)',
    swatch: ['#FFCC80', '#FFF3E0', '#E65100'],
  },
  {
    id: 'lavender',
    bg: '#EDE7F6',
    bgWarm: '#D1C4E9',
    surface: '#F3F0FA',
    borderTint: 'rgba(103, 58, 183, 0.12)',
    surfaceHover: '#E8E0F5',
    surfaceActive: 'rgba(103, 58, 183, 0.06)',
    headerBg: 'rgba(237, 231, 246, 0.90)',
    navBg: 'rgba(243, 240, 250, 0.92)',
    choiceBg: '#F3F0FA',
    choiceBorder: 'rgba(103, 58, 183, 0.18)',
    swatch: ['#B39DDB', '#EDE7F6', '#5E35B1'],
  },
  {
    id: 'sand',
    bg: '#FFF8E1',
    bgWarm: '#FFECB3',
    surface: '#FFFBF0',
    borderTint: 'rgba(255, 160, 0, 0.10)',
    surfaceHover: '#FFF3D6',
    surfaceActive: 'rgba(255, 160, 0, 0.06)',
    headerBg: 'rgba(255, 248, 225, 0.90)',
    navBg: 'rgba(255, 251, 240, 0.92)',
    choiceBg: '#FFFBF0',
    choiceBorder: 'rgba(255, 160, 0, 0.15)',
    swatch: ['#FFE082', '#FFF8E1', '#FF8F00'],
  },
  {
    id: 'rose',
    bg: '#FCE4EC',
    bgWarm: '#F8BBD0',
    surface: '#FDF0F4',
    borderTint: 'rgba(194, 24, 91, 0.10)',
    surfaceHover: '#F9DEE7',
    surfaceActive: 'rgba(194, 24, 91, 0.06)',
    headerBg: 'rgba(252, 228, 236, 0.90)',
    navBg: 'rgba(253, 240, 244, 0.92)',
    choiceBg: '#FDF0F4',
    choiceBorder: 'rgba(194, 24, 91, 0.15)',
    swatch: ['#F48FB1', '#FCE4EC', '#AD1457'],
  },
]

/** Derive a surface preset from a team's primary hex color */
export function deriveTeamSurface(hex: string): SurfacePreset {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const mix = (c: number, pct: number) => Math.round(c + (255 - c) * pct)
  const bg = `rgb(${mix(r, 0.88)}, ${mix(g, 0.88)}, ${mix(b, 0.88)})`
  const bgWarm = `rgb(${mix(r, 0.82)}, ${mix(g, 0.82)}, ${mix(b, 0.82)})`
  const surface = `rgb(${mix(r, 0.94)}, ${mix(g, 0.94)}, ${mix(b, 0.94)})`
  const surfaceHover = `rgb(${mix(r, 0.88)}, ${mix(g, 0.88)}, ${mix(b, 0.88)})`

  return {
    id: 'team',
    bg,
    bgWarm,
    surface,
    borderTint: `rgba(${r}, ${g}, ${b}, 0.12)`,
    surfaceHover,
    surfaceActive: `rgba(${r}, ${g}, ${b}, 0.08)`,
    headerBg: `rgba(${mix(r, 0.90)}, ${mix(g, 0.90)}, ${mix(b, 0.90)}, 0.90)`,
    navBg: `rgba(${mix(r, 0.94)}, ${mix(g, 0.94)}, ${mix(b, 0.94)}, 0.92)`,
    choiceBg: surface,
    choiceBorder: `rgba(${r}, ${g}, ${b}, 0.18)`,
    swatch: [bgWarm, bg, hex],
  }
}

const SURFACE_VARS = [
  '--color-bg', '--color-bg-warm', '--color-game-surface',
  '--color-glass', '--color-glass-border', '--color-glass-hover',
  '--color-glass-active', '--surface-header-bg', '--surface-nav-bg',
  '--surface-choice-bg', '--surface-choice-border',
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
  root.style.setProperty('--surface-nav-bg', preset.navBg)
  root.style.setProperty('--surface-choice-bg', preset.choiceBg)
  root.style.setProperty('--surface-choice-border', preset.choiceBorder)
}

const STORAGE_KEY = 'golazo-surface-theme'

export function loadSurfaceTheme(): string {
  return localStorage.getItem(STORAGE_KEY) ?? 'team'
}

export function saveSurfaceTheme(presetId: string): void {
  localStorage.setItem(STORAGE_KEY, presetId)
}
