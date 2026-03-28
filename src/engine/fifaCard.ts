import type { PlayerProfile, XpState, SkillTree } from '../engine/types'
import { getRank } from './xp'
import { fifaCardRatings, overallRating } from './skills'

const CARD_W = 400
const CARD_H = 560

const RANK_COLORS: Record<string, [string, string]> = {
  bronze: ['#cd7f32', '#a0622a'],
  silver: ['#94a3b8', '#cbd5e1'],
  gold: ['#f59e0b', '#fbbf24'],
  diamond: ['#3b82f6', '#60a5fa'],
  platinum: ['#8b5cf6', '#c4b5fd'],
}

const FIFA_LABELS: Record<string, string> = {
  technical: 'TEC', physical: 'PHY', tactical: 'TAC',
  mental: 'MEN', matchPlay: 'MAT', knowledge: 'KNO',
}

/**
 * Render a FIFA-style player card to a canvas and return it as a Blob.
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
  const colors = RANK_COLORS[rank.color] ?? RANK_COLORS.bronze
  const ratings = fifaCardRatings(skillTree)
  const overall = Math.round(overallRating(skillTree) * 10)

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H)
  bg.addColorStop(0, colors[0])
  bg.addColorStop(1, colors[1])
  ctx.fillStyle = bg
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 24)
  ctx.fill()

  // ── Inner card (slightly darker overlay) ──
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  roundRect(ctx, 12, 12, CARD_W - 24, CARD_H - 24, 16)
  ctx.fill()

  // ── Photo circle ──
  const photoY = 60
  const photoR = 64
  ctx.save()
  ctx.beginPath()
  ctx.arc(CARD_W / 2, photoY + photoR, photoR, 0, Math.PI * 2)
  ctx.clip()
  if (profile.photoUrl) {
    const img = await loadImage(profile.photoUrl)
    ctx.drawImage(img, CARD_W / 2 - photoR, photoY, photoR * 2, photoR * 2)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⚽', CARD_W / 2, photoY + photoR + 16)
  }
  ctx.restore()

  // ── Overall rating (top-left) ──
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 56px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(String(overall), 30, 110)

  // ── Position (below rating) ──
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(profile.positions?.[0] ?? 'CM', 34, 132)

  // ── Player name ──
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(profile.name.toUpperCase(), CARD_W / 2, 220)

  // ── Team ──
  ctx.font = '14px "Plus Jakarta Sans", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText(profile.team || '', CARD_W / 2, 244)

  // ── Divider ──
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(40, 262)
  ctx.lineTo(CARD_W - 40, 262)
  ctx.stroke()

  // ── Skill ratings (3x2 grid) ──
  const skillStartY = 280
  const colW = (CARD_W - 80) / 3
  ratings.forEach((r, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 40 + col * colW + colW / 2
    const y = skillStartY + row * 60

    // Rating number
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(r.rating * 10), x, y)

    // Label
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText(FIFA_LABELS[r.category] ?? r.category, x, y + 18)
  })

  // ── Season stats bar ──
  const statsY = 420
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath()
  ctx.moveTo(40, statsY - 12)
  ctx.lineTo(CARD_W - 40, statsY - 12)
  ctx.stroke()

  const statItems = [
    { value: stats.matches, label: 'MAT' },
    { value: stats.goals, label: 'GOL' },
    { value: stats.assists, label: 'AST' },
  ]
  const statColW = (CARD_W - 80) / 3
  statItems.forEach((s, i) => {
    const x = 40 + i * statColW + statColW / 2
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(s.value), x, statsY + 12)
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText(s.label, x, statsY + 28)
  })

  // ── Level badge ──
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  roundRect(ctx, CARD_W / 2 - 50, 470, 100, 28, 14)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`LV.${xp.level} · ${xp.totalXp.toLocaleString()} XP`, CARD_W / 2, 489)

  // ── Golazo branding ──
  ctx.font = '10px "Plus Jakarta Sans", sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText('golazo.naurolabs.com', CARD_W / 2, CARD_H - 20)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
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
