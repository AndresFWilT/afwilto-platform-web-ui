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

  it('links the UD card to /universidad-distrital and Uniandes card to /uniandes (AC-2)', () => {
    renderApp()
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/universidad-distrital')
    expect(links).toContain('/uniandes')
  })

  it('renders inside an external router without a nested router (AC-3)', () => {
    expect(() => renderApp()).not.toThrow()
  })
})
