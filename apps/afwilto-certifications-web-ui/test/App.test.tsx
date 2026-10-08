import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { routes, childRoutes } from '../src/router'
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

describe('route table contract (AC-6, BR-CH1)', () => {
  it('wraps all pages in a single layout route (navbar + footer chrome)', () => {
    expect(routes).toHaveLength(1)
    expect(routes[0].element).toBeTruthy()
    expect(routes[0].children).toBe(childRoutes)
  })

  it('child routes are relative and contain the expected path keys', () => {
    const paths = childRoutes.map((r) => r.path)
    for (const p of paths) {
      expect(p?.startsWith('/'), `path "${p}" must be relative`).toBe(false)
    }
    expect(paths).toContain('')
    expect(paths).toContain('new')
    expect(paths).toContain(':id')
    expect(paths).toContain('timeline')
    expect(paths).toContain('categories')
    expect(paths).toContain('categories/new')
    expect(paths).toContain('*')
  })

  it('static routes appear before the :id param route', () => {
    const paths = childRoutes.map((r) => r.path)
    const newIdx = paths.indexOf('new')
    const idIdx = paths.indexOf(':id')
    const timelineIdx = paths.indexOf('timeline')
    const categoriesIdx = paths.indexOf('categories')
    const categoriesNewIdx = paths.indexOf('categories/new')
    expect(newIdx).toBeLessThan(idIdx)
    expect(timelineIdx).toBeLessThan(idIdx)
    expect(categoriesIdx).toBeLessThan(idIdx)
    expect(categoriesNewIdx).toBeLessThan(idIdx)
  })
})

describe('JourneyListPage (GH-L1, GH-X1)', () => {
  it('renders the Certifications heading', async () => {
    renderAt('/certifications')
    expect(await screen.findByRole('heading', { name: 'Certifications' })).toBeTruthy()
  })

  it('shows empty state when no certifications exist', async () => {
    renderAt('/certifications')
    expect(await screen.findByText(/No certifications yet/)).toBeTruthy()
  })

  it('renders rows when certifications exist', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({ name: 'AWS Solutions Architect' })
    renderAt('/certifications', adapter)
    expect((await screen.findAllByText('AWS Solutions Architect')).length).toBeGreaterThan(0)
  })

  it('renders search and status filter controls', async () => {
    renderAt('/certifications')
    await screen.findByRole('heading', { name: 'Certifications' })
    expect(screen.getByLabelText('Search certifications')).toBeTruthy()
    expect(screen.getByLabelText('Filter by status')).toBeTruthy()
  })
})

describe('CertificationDetailPage', () => {
  it('shows not-found alert for unknown id', async () => {
    renderAt('/certifications/00000000-0000-0000-0000-000000000000')
    await waitFor(() => {
      expect(screen.queryByText(/not found/i)).toBeTruthy()
    })
  })

  it('renders cert name for a known id', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'CKA Kubernetes' })
    renderAt(`/certifications/${cert.id}`, adapter)
    expect((await screen.findAllByText('CKA Kubernetes')).length).toBeGreaterThan(0)
  })
})
