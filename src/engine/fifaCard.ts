import type { PlayerProfile, XpState, SkillTree } from '../engine/types'
import { getRank } from './xp'
import { fifaCardRatings, overallRating } from './skills'

const CARD_W = 440
const CARD_H = 620

/** Each rank has: [bg dark, bg light, accent, text contrast] */
const RANK_PALETTES: Record<string, { bg: [string, string]; accent: string; shine: string }> = {
  bronze: { bg: ['#1a1410', '#2d2218'], accent: '#cd7f32', shine: 'rgba(205,127,50,0.35)' },
  silver: { bg: ['#141820', '#1e2530'], accent: '#94a3b8', shine: 'rgba(148,163,184,0.3)' },
  gold:   { bg: ['#1a1408', '#2d2410'], accent: '#f59e0b', shine: 'rgba(245,158,11,0.35)' },
  diamond:{ bg: ['#0c1424', '#142038'], accent: '#3b82f6', shine: 'rgba(59,130,246,0.3)' },
  platinum:{ bg: ['#18102a', '#241840'], accent: '#8b5cf6', shine: 'rgba(139,92,246,0.3)' },
}

const FIFA_LABELS: Record<string, string> = {
  technical: 'TEC', physical: 'PHY', tactical: 'TAC',
  mental: 'MEN', performance: 'PER', knowledge: 'KNO',
}

const FONT = '"Inter", "Plus Jakarta Sans", system-ui, sans-serif'
const FONT_DATA = '"JetBrains Mono", "SF Mono", monospace'

/**
 * Render a premium FIFA-style player card to a canvas and return it as a Blob.
 */
