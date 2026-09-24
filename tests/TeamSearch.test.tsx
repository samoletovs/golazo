import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamSearch } from '../src/components/TeamSearch'
import i18n from '../src/i18n'

const team = { id: 'fixture-club', name: 'Fictional Northbank Academy', country: 'LV', city: 'Fictional town', aliases: [], verified: false }

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.useFakeTimers()
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('team-search focus ownership', () => {
  it('does not reopen a late suggestion popup after the user has moved to another control', async () => {
    let resolve: (response: Response) => void = () => { throw new Error('Request was not started') }
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(done => { resolve = done })))
    render(<><TeamSearch value="" onChange={vi.fn()} placeholder="Club lookup" /><button>Next control</button></>)
    const input = screen.getByRole('textbox', { name: 'Club lookup' })
    act(() => input.focus())
    fireEvent.change(input, { target: { value: 'Fictional' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    act(() => screen.getByRole('button', { name: 'Next control' }).focus())
    await act(async () => { resolve(new Response(JSON.stringify({ teams: [team] }), { status: 200 })) })
    expect(screen.queryByRole('button', { name: /Fictional Northbank Academy/ })).not.toBeInTheDocument()
    expect(input).toHaveValue('Fictional')
    expect(screen.getByRole('button', { name: 'Next control' })).toHaveFocus()
  })

  it('supports keyboard suggestions and closes only the popup on Escape while retaining input focus', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ teams: [team] }), { status: 200 })))
    render(<TeamSearch value="" onChange={vi.fn()} placeholder="Club lookup" />)
    const input = screen.getByRole('textbox', { name: 'Club lookup' })
    act(() => input.focus())
    fireEvent.change(input, { target: { value: 'Fictional' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await act(async () => { await vi.advanceTimersByTimeAsync(20) })
    const suggestion = screen.getByRole('button', { name: /Fictional Northbank Academy/ })
    expect(suggestion).toHaveFocus()
    expect(fireEvent.keyDown(suggestion, { key: 'Escape' })).toBe(false)
    expect(input).toHaveFocus()
    expect(screen.queryByRole('button', { name: /Fictional Northbank Academy/ })).not.toBeInTheDocument()
  })
})
