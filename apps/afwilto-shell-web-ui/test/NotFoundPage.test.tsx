import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotFoundPage } from '@/pages/NotFound'

describe('host NotFoundPage (AC-2)', () => {
  it('renders the 404 UI with a way back home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeTruthy()
    expect(screen.getByText('Page not found')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toBeTruthy()
  })
})
