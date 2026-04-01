interface StatDisplayProps {
  value: string | number
  label: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { number: 'text-lg', label: 'text-xs' },
  md: { number: 'text-2xl', label: 'stat-label' },
  lg: { number: 'text-4xl', label: 'stat-label' },
}

export function StatDisplay({ value, label, color, size = 'md' }: StatDisplayProps) {
  const s = sizeMap[size]
  return (
    <div className="text-center">
      <p
        className={`font-black font-data leading-none ${s.number}`}
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      <p className={s.label}>{label}</p>
    </div>
  )
}
