import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

  it('renders exactly the five product cards (AC-1, Spec 15, Spec 16 S07-2)', () => {
    renderApp()
    // These labels now also appear as navbar links, so scope to the main content.
    const main = screen.getByRole('main')
    expect(within(main).getByText('Software Lab')).toBeTruthy()
    expect(within(main).getByText('Financial Status')).toBeTruthy()
    expect(within(main).getByText('Certifications')).toBeTruthy()
    expect(within(main).getByText('Love Points Bank')).toBeTruthy()
    expect(within(main).getByText('Studies')).toBeTruthy()
    const cardHrefs = within(main).getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(cardHrefs).toEqual(['/slab', '/finance', '/certifications', '/love-points-bank', '/studies'])
  })

  it('links all live cards to their prefixes (AC-2, Specs 07-08, 15, 16)', () => {
    renderApp()
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(links).toContain('/slab')
    expect(links).toContain('/finance')
    expect(links).toContain('/certifications')
    expect(links).toContain('/love-points-bank')
    expect(links).toContain('/studies')
  })

  it('renders no Coming soon badges once every product is live (AC-2)', () => {
    renderApp()
    expect(screen.queryByText('Coming soon')).toBeNull()
  })

  it('renders inside an external router (AC-3)', () => {
    expect(() => renderApp()).not.toThrow()
  })

  // ── Spec 12: rebrand ──────────────────────────────────────────────────────

  it('AC-1: navbar brand reads "AFWILTO Platform", not "Software Lab"', () => {
    renderApp()
    const banner = screen.getByRole('banner')
    expect(within(banner).getByText(/AFWILTO Platform/i)).toBeTruthy()
    expect(screen.queryByText(/AFWILTO Software Lab/i)).toBeNull()
  })

  it('AC-2: footer copyright reads "AFWILTO Platform"', () => {
    renderApp()
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText(/AFWILTO Platform/i)).toBeTruthy()
  })

  it('AC-3: the section heading is "Features", not "Products"', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Features' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Products' })).toBeNull()
  })

  it('AC-4: navbar links to Home + live products, with no dead /projects link', () => {
    renderApp()
    const banner = screen.getByRole('banner')
    const hrefs = within(banner).getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/slab')
    expect(hrefs).toContain('/finance')
    expect(hrefs).toContain('/certifications')
    expect(hrefs).toContain('/love-points-bank')
    expect(hrefs).toContain('/studies') // BaseLayout default nav (Spec 16 S07-2)
    expect(hrefs).not.toContain('/projects')
  })
})
