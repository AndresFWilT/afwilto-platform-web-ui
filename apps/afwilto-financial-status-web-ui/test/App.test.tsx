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
  it('renders the shared platform chrome at /finance (AC-9/AC-10)', async () => {
    renderAt('/finance')
    const brand = (await screen.findAllByText('AFWILTO Platform'))[0].closest('a')!
    expect(brand.getAttribute('href')).toBe('/')
    expect(document.querySelector('footer')).not.toBeNull()
    expect(screen.queryByText('FinStatus')).toBeNull()
  })

  it('renders the incomes page at /finance/incomes', async () => {
    renderAt('/finance/incomes')
    await screen.findAllByText('AFWILTO Platform')
    expect(screen.getAllByText(/incomes|ingresos/i).length).toBeGreaterThan(0)
  })

  it('finance sub-nav links target /finance/... (AC-3/AC-10)', async () => {
    renderAt('/finance')
    await screen.findAllByText('AFWILTO Platform')
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/finance')
    expect(links).toContain('/finance/incomes')
    expect(links).toContain('/finance/credits')
    expect(links).toContain('/')
  })
})

describe('all finance sections render after the design-system sweep (AC-10/AC-11)', () => {
  it.each(['/finance', '/finance/incomes', '/finance/expenses', '/finance/goals', '/finance/credits', '/finance/design'])(
    'renders %s without crashing',
    async (path) => {
      renderAt(path)
      expect((await screen.findAllByText('AFWILTO Platform')).length).toBeGreaterThan(0)
    }
  )
})
