import type { ReactNode } from 'react'

interface CardProps {
  variant?: 'default' | 'glow' | 'gold' | 'hero' | 'stat'
  statColor?: 'green' | 'gold' | 'cyan'
  className?: string
  children: ReactNode
}

const variantClass: Record<string, string> = {
  default: 'card',
  glow: 'card-glow',
  gold: 'card-gold',
  hero: 'card-hero',
  stat: 'stat-card',
}

export function Card({ variant = 'default', statColor, className = '', children }: CardProps) {
  const base = variantClass[variant] ?? 'card'
  const color = variant === 'stat' && statColor ? `stat-card-${statColor}` : ''
  return (
    <div className={`${base} ${color} ${className}`.trim()}>
      {children}
    </div>
  )
}
