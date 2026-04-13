/**
 * Surface Theme — cohesive page + card + button tinting.
 *
 * Design philosophy (Apple HIG + Material 3 + NNGroup 60-30-10):
 * - Surfaces are BARELY tinted — you feel the warmth/coolness without overwhelming
 * - Card surfaces are lighter than page backgrounds (Apple's grouped background pattern)
 * - Borders/dividers pick up the theme subtly
 * - Swatches in the picker are MORE vivid so users can tell themes apart
 * - Each preset uses a monochromatic harmony (single hue, varying lightness)
 */

export interface SurfacePreset {
  id: string
  bg: string
  bgWarm: string
  surface: string
  borderTint: string
  surfaceHover: string
  surfaceActive: string
  headerBg: string
  navBg: string
  choiceBg: string
  choiceBorder: string
  /** Accent color hex — overrides --color-primary-*. null = keep team color */
  accent: string | null
  /** Swatch: [vivid accent, medium tint, light card preview] */
  swatch: [string, string, string]
}

export const SURFACE_PRESETS: SurfacePreset[] = [
  {
    // Dynamic — derived from club primary color (default, always first)
    id: 'team',
    bg: '#F0FAF2',
    bgWarm: '#E6F5E9',
    surface: '#F7FCF8',
    borderTint: 'rgba(5, 150, 105, 0.10)',
    surfaceHover: '#EEF8F0',
    surfaceActive: 'rgba(5, 150, 105, 0.06)',
    headerBg: 'rgba(240, 250, 242, 0.90)',
    navBg: 'rgba(247, 252, 248, 0.93)',
    choiceBg: '#F7FCF8',
    choiceBorder: 'rgba(5, 150, 105, 0.12)',
    accent: null,
    swatch: ['#059669', '#A7F3D0', '#F0FAF2'],
  },
  {
    // Pure white — Apple-clean, minimal personality
    id: 'classic',
    bg: '#F8F9FA',
    bgWarm: '#F1F3F5',
    surface: '#ffffff',
    borderTint: 'rgba(0, 0, 0, 0.06)',
    surfaceHover: '#F7F8FA',
    surfaceActive: 'rgba(0, 0, 0, 0.03)',
    headerBg: 'rgba(248, 249, 250, 0.90)',
    navBg: 'rgba(255, 255, 255, 0.92)',
    choiceBg: '#ffffff',
    choiceBorder: 'rgba(0, 0, 0, 0.08)',
    accent: '#475569',
    swatch: ['#475569', '#94A3B8', '#F8F9FA'],
  },
  {
    // Vivid pitch green — match day energy
    id: 'pitch',
    bg: '#F0F9F1',
    bgWarm: '#E4F3E6',
    surface: '#F7FBF7',
    borderTint: 'rgba(22, 163, 74, 0.10)',
    surfaceHover: '#EDF7EE',
    surfaceActive: 'rgba(22, 163, 74, 0.06)',
    headerBg: 'rgba(240, 249, 241, 0.90)',
    navBg: 'rgba(247, 251, 247, 0.93)',
    choiceBg: '#F7FBF7',
    choiceBorder: 'rgba(22, 163, 74, 0.12)',
    accent: '#16A34A',
    swatch: ['#16A34A', '#4ADE80', '#F0F9F1'],
  },
  {
    // Deep navy — floodlit stadium, Champions League nights
    id: 'nightmatch',
    bg: '#EFF3FB',
    bgWarm: '#E2E9F6',
    surface: '#F5F7FC',
    borderTint: 'rgba(30, 64, 175, 0.09)',
    surfaceHover: '#ECF0FA',
    surfaceActive: 'rgba(30, 64, 175, 0.05)',
    headerBg: 'rgba(239, 243, 251, 0.90)',
    navBg: 'rgba(245, 247, 252, 0.93)',
    choiceBg: '#F5F7FC',
    choiceBorder: 'rgba(30, 64, 175, 0.12)',
    accent: '#1E40AF',
    swatch: ['#1E40AF', '#60A5FA', '#EFF3FB'],
  },
  {
    // Warm amber — golden boot, trophy energy
    id: 'goldenboot',
    bg: '#FDF8F0',
    bgWarm: '#FAF0E0',
    surface: '#FEFBF6',
    borderTint: 'rgba(180, 83, 9, 0.09)',
    surfaceHover: '#FBF5ED',
    surfaceActive: 'rgba(180, 83, 9, 0.05)',
    headerBg: 'rgba(253, 248, 240, 0.90)',
    navBg: 'rgba(254, 251, 246, 0.93)',
    choiceBg: '#FEFBF6',
    choiceBorder: 'rgba(180, 83, 9, 0.12)',
    accent: '#B45309',
    swatch: ['#D97706', '#FBBF24', '#FDF8F0'],
  },
  {
    // Bold crimson — derby day, passion, rivalry
    id: 'derby',
    bg: '#FDF0F3',
    bgWarm: '#FAE2E8',
    surface: '#FEF6F8',
    borderTint: 'rgba(190, 18, 60, 0.08)',
    surfaceHover: '#FBEDF1',
    surfaceActive: 'rgba(190, 18, 60, 0.05)',
    headerBg: 'rgba(253, 240, 243, 0.90)',
    navBg: 'rgba(254, 246, 248, 0.93)',
    choiceBg: '#FEF6F8',
    choiceBorder: 'rgba(190, 18, 60, 0.10)',
    accent: '#BE123C',
    swatch: ['#E11D48', '#FDA4AF', '#FDF0F3'],
  },
]

