import { useState, useEffect, useRef } from 'react'

/**
 * Animate a number from 0 to target over a duration.
 * Returns the current animated value.
 */
export function useCountUp(target: number, duration = 600, delay = 0): number {
  const [value, setValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    if (target === 0) { setValue(0); return }

    const timeout = setTimeout(() => {
      startTime.current = null

      function tick(now: number) {
        if (!startTime.current) startTime.current = now
        const elapsed = now - startTime.current
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))

        if (progress < 1) {
          rafId.current = requestAnimationFrame(tick)
        }
      }

      rafId.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(rafId.current)
    }
  }, [target, duration, delay])

  return value
}
