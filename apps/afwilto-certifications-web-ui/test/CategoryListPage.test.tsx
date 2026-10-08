import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { App } from '../src/App'
import { InMemoryCertificationAdapter } from '../src/infrastructure/adapters/memory/InMemoryCertificationAdapter'

function renderAt(url: string, adapter = new InMemoryCertificationAdapter()) {
  return {
    adapter,
    ...render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/certifications/*"
            element={<App value={{ certificationJourneyService: adapter }} />}
          />
        </Routes>
      </MemoryRouter>
    ),
  }
}

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

// The Table organism renders both a desktop <table> and a mobile stacked-card
// view at once (CSS-only responsive switch), so every row's text/controls
// exist twice in the DOM — queries must be scoped to the desktop table.
async function findTable() {
  return within(await screen.findByRole('table'))
}

describe('CategoryListPage', () => {
  it('lists every category with a color swatch, path, and live count (including 0)', async () => {
    const adapter = new InMemoryCertificationAdapter([], [
      { path: 'Cloud / AWS', color: '#22D3EE' },
      { path: 'Unused', color: '#A78BFA' },
    ])
    renderAt('/certifications/categories', adapter)

    const table = await findTable()
    expect(table.getByText('Cloud / AWS')).toBeTruthy()
    expect(table.getByText('Unused')).toBeTruthy()
    expect(table.getAllByText('0').length).toBeGreaterThan(0)

    const swatch = table.getByLabelText('Color #22D3EE')
    expect(swatch.style.backgroundColor).toBe(hexToRgb('#22D3EE'))
  })

  it('deleting an unused category removes it from the list immediately', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'Unused', color: '#22D3EE' }])
    renderAt('/certifications/categories', adapter)

    const table = await findTable()
    table.getByText('Unused')
    fireEvent.click(table.getByRole('button', { name: /delete/i }))
    await screen.findByRole('dialog')

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/Category deleted/i)).toBeTruthy()
    })
    expect(screen.queryByText('Unused')).toBeNull()
  })

  it('attempting to delete a category in use surfaces the in_use message and keeps the row', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'Cloud / AWS', color: '#22D3EE' }])
    await adapter.create({ name: 'AWS SAA', categoryPath: 'Cloud / AWS' })
    renderAt('/certifications/categories', adapter)

    const table = await findTable()
    table.getByText('Cloud / AWS')
    fireEvent.click(table.getByRole('button', { name: /delete/i }))
    await screen.findByRole('dialog')

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    fireEvent.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText(/category is used by 1 certification\(s\)/i)).toBeTruthy()
    })
    expect(within(screen.getByRole('table')).getByText('Cloud / AWS')).toBeTruthy()
  })

  it('editing a category updates its swatch and path immediately', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'Cloud', color: '#22D3EE' }])
    renderAt('/certifications/categories', adapter)

    const table = await findTable()
    table.getByText('Cloud')
    fireEvent.click(table.getByRole('button', { name: /edit/i }))

    const pathInput = await screen.findByLabelText('Path')
    fireEvent.change(pathInput, { target: { value: 'Cloud / Recolored' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#34D399' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('Cloud / Recolored')).toBeTruthy()
    })
    const swatch = within(screen.getByRole('table')).getByLabelText('Color #34D399')
    expect(swatch.style.backgroundColor).toBe(hexToRgb('#34D399'))
  })

  it('shows an empty state when there are no categories', async () => {
    renderAt('/certifications/categories')
    expect(await screen.findByText(/no categories yet/i)).toBeTruthy()
  })
})
