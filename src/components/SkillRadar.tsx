import { useApp } from '../contexts/AppContext'
import { categoryAverage } from '../engine/skills'
import type { SkillCategory } from '../engine/types'
import { useTranslation } from 'react-i18next'

const CATEGORIES: SkillCategory[] = ['technical', 'physical', 'tactical', 'mental', 'matchPlay', 'knowledge']

const LABEL_KEYS: Record<SkillCategory, string> = {
  technical: 'skills.technical',
  physical: 'skills.physical',
  tactical: 'skills.tactical',
  mental: 'skills.mental',
  matchPlay: 'skills.matchPlay',
  knowledge: 'skills.knowledge',
}

export function SkillRadar() {
  const { skillTree } = useApp()
  const { t } = useTranslation()

  const values = CATEGORIES.map((cat) => categoryAverage(skillTree, cat))
  const maxVal = 10
  const cx = 150
  const cy = 150
  const r = 110

  // Generate hexagon points for a given radius
  const hexPoints = (radius: number) =>
    CATEGORIES.map((_, i) => {
      const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
    })

  const gridLevels = [2, 4, 6, 8, 10]
  const dataPoints = CATEGORIES.map((_, i) => {
    const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2
    const valR = (values[i] / maxVal) * r
    return [cx + valR * Math.cos(angle), cy + valR * Math.sin(angle)]
  })

  return (
    <div className="card animate-fade-up animate-stagger-2">
      <p className="section-label mb-3">
        {t('dashboard.skills')}
      </p>
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
        {/* Grid lines */}
        {gridLevels.map((level) => {
          const pts = hexPoints((level / maxVal) * r)
          return (
            <polygon
              key={level}
              points={pts.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Axis lines */}
        {CATEGORIES.map((_, i) => {
          const pts = hexPoints(r)
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={pts[i][0]}
              y2={pts[i][1]}
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Data polygon — gradient fill */}
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <polygon
          points={dataPoints.map((p) => p.join(',')).join(' ')}
          fill="url(#radarFill)"
          stroke="var(--color-primary-dark)"
          strokeWidth="2"
        />

        {/* Data points — glowing */}
        {dataPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="6" fill="var(--color-primary-dark)" fillOpacity="0.2" />
            <circle cx={p[0]} cy={p[1]} r="3" fill="var(--color-primary-dark)" />
          </g>
        ))}

        {/* Labels */}
        {CATEGORIES.map((cat, i) => {
          const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2
          const labelR = r + 22
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)
          return (
            <text
              key={cat}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-text-secondary)"
              fontSize="9"
              fontWeight="600"
            >
              {t(LABEL_KEYS[cat])}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
