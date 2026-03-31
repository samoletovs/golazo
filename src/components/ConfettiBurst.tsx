import { useState, useEffect } from 'react'

const CONFETTI_COLORS = ['var(--color-primary)', '#fbbf24', 'var(--color-primary-light)', '#ef4444', '#8b5cf6', '#ec4899']
const PARTICLE_COUNT = 24

interface Particle {
  id: number
  x: number
  color: string
  delay: number
  size: number
  drift: number
}

/**
 * CSS-only confetti burst overlay.
 * Shows for ~2 seconds then auto-hides.
 */
export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!trigger) return
    const ps: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // 20-80% horizontal spread
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
      size: 4 + Math.random() * 4,
      drift: -30 + Math.random() * 60,
    }))
    setParticles(ps)
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(timer)
  }, [trigger])

  if (!visible || particles.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-8px',
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            opacity: 0,
            animation: `confetti-fall 2s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