/** Derive a surface preset from a team's primary hex color */
export function deriveTeamSurface(hex: string): SurfacePreset {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Apple-style subtle tinting — surfaces barely tinted, card lighter than bg
  const mix = (c: number, pct: number) => Math.round(c + (255 - c) * pct)
  const bg = `rgb(${mix(r, 0.93)}, ${mix(g, 0.93)}, ${mix(b, 0.93)})`
  const bgWarm = `rgb(${mix(r, 0.90)}, ${mix(g, 0.90)}, ${mix(b, 0.90)})`
  const surface = `rgb(${mix(r, 0.97)}, ${mix(g, 0.97)}, ${mix(b, 0.97)})`
  const surfaceHover = `rgb(${mix(r, 0.94)}, ${mix(g, 0.94)}, ${mix(b, 0.94)})`
  const midTint = `rgb(${mix(r, 0.60)}, ${mix(g, 0.60)}, ${mix(b, 0.60)})`

  return {
    id: 'team',
    bg,
    bgWarm,
    surface,
    borderTint: `rgba(${r}, ${g}, ${b}, 0.10)`,
    surfaceHover,
    surfaceActive: `rgba(${r}, ${g}, ${b}, 0.06)`,
    headerBg: `rgba(${mix(r, 0.94)}, ${mix(g, 0.94)}, ${mix(b, 0.94)}, 0.90)`,
    navBg: `rgba(${mix(r, 0.97)}, ${mix(g, 0.97)}, ${mix(b, 0.97)}, 0.93)`,
    choiceBg: surface,
    choiceBorder: `rgba(${r}, ${g}, ${b}, 0.12)`,
    accent: null,
    swatch: [hex, midTint, bg],
  }
}

import { applyTeamTheme } from './teamTheme'

const SURFACE_VARS = [
  '--color-bg', '--color-bg-warm', '--color-game-surface',
  '--color-glass', '--color-glass-border', '--color-glass-hover',
  '--color-glass-active', '--surface-header-bg', '--surface-nav-bg',
  '--surface-choice-bg', '--surface-choice-border',
] as const

/** Apply surface theme CSS variables to document root */
export function applySurfaceTheme(presetId: string, teamHex?: string): void {
  const root = document.documentElement

  // Migrate old theme IDs
  const idMap: Record<string, string> = { sunset: 'goldenboot', ocean: 'nightmatch', rose: 'derby', lavender: 'team', sand: 'team' }
  const resolvedId = idMap[presetId] ?? presetId

  if (resolvedId === 'classic') {
    // Remove surface overrides — let index.css defaults apply
    SURFACE_VARS.forEach((v) => root.style.removeProperty(v))
    // Apply Classic's own accent (slate), not team color
    const classicPreset = SURFACE_PRESETS.find((p) => p.id === 'classic')!
    applyTeamTheme(classicPreset.accent ?? teamHex)
    return
  }

  let preset: SurfacePreset
  if (resolvedId === 'team' && teamHex) {
    preset = deriveTeamSurface(teamHex)
  } else if (resolvedId === 'team') {
    // No team color — fall back to pitch
    preset = SURFACE_PRESETS.find((p) => p.id === 'pitch')!
  } else {
    preset = SURFACE_PRESETS.find((p) => p.id === resolvedId) ?? SURFACE_PRESETS[0]
  }

  // Apply surface variables
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

  // Apply accent color — overrides --color-primary-* for buttons, XP bar, etc.
  if (preset.accent) {
    applyTeamTheme(preset.accent)
  } else {
    // null accent = keep team color (classic/team presets)
    applyTeamTheme(teamHex)
  }
}

const STORAGE_KEY = 'golazo-surface-theme'

export function loadSurfaceTheme(): string {
  return localStorage.getItem(STORAGE_KEY) ?? 'team'
}

export function saveSurfaceTheme(presetId: string): void {
  localStorage.setItem(STORAGE_KEY, presetId)
}
