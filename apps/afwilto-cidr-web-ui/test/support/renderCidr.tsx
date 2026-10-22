import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { App } from '../../src/app/App'
import type { ICidrCalculator } from '../../src/cidr/application/ports'
import { fakeCalculator } from './fakeCalculator'

function LocationProbe() {
  const { pathname } = useLocation()
  return <output data-testid="location">{pathname}</output>
}

/** Mounts the exposed App under /slab/cidr/* exactly as the shell does. */
export function renderAt(url: string, calculator: ICidrCalculator = fakeCalculator()) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LocationProbe />
      <Routes>
        <Route path="/slab/cidr/*" element={<App value={{ calculator }} />} />
      </Routes>
    </MemoryRouter>
  )
}

export function currentLocation(): string {
  return screen.getByTestId('location').textContent ?? ''
}
