/**
 * MFE chrome (navbar + footer) integration tests (Slice 11).
 * RED until CertificationsLayout wraps the routes in BaseLayout.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { App } from '../src/App'
import { InMemoryCertificationAdapter } from '../src/infrastructure/adapters/memory/InMemoryCertificationAdapter'

function renderAt(url: string, adapter = new InMemoryCertificationAdapter()) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/certifications/*"
          element={<App value={{ certificationJourneyService: adapter }} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('MFE chrome', () => {
  it('AC-N1: renders the AFWILTO brand in a navbar', async () => {
    renderAt('/certifications')
    const banner = await screen.findByRole('banner')
    expect(within(banner).getByText(/AFWILTO Platform/i)).toBeTruthy()
  })

  it('AC-N2: navbar contains Certifications and Timeline links with correct hrefs', async () => {
    renderAt('/certifications')
    const banner = await screen.findByRole('banner')
    const certLink = within(banner).getByRole('link', { name: 'Certifications' })
    const timelineLink = within(banner).getByRole('link', { name: 'Timeline' })
    expect(certLink.getAttribute('href')).toBe('/certifications')
    expect(timelineLink.getAttribute('href')).toBe('/certifications/timeline')
  })

  it('AC-N3: renders a footer', async () => {
    renderAt('/certifications')
    expect(await screen.findByRole('contentinfo')).toBeTruthy()
  })

  it('AC-N4: navbar is present on the detail route', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'CKA' })
    renderAt(`/certifications/${cert.id}`, adapter)
    await waitFor(() => {
      expect(screen.getByRole('banner')).toBeTruthy()
    })
  })
})
