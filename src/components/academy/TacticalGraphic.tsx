import type { Position } from '../../engine/types'

interface Props {
  kind?: 'touch' | 'pass' | 'turn' | 'position'
  position?: Position
  className?: string
}

const POSITIONS: Record<Position, [number, number]> = {
  GK: [160, 208], CB: [160, 182], LB: [60, 182], RB: [260, 182], CDM: [160, 157], CM: [160, 124],
  CAM: [160, 89], LM: [60, 124], RM: [260, 124], LW: [60, 62], RW: [260, 62], ST: [160, 52],
}

export function TacticalGraphic({ kind = 'touch', position = 'CM', className = '' }: Props) {
  const [x, y] = POSITIONS[position]
  return <div className={`academy-tactical ${className}`} aria-hidden="true">
    <svg viewBox="0 0 320 250">
      {kind === 'position' ? <>
        <g className="tactical-grid"><rect x="20" y="23" width="280" height="204" /><path d="M20 124h280" /><circle cx="160" cy="124" r="43" /><path d="M112 23v33h96V23M112 227v-33h96v33" /></g>
        <circle className="tactical-marker" cx={x} cy={y} r="24" /><circle className="tactical-path" cx={x} cy={y} r="34" />
        <text className="tactical-label" x={x} y={y + 5} textAnchor="middle">{position}</text>
      </> : <>
        <g className="tactical-grid"><path d="M20 65V22h43m194 0h43v43M20 186v43h43m194 0h43v-43" /><path d="M106 22v207M214 22v207M20 91h280M20 160h280" strokeDasharray="2 7" /></g>
        {kind === 'touch' && <><path className="tactical-marker" d="m194 86 10 18h-20Zm69 47 10 18h-20Z" /><path className="tactical-path" d="M55 183 149 149" strokeDasharray="6 7" /><path className="tactical-path" d="M156 145Q185 120 235 70m-16 4 18-7-5 19" /></>}
        {kind === 'pass' && <><path className="tactical-marker" d="M276 50h16v149h-16Z" /><path className="tactical-path" d="M55 177 269 79 159 180" strokeDasharray="7 6" /><path className="tactical-path" d="m175 165-20 19 5-23" /></>}
        {kind === 'turn' && <><path className="tactical-marker" d="m100 101 10 18H90Zm129 10 10 18h-20Z" /><path className="tactical-path" d="M55 171C105 229 167 152 160 106S68 48 65 104s81 119 164 80 22-143-18-121m12-12-17 13 23 1" /></>}
        <circle className="tactical-player" cx="55" cy={kind === 'touch' ? 183 : 175} r="14" />
        <circle className="tactical-marker" cx={kind === 'pass' ? 269 : kind === 'turn' ? 210 : 238} cy={kind === 'pass' ? 79 : 67} r="14" />
      </>}
    </svg>
  </div>
}
