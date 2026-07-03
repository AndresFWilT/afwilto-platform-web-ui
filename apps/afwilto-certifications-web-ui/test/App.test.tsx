import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { routes } from '../src/router'
import { App } from '../src/App'
import { CERTIFICATIONS } from '../src/infrastructure/data/certifications'

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/certifications/*" element={<App />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('route table contract (AC-6)', () => {
  it('is relative and contains catalog, roadmap, detail and catch-all', () => {
    const paths = routes.map((r) => r.path)
    for (const p of paths) {
      expect(p?.startsWith('/'), `path "${p}" must be relative`).toBe(false)
    }
    expect(paths).toContain('')
    expect(paths).toContain('roadmap')
    expect(paths).toContain(':certSlug')
    expect(paths).toContain('*')
  })
})

describe('certifications app mounted under /certifications (AC-5)', () => {
  const obtained = CERTIFICATIONS.filter((c) => c.status === 'obtained')

  it('catalog renders one card per obtained cert', async () => {
    renderAt('/certifications')
    for (const cert of obtained) {
      expect(await screen.findByText(cert.name)).toBeTruthy()
    }
  })

  it('roadmap renders status badges', async () => {
    renderAt('/certifications/roadmap')
    expect((await screen.findAllByText(/in progress|planned/i)).length).toBeGreaterThan(0)
  })

  it('detail renders name and skills for a known slug', async () => {
    const cert = CERTIFICATIONS[0]
    renderAt(`/certifications/${cert.slug}`)
    expect((await screen.findAllByText(cert.name)).length).toBeGreaterThan(0)
    expect(screen.getByText(cert.skills[0])).toBeTruthy()
  })

  it('detail renders a not-found state for an unknown slug', async () => {
    renderAt('/certifications/definitely-not-a-cert')
    expect(await screen.findByText('Certification not found')).toBeTruthy()
  })
})
