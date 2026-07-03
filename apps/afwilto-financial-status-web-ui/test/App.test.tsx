import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '../src/App'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
  )
})

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/finance/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('finance app mounted under /finance (AC-1/AC-2)', () => {
  it('renders the app shell (sidebar brand) at /finance without a nested router', async () => {
    renderAt('/finance')
    expect((await screen.findAllByText('FinStatus')).length).toBeGreaterThan(0)
  })

  it('renders the incomes page at /finance/incomes', async () => {
    renderAt('/finance/incomes')
    expect((await screen.findAllByText('FinStatus')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/incomes/i).length).toBeGreaterThan(0)
  })

  it('sidebar links target /finance/... (AC-3)', async () => {
    renderAt('/finance')
    await screen.findAllByText('FinStatus')
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/finance')
    expect(links).toContain('/finance/incomes')
    expect(links).toContain('/finance/credits')
  })
})
