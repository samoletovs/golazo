import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { AppProvider } from '../src/contexts/AppContext'
import { ToastProvider } from '../src/contexts/ToastContext'
import { PersonalGoals } from '../src/components/PersonalGoals'
import { AchievementsList } from '../src/components/AchievementsList'
import { CoachCard } from '../src/components/CoachCard'
import { MentorDashboard } from '../src/pages/MentorDashboard'
import i18n from '../src/i18n'
import type { ReactNode } from 'react'
import { formatDisplayDate } from '../src/utils/dateFormat'

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
  it.each(['en', 'lv', 'ru', 'es', 'lt', 'et'])('keeps document language aligned with %s controls', async language => {
    await i18n.changeLanguage(language)
    expect(document.documentElement.lang).toBe(language)
    const months: Record<string, string> = { en: 'September', lv: 'septembris', ru: 'сентябрь', es: 'septiembre', lt: 'rugsėjis', et: 'september' }
    expect(formatDisplayDate(new Date('2026-09-23T12:00:00'), { month: 'long' })).toBe(months[language])
  })
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

  it('distinguishes linked players with a shared first name and never renders diary text', async () => {
    localStorage.setItem('golazo-state', JSON.stringify({
      profile: { id: 'synthetic-mentor', role: 'mentor', name: 'Fictional Mentor', menteeIds: ['child-a', 'child-b'] },
      diary: [{ id: 'private-fixture', playerId: 'child-a', date: '2026-09-23', text: 'PRIVATE_REFLECTION_SENTINEL', mood: 3, promptsUsed: [], linkedTrainingIds: [], linkedMatchIds: [], createdAt: '2026-09-23' }],
    }))
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.startsWith('/api/mentor/mentees')
      ? new Response(JSON.stringify({ mentees: [{ id: 'child-a', name: 'Fictional Player 07' }, { id: 'child-b', name: 'Fictional Player 08' }] }), { status: 200 })
      : new Response('{}', { status: 503 })))
    mount(<MentorDashboard />)
    const first = await screen.findByRole('button', { name: /Fictional Player 07/ })
    const second = screen.getByRole('button', { name: /Fictional Player 08/ })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('PRIVATE_REFLECTION_SENTINEL')).not.toBeInTheDocument()
  })
})
