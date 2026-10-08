import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DesignPage from '../src/pages/design/DesignPage'

describe('DesignPage showcases the shared design system (AC-8)', () => {
  it('renders shared Button, Badge and Card components', () => {
    const { container } = render(<DesignPage />)
    // Shared Button primary variant signature
    expect(container.querySelector('button.bg-primary-500')).not.toBeNull()
    // Semantic variants added for the finance domain (AC-12/AC-13)
    expect(container.querySelector('button.bg-success-600')).not.toBeNull()
    expect(container.querySelector('button.bg-info-600')).not.toBeNull()
    // Shared Card surface
    expect(container.querySelector('.bg-surface-raised')).not.toBeNull()
    // Shared Badge shape
    expect(container.querySelector('.rounded-full')).not.toBeNull()
  })

  it('shows the domain token swatches', () => {
    render(<DesignPage />)
    expect(screen.getAllByText(/income/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/expense/i).length).toBeGreaterThan(0)
  })
})
