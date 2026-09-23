import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { AppProvider } from '../src/contexts/AppContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import { PersonalGoals } from '../src/components/PersonalGoals'
import { AchievementsList } from '../src/components/AchievementsList'
import { CoachCard } from '../src/components/CoachCard'
import i18n from '../src/i18n'
import type { ReactNode } from 'react'

function mount(children: ReactNode) {
  return render(<AppProvider><ToastProvider>{children}</ToastProvider></AppProvider>)
}
beforeEach(async () => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await i18n.changeLanguage('en')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Academy supporting player controls', () => {
  it('keeps all 17 achievement definitions readable behind an accessible disclosure', () => {
    mount(<AchievementsList />)
    fireEvent.click(screen.getByText(i18n.t('academy.achievementCollection', { count: 17 })))
    expect(screen.getAllByRole('listitem')).toHaveLength(17)
    expect(screen.getAllByRole('progressbar')).toHaveLength(17)
    for (const row of screen.getAllByRole('listitem')) expect(within(row).getByRole('heading')).toBeInTheDocument()
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument()
  })

  it('retains a personal-goal draft after storage failure and saves it on retry', () => {
    mount(<PersonalGoals />)
    fireEvent.click(screen.getByText(i18n.t('goals.add'), { selector: 'summary' }))
    const input = screen.getByLabelText(i18n.t('goals.titlePlaceholder'))
    fireEvent.change(input, { target: { value: 'Practise receiving with both feet' } })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Synthetic storage failure', 'QuotaExceededError') })
    fireEvent.click(screen.getByRole('button', { name: i18n.t('goals.add') }))
    expect(input).toHaveValue('Practise receiving with both feet')
    expect(screen.getByText(i18n.t('academy.saveError'))).toBeInTheDocument()
    write.mockRestore()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('goals.add') }))
    const state = JSON.parse(localStorage.getItem('golazo-state') ?? '{}')
    expect(state.personalGoals).toHaveLength(1)
    expect(state.personalGoals[0].title).toBe('Practise receiving with both feet')
  })

  it('does not present offline calculated advice as an AI response and permits an explicit retry', async () => {
    mount(<CoachCard />)
    expect(screen.getByRole('heading', { name: i18n.t('academy.localPracticeTitle') })).toBeInTheDocument()
    expect(screen.getByText(i18n.t('academy.localPracticeSource'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('coach.getAiAdvice') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('academy.coachUnavailable'))
    expect(screen.getByRole('button', { name: i18n.t('academy.retry') })).toBeEnabled()
    expect(screen.getByRole('heading', { name: i18n.t('academy.localPracticeTitle') })).toBeInTheDocument()
  })
})
