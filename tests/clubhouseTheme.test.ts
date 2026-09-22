import { afterEach, describe, expect, it } from 'vitest'
import { applySurfaceTheme, deriveTeamSurface, loadSurfaceTheme } from '../src/utils/surfaceTheme'
import { generateTeamTheme, readableClubColor } from '../src/utils/teamTheme'

function luminance(hex: string) {
  const value = hex.length === 4 ? '#' + hex.slice(1).split('').map(c => c + c).join('') : hex
  const rgb = [1, 3, 5].map(start => {
    const channel = parseInt(value.slice(start, start + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
}
afterEach(() => { localStorage.clear(); document.documentElement.removeAttribute('style') })
describe('Clubhouse default and separate club identity', () => {
  it('defaults to cobalt actions on neutral surfaces, not green or club tinting', () => {
    expect(loadSurfaceTheme()).toBe('clubhouse')
    applySurfaceTheme(loadSurfaceTheme(), '#00ff00')
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#2548b5')
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#F4F5F7')
    expect(document.documentElement.style.getPropertyValue('--color-glass')).toBe('#FFFFFF')
  })
  it.each(['#ffffff', '#000000', '#ffff00', '#00ff00', '#f8f', '#123456'])('keeps %s readable on identity geometry without recoloring every surface', color => {
    const club = readableClubColor(color)
    const contrast = (Math.max(luminance(club.background), luminance(club.text)) + .05) / (Math.min(luminance(club.background), luminance(club.text)) + .05)
    expect(club.background).toBe(color)
    expect(contrast).toBeGreaterThanOrEqual(4.5)
    const theme = deriveTeamSurface(color)
    expect(theme.bg).toBe('#F4F5F7')
    expect(theme.accent).toBe('#2548B5')
    const action = generateTeamTheme(color)['--color-primary']
    expect(1.05 / (luminance(action) + .05)).toBeGreaterThanOrEqual(4.5)
  })
  it('preserves an explicitly chosen alternate preset rather than banning green', () => {
    localStorage.setItem('golazo-surface-theme', 'pitch')
    expect(loadSurfaceTheme()).toBe('pitch')
    applySurfaceTheme(loadSurfaceTheme())
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#F0F9F1')
  })
})
