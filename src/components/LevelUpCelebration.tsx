import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getRank } from '../engine/xp'
import { ConfettiBurst } from './ConfettiBurst'

interface LevelUpCelebrationProps {
  level: number
  onClose: () => void
}

export function LevelUpCelebration({ level, onClose }: LevelUpCelebrationProps) {
  const { t } = useTranslation()
  const rank = getRank(level)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{
        background: visible
          ? 'radial-gradient(circle at 50% 40%, rgba(5,150,105,0.15) 0%, rgba(0,0,0,0.6) 70%)'
          : 'rgba(0,0,0,0)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease, background 0.6s ease',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <ConfettiBurst trigger={visible} />

      <div
        className="flex flex-col items-center gap-3 text-center relative"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.3)',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pulsing rings behind the level number */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full level-up-ring"
            style={{ border: '3px solid var(--color-primary)', opacity: 0.4 }}
          />
          <div
            className="absolute inset-2 rounded-full level-up-ring"
            style={{ border: '2px solid var(--color-primary-light)', opacity: 0.3, animationDelay: '0.4s' }}
          />

          {/* Star emoji burst */}
          <span className="absolute text-4xl level-up-star" style={{ top: -8, right: 8 }}>⭐</span>
          <span className="absolute text-3xl level-up-star" style={{ bottom: 4, left: 0, animationDelay: '0.35s' }}>✨</span>
          <span className="absolute text-2xl level-up-star" style={{ top: 4, left: 12, animationDelay: '0.5s' }}>🌟</span>

          {/* Central level number */}
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-7xl font-black font-data level-up-number" style={{ color: '#fff', textShadow: '0 4px 24px rgba(5,150,105,0.5)' }}>
              {level}
            </p>
          </div>
        </div>

        {/* Title + rank */}
        <p className="text-2xl font-black heading-display level-up-badge" style={{ color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
          {t('levelUp.title')}
        </p>
        <span
          className="px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wider level-up-badge"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(var(--color-primary-rgb), 0.4)',
          }}
        >
          {t(rank.key)}
        </span>

        {/* CTA */}
        <button
          className="btn-primary tap-target mt-4 level-up-btn"
          onClick={onClose}
          style={{ boxShadow: '0 4px 20px rgba(var(--color-primary-rgb), 0.4)' }}
        >
          {t('levelUp.continue')}
        </button>
      </div>
    </div>
  )
}
