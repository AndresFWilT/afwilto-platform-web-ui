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

describe('SlabPage via exposed App', () => {
  it('renders the hero (AC-1)', () => {
    renderApp()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('AFWILTO')
    expect(heading.textContent).toContain('Software Lab')
  })

  it('renders both university cards (AC-1)', () => {
    renderApp()
    expect(
      screen.getByText('Universidad Distrital Francisco José de Caldas')
    ).toBeTruthy()
    expect(screen.getByText('Universidad de los Andes')).toBeTruthy()
  })

  it('links the UD card to /slab/ud and Uniandes card to /slab/mati (AC-2)', () => {
    renderApp()
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/slab/ud')
    expect(links).toContain('/slab/mati')
  })

  it('renders inside an external router without a nested router (AC-3)', () => {
    expect(() => renderApp()).not.toThrow()
  })
})

describe('Software Engineering section (Spec 17 FR-8 / AC-F1)', () => {
  it('comes before the academic institutions', () => {
    renderApp()
    const se = screen.getByRole('heading', { name: 'Software Engineering' })
    const academic = screen.getByRole('heading', { name: 'Academic Institutions' })
    expect(se.compareDocumentPosition(academic) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows a CIDR Calculator card linking to /slab/cidr', () => {
    renderApp()
    const card = screen.getByRole('article', { name: 'CIDR Calculator' })
    expect(card.querySelector('a')?.getAttribute('href')).toBe('/slab/cidr')
    for (const tag of ['IPv4', 'IPv6', 'Ruby', 'Sinatra', 'Hexagonal']) {
      expect(card.textContent).toContain(tag)
    }
  })
})
