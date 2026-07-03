import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { routes } from '@/router'
import { App } from '@/App'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/slab/mati/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MATI route table contract (AC-1)', () => {
  it('is relative and contains landing, param fallback and catch-all', () => {
    const paths = routes.map((r) => r.path)
    for (const p of paths) {
      expect(p?.startsWith('/'), `path "${p}" must be relative`).toBe(false)
    }
    expect(paths).toContain('')
    expect(paths).toContain(':subjectSlug')
    expect(paths).toContain('*')
  })
})

describe('MATI app mounted under /slab/mati', () => {
  it('renders the MATI landing (AC-2)', async () => {
    renderAt('/slab/mati')
    expect(
      await screen.findByText('Universidad de los Andes', { exact: false })
    ).toBeTruthy()
  })

  it('renders the subject placeholder for a known slug (AC-3)', async () => {
    renderAt('/slab/mati/business-architecture')
    expect(await screen.findByText('Content in Progress')).toBeTruthy()
  })

  it('renders "Subject not found" for an unknown slug (AC-3)', async () => {
    renderAt('/slab/mati/not-a-real-subject')
    expect(await screen.findByText('Subject not found')).toBeTruthy()
  })

  it('landing subject cards link into /slab/mati/... (AC-4)', async () => {
    renderAt('/slab/mati')
    await screen.findByText('Universidad de los Andes', { exact: false })
    const links = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((href) => href?.startsWith('/slab/mati/'))
    expect(links.length).toBeGreaterThan(0)
  })
})
