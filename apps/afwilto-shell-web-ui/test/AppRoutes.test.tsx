import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/remotes/remotes', () => ({
  LegacyApp: () => <div data-testid="legacy-app" />,
  SlabHomeApp: () => <div data-testid="slab-home-app" />,
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

  it.each(['/', '/home', '/universidad-distrital/computer-science-1', '/uniandes'])(
    '%s mounts the legacy remote slot (AC-3)',
    async (path) => {
      renderAt(path)
      expect(await screen.findByTestId('legacy-app')).toBeTruthy()
    }
  )
})
