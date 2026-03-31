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
    // Pure white — Apple-clean, zero personality
    id: 'classic',
    bg: '#F8F8FA',
    bgWarm: '#F3F3F5',
    surface: '#ffffff',
    borderTint: 'rgba(0, 0, 0, 0.06)',
    surfaceHover: '#F7F7F9',
    surfaceActive: 'rgba(0, 0, 0, 0.03)',
    headerBg: 'rgba(248, 248, 250, 0.90)',
    navBg: 'rgba(255, 255, 255, 0.92)',
    choiceBg: '#ffffff',
    choiceBorder: 'rgba(0, 0, 0, 0.08)',
    accent: '#475569',
    swatch: ['#C8C8D0', '#E8E8EC', '#F8F8FA'],
  },
  {
    // Dynamic — derived from club primary color
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
    // Fresh grass — football pitch energy
    id: 'pitch',
    bg: '#F0F9F1',
    bgWarm: '#E4F3E6',
    surface: '#F7FBF7',
    borderTint: 'rgba(34, 197, 94, 0.10)',
    surfaceHover: '#EDF7EE',
    surfaceActive: 'rgba(34, 197, 94, 0.06)',
    headerBg: 'rgba(240, 249, 241, 0.90)',
    navBg: 'rgba(247, 251, 247, 0.93)',
    choiceBg: '#F7FBF7',
    choiceBorder: 'rgba(34, 197, 94, 0.12)',
    accent: '#16A34A',
    swatch: ['#22C55E', '#86EFAC', '#E4F3E6'],
  },
  {
    // Deep blue — ocean calm, focus mode
    id: 'ocean',
    bg: '#EEF4FB',
    bgWarm: '#E1ECF8',
    surface: '#F5F8FC',
    borderTint: 'rgba(37, 99, 235, 0.09)',
    surfaceHover: '#ECF2FA',
    surfaceActive: 'rgba(37, 99, 235, 0.05)',
    headerBg: 'rgba(238, 244, 251, 0.90)',
    navBg: 'rgba(245, 248, 252, 0.93)',
    choiceBg: '#F5F8FC',
    choiceBorder: 'rgba(37, 99, 235, 0.12)',
    accent: '#2563EB',
    swatch: ['#2563EB', '#93C5FD', '#E1ECF8'],
  },
  {
    // Warm amber — golden hour, sunset energy
    id: 'sunset',
    bg: '#FBF5EE',
    bgWarm: '#F7EDE0',
    surface: '#FDF9F5',
    borderTint: 'rgba(217, 119, 6, 0.09)',
    surfaceHover: '#F9F2EC',
    surfaceActive: 'rgba(217, 119, 6, 0.05)',
    headerBg: 'rgba(251, 245, 238, 0.90)',
    navBg: 'rgba(253, 249, 245, 0.93)',
    choiceBg: '#FDF9F5',
    choiceBorder: 'rgba(217, 119, 6, 0.12)',
    accent: '#D97706',
    swatch: ['#D97706', '#FCD34D', '#F7EDE0'],
  },
  {
    // Soft purple — creative, playful
    id: 'lavender',
    bg: '#F3F0FA',
    bgWarm: '#EAE4F6',
    surface: '#F8F6FC',
    borderTint: 'rgba(124, 58, 237, 0.09)',
    surfaceHover: '#F0EDF8',
    surfaceActive: 'rgba(124, 58, 237, 0.05)',
    headerBg: 'rgba(243, 240, 250, 0.90)',
    navBg: 'rgba(248, 246, 252, 0.93)',
    choiceBg: '#F8F6FC',
    choiceBorder: 'rgba(124, 58, 237, 0.12)',
    accent: '#7C3AED',
    swatch: ['#7C3AED', '#C4B5FD', '#EAE4F6'],
  },
  {
    // Warm neutral — earthy, mature, sand dune
    id: 'sand',
    bg: '#FAF7F2',
    bgWarm: '#F5F0E6',
    surface: '#FCFAF7',
    borderTint: 'rgba(180, 130, 60, 0.09)',
    surfaceHover: '#F7F4EF',
    surfaceActive: 'rgba(180, 130, 60, 0.05)',
    headerBg: 'rgba(250, 247, 242, 0.90)',
    navBg: 'rgba(252, 250, 247, 0.93)',
    choiceBg: '#FCFAF7',
    choiceBorder: 'rgba(180, 130, 60, 0.12)',
    accent: '#B4823C',
    swatch: ['#B4823C', '#E8D5B0', '#F5F0E6'],
  },
  {
    // Soft rose — warm pink, creative feminine
    id: 'rose',
    bg: '#FBF0F3',
    bgWarm: '#F7E3E9',
    surface: '#FDF6F8',
    borderTint: 'rgba(219, 39, 119, 0.08)',
    surfaceHover: '#F9EDF1',
    surfaceActive: 'rgba(219, 39, 119, 0.05)',
    headerBg: 'rgba(251, 240, 243, 0.90)',
    navBg: 'rgba(253, 246, 248, 0.93)',
    choiceBg: '#FDF6F8',
    choiceBorder: 'rgba(219, 39, 119, 0.10)',
    accent: '#DB2777',
    swatch: ['#DB2777', '#F9A8D4', '#F7E3E9'],
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

  if (presetId === 'classic') {
    // Remove surface overrides — let index.css defaults apply
    SURFACE_VARS.forEach((v) => root.style.removeProperty(v))
    // Apply Classic's own accent (slate), not team color
    const classicPreset = SURFACE_PRESETS.find((p) => p.id === 'classic')!
    applyTeamTheme(classicPreset.accent ?? teamHex)
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
