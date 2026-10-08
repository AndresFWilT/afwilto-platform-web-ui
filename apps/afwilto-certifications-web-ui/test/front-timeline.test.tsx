/**
 * Front-page (landing) timeline graphics tests (Slice 11).
 * RED until JourneyListPage embeds a current-year TimelineCanvas.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { App } from '../src/App'
import { InMemoryCertificationAdapter } from '../src/infrastructure/adapters/memory/InMemoryCertificationAdapter'

const CUR = new Date().getFullYear()

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

describe('Front-page timeline', () => {
  it('AC-F1: shows the timeline canvas + a bar when a current-year cert exists', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({
      name: 'AWS SAA',
      studyStartDate: `${CUR}-03-01`,
      expectedExamDate: `${CUR}-08-31`,
    })
    renderAt('/certifications', adapter)

    await waitFor(() => {
      expect(screen.getByLabelText('Timeline canvas')).toBeTruthy()
    })
    // The bar is a link to the cert detail page
    const links = screen.getAllByRole('link')
    const barLink = links.find((l) => l.getAttribute('href')?.endsWith(`/certifications/${cert.id}`))
    expect(barLink).toBeTruthy()
  })

  it('AC-F2: the list/table is still rendered alongside the timeline', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({
      name: 'CKA',
      studyStartDate: `${CUR}-01-01`,
      expectedExamDate: `${CUR}-06-30`,
    })
    renderAt('/certifications', adapter)

    await waitFor(() => {
      expect(screen.getByLabelText('Timeline canvas')).toBeTruthy()
    })
    // The list page's own search control proves the list section is present
    expect(screen.getByLabelText('Search certifications')).toBeTruthy()
  })

  it('AC-F4: renders a "Full timeline" link to the timeline page', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({
      name: 'Terraform Associate',
      studyStartDate: `${CUR}-02-01`,
      expectedExamDate: `${CUR}-05-31`,
    })
    renderAt('/certifications', adapter)

    await waitFor(() => {
      expect(screen.getByLabelText('Timeline canvas')).toBeTruthy()
    })
    const fullLink = screen.getByRole('link', { name: /full timeline/i })
    expect(fullLink.getAttribute('href')).toBe('/certifications/timeline')
  })

  it('AC-F3: no timeline canvas when nothing is scheduled for the current year', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({
      name: 'Old Cert',
      studyStartDate: `${CUR - 2}-01-01`,
      expectedExamDate: `${CUR - 2}-12-31`,
    })
    renderAt('/certifications', adapter)

    // The list must render (search control present) …
    await waitFor(() => {
      expect(screen.getByLabelText('Search certifications')).toBeTruthy()
    })
    // … but there is no timeline canvas for the current year
    expect(screen.queryByLabelText('Timeline canvas')).toBeNull()
  })
})
