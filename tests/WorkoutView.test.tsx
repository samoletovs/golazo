import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../src/i18n'
import { WorkoutView } from '../src/components/WorkoutView'
import type { ProgramDay } from '../src/engine/types'

const day: ProgramDay = {
  dayNumber: 1,
  titleKey: 'prog.ballMastery.title',
  totalDurationMin: 30,
  warmup: { durationMin: 5, descriptionKey: 'prog.warmup.dynamic' },
  exercises: [
    { exerciseId: 'tech-01', sets: 3, reps: 10 },
    { exerciseId: 'tech-02', durationMin: 10, coachNoteKey: 'prog.warmup.ballwork' },
  ],
  cooldown: { durationMin: 5, descriptionKey: 'prog.cooldown.stretch' },
}

/**
 * Integration test for WorkoutView — verifies the full workout flow renders
 * (warmup, exercises, cooldown) and that completing a workout with a rating
 * calls onComplete with the selected rating.
 */
describe('WorkoutView integration', () => {
  it('renders warmup, exercises and cooldown sections', () => {
    render(
      <WorkoutView
        weekNumber={1}
        weekFocusKey="prog.week.foundation"
        day={day}
        onComplete={() => {}}
        isCompleted={false}
        alreadyLoggedToday={false}
      />,
    )

    expect(screen.getByText(/Warm-up/)).toBeInTheDocument()
    expect(screen.getByText(/Cool-down/)).toBeInTheDocument()
    expect(screen.getByText('Complete workout (+20 XP)')).toBeInTheDocument()
  })

  it('shows the completed state when the day is already logged', () => {
    render(
      <WorkoutView
        weekNumber={1}
        day={day}
        onComplete={() => {}}
        isCompleted={true}
        alreadyLoggedToday={false}
      />,
    )

    expect(screen.getByText('Workout complete! Great job.')).toBeInTheDocument()
    expect(screen.queryByText('Complete workout (+20 XP)')).not.toBeInTheDocument()
  })

  it('prompts for a rating then calls onComplete with the chosen rating', () => {
    const onComplete = vi.fn()
    render(
      <WorkoutView
        weekNumber={1}
        day={day}
        onComplete={onComplete}
        isCompleted={false}
        alreadyLoggedToday={false}
      />,
    )

    fireEvent.click(screen.getByText('Complete workout (+20 XP)'))
    expect(screen.getByText('How was this workout?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '🔥' }))
    expect(onComplete).toHaveBeenCalledWith(5)
  })

  it('calls onComplete with no rating when skipped', () => {
    const onComplete = vi.fn()
    render(
      <WorkoutView
        weekNumber={1}
        day={day}
        onComplete={onComplete}
        isCompleted={false}
        alreadyLoggedToday={false}
      />,
    )

    fireEvent.click(screen.getByText('Complete workout (+20 XP)'))
    fireEvent.click(screen.getByText('Skip rating'))
    expect(onComplete).toHaveBeenCalledWith()
  })
})
