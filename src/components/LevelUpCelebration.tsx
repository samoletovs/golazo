import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getRank } from '../engine/xp'

interface LevelUpCelebrationProps {
  level: number
  onClose: () => void
}

export function LevelUpCelebration({ level, onClose }: LevelUpCelebrationProps) {
  const { t } = useTranslation()
  const rank = getRank(level)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true))
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex flex-col items-center gap-4 p-8 rounded-3xl text-center"
        style={{
          background: '#fff',
          transform: visible ? 'scale(1)' : 'scale(0.5)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: 320,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-5xl animate-float">🎉</span>
        <p className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-dark)' }}>
          {t('levelUp.title')}
        </p>
        <p className="stat-number text-gradient-green" style={{ fontSize: '3rem' }}>
          {level}
        </p>
        <p className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>
          {t(rank.key)}
        </p>
        <button className="btn-primary tap-target mt-2" onClick={onClose}>
          {t('levelUp.continue')}
        </button>
      </div>
    </div>
  )
}
