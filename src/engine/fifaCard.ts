import type { PlayerProfile, XpState, SkillTree } from './types'
import { getRank } from './xp'
import { fifaCardRatings, overallRating } from './skills'
import i18n from '../i18n'

const COLORS = { ink: '#14243b', paper: '#f3f5f8', coral: '#ff9b7b', blue: '#2447c5', muted: '#56647a', line: '#cad3df', white: '#ffffff' }
const DISPLAY = 'Academy, Outfit, sans-serif'
const BODY = 'Inter, Segoe UI, sans-serif'

function fittedText(context: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, size: number, family = DISPLAY) {
  let fontSize = size
  context.font = `700 ${fontSize}px ${family}`
  while (context.measureText(value).width > width && fontSize > 14) context.font = `700 ${--fontSize}px ${family}`
  // Canvas' maxWidth handles unusually long unbroken names without cropping.
  context.fillText(value, x, y, width)
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Player image could not be loaded for export'))
    image.src = source
  })
}

/** Keep the existing export API while drawing the original Academy credential. */
export async function renderFifaCard(
  profile: PlayerProfile,
  xp: XpState,
  skillTree: SkillTree,
  stats: { matches: number; goals: number; assists: number },
): Promise<Blob> {
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = 660
  canvas.height = 880
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.fillStyle = COLORS.paper
  ctx.fillRect(0, 0, 660, 880)
  ctx.fillStyle = COLORS.ink
  ctx.fillRect(0, 0, 660, 358)
  ctx.fillStyle = COLORS.white
  fittedText(ctx, 'golazo.', 40, 63, 280, 34)
  ctx.fillStyle = COLORS.coral
  fittedText(ctx, String(profile.jerseyNumber ?? 'G'), 526, 76, 90, 58)
  ctx.fillStyle = COLORS.white
  fittedText(ctx, i18n.t('academy.playerRecord'), 40, 117, 570, 16, BODY)
  fittedText(ctx, profile.name, 40, 187, profile.photoUrl ? 405 : 570, 44)
  ctx.fillStyle = '#c5d0df'
  fittedText(ctx, profile.positions?.join(' / ') ?? '', 40, 226, 420, 20, BODY)
  const team = profile.teams?.find(item => item.active && item.isPrimary)?.name || profile.team
  fittedText(ctx, [team, profile.city].filter(Boolean).join(' · '), 40, 272, 570, 20, BODY)
  fittedText(ctx, `${i18n.t(getRank(xp.level).key)} · ${Math.round(overallRating(skillTree) * 10)}`, 40, 319, 570, 19, BODY)
  if (profile.photoUrl) {
    const image = await loadImage(profile.photoUrl)
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 478, 137, 142, 112)
  }
  fifaCardRatings(skillTree).forEach((item, index) => {
    const x = 40 + index % 3 * 204
    const y = 408 + Math.floor(index / 3) * 123
    ctx.fillStyle = COLORS.muted
    fittedText(ctx, i18n.t(`skills.${item.category}`), x, y, 176, 16, BODY)
    ctx.fillStyle = COLORS.ink
    fittedText(ctx, String(item.rating * 10), x, y + 45, 170, 38)
    ctx.fillStyle = COLORS.line
    ctx.fillRect(x, y + 62, 172, 5)
    ctx.fillStyle = COLORS.blue
    ctx.fillRect(x, y + 62, 172 * item.rating / 10, 5)
  })
  ctx.strokeStyle = COLORS.line
  ctx.beginPath(); ctx.moveTo(40, 625); ctx.lineTo(620, 625); ctx.stroke()
  const summary = [{ value: stats.matches, label: 'dashboard.matches' }, { value: stats.goals, label: 'dashboard.goals' }, { value: stats.assists, label: 'dashboard.assists' }]
  summary.forEach((item, index) => {
    const x = 40 + index * 204
    ctx.fillStyle = COLORS.muted
    fittedText(ctx, i18n.t(item.label), x, 664, 175, 16, BODY)
    ctx.fillStyle = COLORS.ink
    fittedText(ctx, String(item.value), x, 704, 175, 34)
  })
  ctx.fillStyle = COLORS.blue
  fittedText(ctx, `${i18n.t('dashboard.level', { level: xp.level })} · ${xp.totalXp} XP`, 40, 766, 580, 24)
  ctx.fillStyle = COLORS.muted
  fittedText(ctx, i18n.t('clubhouse.xpMeaning'), 40, 804, 580, 16, BODY)
  fittedText(ctx, 'golazo.naurolabs.com', 40, 850, 580, 15, BODY)
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob)
    else reject(new Error('Player record image could not be encoded'))
  }, 'image/png'))
}
