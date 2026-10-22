import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { currentLocation, renderAt } from './support/renderCidr'

// Spec 17 FR-7 / AC-F3 — routes, tabs and header links.
describe('CIDR calculator routes', () => {
  it('redirects /slab/cidr to the CIDR → Range tab', async () => {
    renderAt('/slab/cidr')
    await screen.findByRole('heading', { name: 'CIDR Calculator' })
    expect(currentLocation()).toBe('/slab/cidr/range')
  })

  it('renders an in-app Not found for an unknown sub-path', async () => {
    renderAt('/slab/cidr/nope')
    expect(await screen.findByText('Not found')).toBeTruthy()
  })

  it('shows one tab per calculator, each a URL', async () => {
    renderAt('/slab/cidr/range')
    const tabs = await screen.findByRole('navigation', { name: 'Calculators' })
    const hrefs = Array.from(tabs.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/slab/cidr/range', '/slab/cidr/summarize', '/slab/cidr/aggregate', '/slab/cidr/tables'])
  })

  it('links back to the lab and to the CIDR theory in Studies', async () => {
    renderAt('/slab/cidr/range')
    await screen.findByRole('heading', { name: 'CIDR Calculator' })
    expect(screen.getByRole('link', { name: /All lab projects/ }).getAttribute('href')).toBe('/slab')
    expect(screen.getByRole('link', { name: /Learn the theory/ }).getAttribute('href')).toBe('/studies/tags/cidr')
  })
})
