/**
 * Accent palettes and separate club-identity colors.
 */

/** Parse hex to RGB tuple */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Lighten a color by mixing with white */
function lighten(rgb: [number, number, number], amount: number): [number, number, number] {
  return rgb.map((c) => Math.round(c + (255 - c) * amount)) as [number, number, number]
}

/** Darken a color by mixing with black */
function darken(rgb: [number, number, number], amount: number): [number, number, number] {
  return rgb.map((c) => Math.round(c * (1 - amount))) as [number, number, number]
}

/** Convert RGB tuple to hex */
function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** Ensure minimum contrast ratio (4.5:1) against white for text usage */
function luminance(rgb: [number, number, number]): number {
  const linear = rgb.map(value => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

function ensureContrast(rgb: [number, number, number]): [number, number, number] {
  let result = rgb
  while (1.05 / (luminance(result) + 0.05) < 4.5) result = darken(result, 0.1)
  return result
}

export function readableClubColor(hex?: string): { background: string; text: string } {
  const background = hex && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hex : '#2548b5'
  const light = luminance(hexToRgb(background))
  return { background, text: 1.05 / (light + 0.05) >= (light + 0.05) / 0.05 ? '#ffffff' : '#000000' }
}

export interface TeamThemeVars {
  '--color-primary': string
  '--color-primary-light': string
  '--color-primary-dark': string
  '--color-primary-darker': string
  '--color-primary-bg': string
  '--color-primary-bg-subtle': string
  '--color-primary-rgb': string
}

/** Generate a full theme palette from a single hex color */
export function generateTeamTheme(primaryHex: string): TeamThemeVars {
  const rgb = hexToRgb(readableClubColor(primaryHex).background)
  const contrastRgb = ensureContrast(rgb)

  return {
    '--color-primary': rgbToHex(contrastRgb),
    '--color-primary-light': rgbToHex(lighten(rgb, 0.25)),
    '--color-primary-dark': rgbToHex(darken(contrastRgb, 0.15)),
    '--color-primary-darker': rgbToHex(darken(contrastRgb, 0.35)),
    '--color-primary-bg': rgbToHex(lighten(rgb, 0.85)),
    '--color-primary-bg-subtle': rgbToHex(lighten(rgb, 0.92)),
    '--color-primary-rgb': `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`,
  }
}

/** Apply team theme CSS variables to the document root */
export function applyTeamTheme(primaryHex: string | undefined): void {
  const root = document.documentElement

  if (!primaryHex) {
    // Reset to defaults by removing overrides
    const vars: (keyof TeamThemeVars)[] = [
      '--color-primary', '--color-primary-light', '--color-primary-dark',
      '--color-primary-darker', '--color-primary-bg', '--color-primary-bg-subtle',
      '--color-primary-rgb',
    ]
    vars.forEach((v) => root.style.removeProperty(v))
    return
  }

  const theme = generateTeamTheme(primaryHex)
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

/** Get the primary team color from a player's teams list */
export function getPrimaryTeamColor(teams?: { isPrimary?: boolean; active: boolean; colors?: string[] }[]): string | undefined {
  if (!teams || teams.length === 0) return undefined
  const primary = teams.find((t) => t.isPrimary && t.active) ?? teams.find((t) => t.active)
  if (!primary?.colors || primary.colors.length === 0) return undefined
  // First color is always the primary/dominant
  const hex = primary.colors[0]
  // Skip white/near-white and black/near-black team colors (not useful as primary)
  const rgb = hexToRgb(hex)
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
  if (brightness > 240 || brightness < 15) {
    // Try second color
    return primary.colors.length > 1 ? primary.colors[1] : undefined
  }
  return hex
}
