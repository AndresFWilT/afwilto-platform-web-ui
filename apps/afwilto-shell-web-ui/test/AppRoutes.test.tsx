import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/remotes/remotes', () => ({
  LegacyApp: () => <div data-testid="legacy-app" />,
  SlabHomeApp: () => <div data-testid="slab-home-app" />,
  AfwiltoHomeApp: () => <div data-testid="afwilto-home-app" />,
  UDApp: () => <div data-testid="ud-app" />,
}))

import { AppRoutes } from '@/router/AppRoutes'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  )
}

describe('host URL gateway', () => {
  it('/design-system renders the host-local showcase (AC-1)', async () => {
    renderAt('/design-system')
    expect(
      await screen.findByText('Component library and visual language for AFWILTO Software Lab.', { exact: false })
    ).toBeTruthy()
    expect(screen.queryByTestId('legacy-app')).toBeNull()
  })

  it('/slab mounts the slab homepage remote (Spec 03 AC-4)', async () => {
    renderAt('/slab')
    expect(await screen.findByTestId('slab-home-app')).toBeTruthy()
    expect(screen.queryByTestId('legacy-app')).toBeNull()
  })

  it('/ mounts the afwilto root homepage remote (Spec 04 AC-4)', async () => {
    renderAt('/')
    expect(await screen.findByTestId('afwilto-home-app')).toBeTruthy()
    expect(screen.queryByTestId('legacy-app')).toBeNull()
  })

  it.each(['/slab/ud', '/slab/ud/computer-science-1', '/slab/ud/computer-science-2/b-tree'])(
    '%s mounts the UD remote (Spec 05 AC-5)',
    async (path) => {
      renderAt(path)
      expect(await screen.findByTestId('ud-app')).toBeTruthy()
      expect(screen.queryByTestId('legacy-app')).toBeNull()
    }
  )

  it.each(['/universidad-distrital/computer-science-1', '/uniandes', '/home'])(
    '%s mounts the legacy remote slot (AC-3)',
    async (path) => {
      renderAt(path)
      expect(await screen.findByTestId('legacy-app')).toBeTruthy()
    }
  )
})
