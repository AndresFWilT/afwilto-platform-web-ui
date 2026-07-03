import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { App } from '@/App'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/slab/ud/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('UD app mounted under /slab/ud', () => {
  it('renders the UD landing at /slab/ud (AC-2)', async () => {
    renderAt('/slab/ud')
    expect(
      await screen.findByText('Universidad Distrital', { exact: false })
    ).toBeTruthy()
  })

  it('renders "Subject not found" for an unknown subject slug (AC-3)', async () => {
    renderAt('/slab/ud/not-a-real-subject')
    expect(await screen.findByText('Subject not found')).toBeTruthy()
  })

  it('landing subject cards link into /slab/ud/... (AC-4)', async () => {
    renderAt('/slab/ud')
    await screen.findByText('Universidad Distrital', { exact: false })
    const links = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((href) => href?.startsWith('/slab/ud/'))
    expect(links.length).toBeGreaterThan(0)
  })
})
