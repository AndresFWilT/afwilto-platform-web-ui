import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

describe('afwilto root HomePage via exposed App', () => {
  it('renders the brand hero (AC-1)', () => {
    renderApp()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent?.toLowerCase()).toContain('afwilto')
  })

  it('renders exactly the three product cards (AC-1)', () => {
    renderApp()
    expect(screen.getByText('Software Lab')).toBeTruthy()
    expect(screen.getByText('Financial Status')).toBeTruthy()
    expect(screen.getByText('Certifications')).toBeTruthy()
  })

  it('links the live cards to /slab and /finance (AC-2, Spec 07 AC-4)', () => {
    renderApp()
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/slab')
    expect(links).toContain('/finance')
  })

  it('renders soon cards without links and with a Coming soon badge (AC-2)', () => {
    renderApp()
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).not.toContain('/certifications')
    expect(screen.getAllByText('Coming soon')).toHaveLength(1)
  })

  it('renders inside an external router (AC-3)', () => {
    expect(() => renderApp()).not.toThrow()
  })
})
