import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '../src/i18n'
import { AppProvider } from '../src/contexts/AppContext'
import { SkillRadar } from '../src/components/SkillRadar'

/**
 * Integration test for SkillRadar — verifies it renders correctly when
 * wired up to the real AppContext (skill tree data + i18n), rather than
 * testing the SVG geometry in isolation.
 */
describe('SkillRadar integration', () => {
  beforeEach(() => {
    // AppProvider fetches '/api/sync' on mount — stub it so tests stay offline/deterministic
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  })

  it('renders within AppProvider and shows all trainable category labels', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <SkillRadar />
        </AppProvider>,
      )
    })

    expect(screen.getByText('My Skills')).toBeInTheDocument()

    // One label per trainable skill category (technical, physical, tactical, mental, knowledge)
    const labels = ['Technical', 'Physical', 'Tactical', 'Mental', 'Knowledge']
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders one data point per category for a freshly created skill tree', async () => {
    await act(async () => {
      render(
        <AppProvider>
          <SkillRadar />
        </AppProvider>,
      )
    })

    // 5 trainable categories × 2 circles (glow + point) = 10 <circle> elements
    const circles = document.querySelectorAll('svg circle')
    expect(circles.length).toBe(10)
  })
})
