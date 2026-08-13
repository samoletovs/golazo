import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import i18n from '../src/i18n'
import { LogPage } from '../src/pages/LogPage'

const trainingLogRender = vi.hoisted(() => vi.fn())

vi.mock('../src/contexts/AppContext', () => ({
  useApp: () => ({
    schedule: [],
    recurringTrainings: [],
    matches: [],
    trainings: [],
    profile: null,
  }),
}))

vi.mock('../src/pages/TrainingLog', () => ({
  TrainingLog: () => {
    trainingLogRender()
    return <div>Training Log Mock</div>
  },
}))

vi.mock('../src/pages/MatchLog', () => ({
  MatchLog: () => <div>Match Log Mock</div>,
}))

vi.mock('../src/pages/DiaryPage', () => ({
  DiaryPage: () => <div>Diary Page Mock</div>,
}))

vi.mock('../src/components/TournamentImport', () => ({
  TournamentImport: () => <div>Tournament Import Mock</div>,
}))

describe('LogPage lazy loading', () => {
  beforeEach(async () => {
    trainingLogRender.mockClear()
    localStorage.setItem('golazo-lang', 'en')
    await i18n.changeLanguage('en')
  })

  it('loads TrainingLog only when training logging is opened', async () => {
    render(<LogPage />)

    expect(trainingLogRender).not.toHaveBeenCalled()
    expect(screen.queryByText('Training Log Mock')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: i18n.t('log.training') }))

    expect(await screen.findByText('Training Log Mock')).toBeInTheDocument()
    expect(trainingLogRender).toHaveBeenCalledTimes(1)
  })
})
