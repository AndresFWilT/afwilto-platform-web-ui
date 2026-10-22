import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { container } from '../src/app/di/container'
import { UnconfiguredCalculator } from '../src/cidr/infrastructure/unconfigured/UnconfiguredCalculator'
import type { CidrRange } from '../src/cidr/domain/types'
import { fakeCalculator } from './support/fakeCalculator'
import { renderAt } from './support/renderCidr'

// Review follow-ups: composition-root fallback and the App error boundary (FR-7).
describe('wiring', () => {
  it('wires the UnconfiguredCalculator when VITE_API_URL is not set', async () => {
    expect(import.meta.env['VITE_API_URL']).toBeUndefined()
    expect(container.calculator).toBeInstanceOf(UnconfiguredCalculator)
    await expect(container.calculator.prefixTable('ipv4')).rejects.toThrow('The CIDR API is not configured (VITE_API_URL).')
  })

  it('contains a render crash inside the remote', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = fakeCalculator({ calculateRange: () => Promise.resolve(null as unknown as CidrRange) })
    renderAt('/slab/cidr/range', broken)

    fireEvent.change(screen.getByLabelText(/^CIDR/), { target: { value: '10.0.0.0/24' } })
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }))

    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    vi.mocked(console.error).mockRestore()
  })
})
