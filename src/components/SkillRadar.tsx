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
    <div className="card">
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
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
              stroke="var(--color-pitch-line)"
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
              stroke="var(--color-pitch-line)"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Data polygon */}
        <polygon
          points={dataPoints.map((p) => p.join(',')).join(' ')}
          fill="var(--color-pitch-green)"
          fillOpacity="0.3"
          stroke="var(--color-pitch-green-light)"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--color-pitch-green-light)" />
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
            >
              {t(LABEL_KEYS[cat])}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