export async function renderFifaCard(
  profile: PlayerProfile,
  xp: XpState,
  skillTree: SkillTree,
  stats: { matches: number; goals: number; assists: number },
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const rank = getRank(xp.level)
  const palette = RANK_PALETTES[rank.color] ?? RANK_PALETTES.bronze
  const ratings = fifaCardRatings(skillTree)
  const overall = Math.round(overallRating(skillTree) * 10)

  // ── 1. Dark card background with subtle gradient ──
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
  bg.addColorStop(0, palette.bg[1])
  bg.addColorStop(1, palette.bg[0])
  ctx.fillStyle = bg
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 28)
  ctx.fill()

  // ── 2. Radial shine (top-center highlight) ──
  const shine = ctx.createRadialGradient(CARD_W / 2, 80, 20, CARD_W / 2, 80, 280)
  shine.addColorStop(0, palette.shine)
  shine.addColorStop(1, 'transparent')
  ctx.fillStyle = shine
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 28)
  ctx.fill()

  // ── 3. Subtle diagonal stripe texture ──
  ctx.save()
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 28)
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'
  ctx.lineWidth = 1
  for (let i = -CARD_H; i < CARD_W + CARD_H; i += 12) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + CARD_H, CARD_H)
    ctx.stroke()
  }
  ctx.restore()

  // ── 4. Card border (accent colored, subtle) ──
  ctx.strokeStyle = palette.accent + '40' // 25% opacity
  ctx.lineWidth = 1.5
  roundRect(ctx, 1, 1, CARD_W - 2, CARD_H - 2, 28)
  ctx.stroke()

  // ── 5. Inner border line ──
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  roundRect(ctx, 16, 16, CARD_W - 32, CARD_H - 32, 18)
  ctx.stroke()

  // ── 6. Overall rating (top-left) ──
  ctx.textAlign = 'left'
  ctx.fillStyle = palette.accent
  ctx.font = `900 64px ${FONT}`
  ctx.fillText(String(overall), 36, 80)

  // Position badge (below rating)
  ctx.font = `800 13px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.letterSpacing = '2px'
  ctx.fillText((profile.positions?.[0] ?? 'CM').toUpperCase(), 40, 100)
  ctx.letterSpacing = '0px'

  // Rank label (below position)
  ctx.font = `700 11px ${FONT}`
  ctx.fillStyle = palette.accent + 'cc'
  ctx.fillText(rank.key.replace('rank.', '').toUpperCase(), 40, 118)

  // ── 7. Photo (right side of hero zone) ──
  const photoCX = CARD_W - 100
  const photoCY = 80
  const photoR = 50
  // Outer ring (accent glow)
  ctx.beginPath()
  ctx.arc(photoCX, photoCY, photoR + 4, 0, Math.PI * 2)
  ctx.strokeStyle = palette.accent + '60'
  ctx.lineWidth = 2
  ctx.stroke()
  // Photo clip
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2)
  ctx.clip()
  if (profile.photoUrl) {
    const img = await loadImage(profile.photoUrl)
    ctx.drawImage(img, photoCX - photoR, photoCY - photoR, photoR * 2, photoR * 2)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = `40px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText('⚽', photoCX, photoCY + 14)
  }
  ctx.restore()

  // ── 8. Decorative divider ──
  const divY = 148
  drawOrnamentDivider(ctx, 36, CARD_W - 36, divY, palette.accent)

  // ── 9. Player name (centered, prominent) ──
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 30px ${FONT}`
  const displayName = profile.name.toUpperCase()
  ctx.fillText(displayName, CARD_W / 2, divY + 38)

  // Team + location line
  const infoLine = [profile.team, profile.city].filter(Boolean).join(' · ')
  if (infoLine) {
    ctx.font = `500 13px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fillText(infoLine, CARD_W / 2, divY + 58)
  }

  // ── 10. Skill ratings (3×2 structured grid in panels) ──
  const gridY = divY + 80
  const gridPad = 32
  const cellW = (CARD_W - gridPad * 2 - 16) / 3
  const cellH = 64
  const cellGap = 8

  ratings.forEach((r, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = gridPad + col * (cellW + cellGap)
    const y = gridY + row * (cellH + cellGap)

    // Cell background
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    roundRect(ctx, x, y, cellW, cellH, 10)
    ctx.fill()

    // Top accent stripe
    ctx.fillStyle = palette.accent + '50'
    roundRect(ctx, x, y, cellW, 3, 10)
    ctx.fill()

    // Rating value
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 28px ${FONT_DATA}`
    ctx.textAlign = 'center'
    ctx.fillText(String(r.rating * 10), x + cellW / 2, y + 35)

    // Category label
    ctx.font = `700 10px ${FONT}`
    ctx.fillStyle = palette.accent
    ctx.letterSpacing = '1.5px'
    ctx.fillText(FIFA_LABELS[r.category] ?? r.category, x + cellW / 2, y + 52)
    ctx.letterSpacing = '0px'
  })

  // ── 11. Divider before stats ──
  const statsDiv = gridY + 2 * (cellH + cellGap) + 12
  drawOrnamentDivider(ctx, 36, CARD_W - 36, statsDiv, palette.accent)

  // ── 12. Season stats ──
  const statsY = statsDiv + 28
  const statItems = [
    { value: stats.matches, label: 'MATCHES' },
    { value: stats.goals, label: 'GOALS' },
    { value: stats.assists, label: 'ASSISTS' },
  ]
  const statColW = (CARD_W - 64) / 3
  statItems.forEach((s, i) => {
    const x = 32 + i * statColW + statColW / 2
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 26px ${FONT_DATA}`
    ctx.textAlign = 'center'
    ctx.fillText(String(s.value), x, statsY + 4)
    ctx.font = `600 9px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.letterSpacing = '1.5px'
    ctx.fillText(s.label, x, statsY + 20)
    ctx.letterSpacing = '0px'
  })

  // ── 13. Level badge (pill) ──
  const badgeY = statsY + 42
  const badgeText = `LV ${xp.level}  ·  ${xp.totalXp.toLocaleString()} XP`
  ctx.font = `700 11px ${FONT_DATA}`
  const badgeW = ctx.measureText(badgeText).width + 28
  const badgeX = CARD_W / 2 - badgeW / 2

  ctx.fillStyle = palette.accent + '20'
  roundRect(ctx, badgeX, badgeY, badgeW, 26, 13)
  ctx.fill()
  ctx.strokeStyle = palette.accent + '40'
  ctx.lineWidth = 1
  roundRect(ctx, badgeX, badgeY, badgeW, 26, 13)
  ctx.stroke()

  ctx.fillStyle = palette.accent
  ctx.font = `700 11px ${FONT_DATA}`
  ctx.textAlign = 'center'
  ctx.fillText(badgeText, CARD_W / 2, badgeY + 17)

  // ── 14. Branding ──
  ctx.font = `500 10px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.textAlign = 'center'
  ctx.fillText('golazo.naurolabs.com', CARD_W / 2, CARD_H - 18)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

/** Decorative divider with center diamond ornament */
function drawOrnamentDivider(
  ctx: CanvasRenderingContext2D,
  x1: number, x2: number, y: number,
  accentColor: string,
) {
  const mid = (x1 + x2) / 2

  // Left line
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(mid - 14, y)
  ctx.stroke()

  // Center diamond
  ctx.fillStyle = accentColor + '80'
  ctx.beginPath()
  ctx.moveTo(mid, y - 4)
  ctx.lineTo(mid + 4, y)
  ctx.lineTo(mid, y + 4)
  ctx.lineTo(mid - 4, y)
  ctx.closePath()
  ctx.fill()

  // Right line
  ctx.beginPath()
  ctx.moveTo(mid + 14, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
