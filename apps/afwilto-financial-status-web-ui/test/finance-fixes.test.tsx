import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '../src/App'

// URL-aware fetch stub so pages can render real rows.
function stubFetch(routes: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const path = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/\/api\/v1/, '')
      let data: unknown = []
      for (const [suffix, value] of Object.entries(routes)) {
        if (path.endsWith(suffix)) { data = value; break }
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  )
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/finance/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  )
}

const GOAL = { id: 'g-1', name: 'Emergency Fund', target_amount: 5000, target_date: null, created_at: '2026-01-01' }
const CREDIT = { id: 'c-1', type: 'loan', name: 'Car Loan', principal: 20000, monthly_rate: 0.02, installments: 24, paid_installments: 6, start_date: '2026-01-01', created_at: '2026-01-01' }

describe('Spec 13 — goal/credit navigation 404 fix', () => {
  it('AC-1: clicking a goal card opens its detail (no 404)', async () => {
    stubFetch({ '/contributions': [], '/goals': [GOAL] })
    renderAt('/finance/goals')

    const card = await screen.findByText('Emergency Fund')
    fireEvent.click(card)

    // Detail-only content proves we navigated to /finance/goals/:id, not a 404.
    expect(await screen.findByText('Contribution History')).toBeTruthy()
    expect(screen.queryByText(/goal not found/i)).toBeNull()
  })

  it('AC-2: clicking a credit card opens its detail (no 404)', async () => {
    stubFetch({ '/credits': [CREDIT] })
    renderAt('/finance/credits')

    const card = await screen.findByText('Car Loan')
    fireEvent.click(card)

    expect(await screen.findByText('Amortization Table')).toBeTruthy()
    expect(screen.queryByText(/credit not found/i)).toBeNull()
  })
})

describe('Spec 13 — English-only UI', () => {
  beforeEach(() => stubFetch({}))

  it('AC-4: finance sub-nav is in English (Goals / Credits)', async () => {
    renderAt('/finance')
    await screen.findAllByText('AFWILTO Platform')
    expect(screen.getByRole('link', { name: 'Goals' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Credits' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Metas' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Créditos' })).toBeNull()
  })

  const SPANISH = [
    'Metas', 'Créditos', 'Crédito', 'Ingresos', 'Gastos', 'Resumen',
    'Deuda', 'Cuota', 'Fecha', 'Monto', 'Guardar', 'Cancelar',
    'Transacciones', 'Préstamo', 'Agregar',
  ]

  it.each(['/finance', '/finance/incomes', '/finance/expenses'])(
    'AC-5: %s renders no Spanish',
    async (path) => {
      renderAt(path)
      await screen.findAllByText('AFWILTO Platform')
      for (const term of SPANISH) {
        expect(screen.queryAllByText(new RegExp(term, 'i')).length, `"${term}" should not appear`).toBe(0)
      }
    }
  )
})
