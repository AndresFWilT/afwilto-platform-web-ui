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

  it('links all live cards to their prefixes (AC-2, Specs 07-08)', () => {
    renderApp()
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/slab')
    expect(links).toContain('/finance')
    expect(links).toContain('/certifications')
  })

  it('renders no Coming soon badges once every product is live (AC-2)', () => {
    renderApp()
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('renders inside an external router (AC-3)', () => {
    expect(() => renderApp()).not.toThrow()
  })
})
