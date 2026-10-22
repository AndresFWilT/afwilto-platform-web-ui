import { describe, it, expect } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { fakeCalculator } from './support/fakeCalculator'
import { renderAt } from './support/renderCidr'

function bodyRows() {
  const table = screen.getByRole('table')
  return within(table).getAllByRole('row').slice(1)
}

// Spec 17 FR-5 / FR-7 — Prefix tables page (AC-F9).
describe('Prefix tables page', () => {
  it('AC-F9: shows the IPv4 table by default, with masks and grouped totals', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/tables', calculator)

    await waitFor(() => expect(bodyRows()).toHaveLength(33))
    expect(calculator.prefixTable).toHaveBeenCalledWith('ipv4')
    expect(screen.getByRole('columnheader', { name: 'Subnet mask' })).toBeTruthy()
    const last = within(bodyRows()[32]).getAllByRole('cell').map((c) => c.textContent)
    expect(last).toEqual(['32', '/0', 'mask-/0', '4,294,967,296'])
  })

  it('AC-F9: the toggle loads the IPv6 table without a mask column', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/tables', calculator)
    await waitFor(() => expect(bodyRows()).toHaveLength(33))

    fireEvent.click(screen.getByRole('button', { name: 'IPv6' }))

    await waitFor(() => expect(bodyRows()).toHaveLength(129))
    expect(calculator.prefixTable).toHaveBeenLastCalledWith('ipv6')
    expect(screen.getByRole('button', { name: 'IPv6' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('columnheader', { name: 'Subnet mask' })).toBeNull()
  })

  it('shows a failure in an alert', async () => {
    renderAt('/slab/cidr/tables', fakeCalculator({ prefixTable: () => Promise.reject(new Error('The CIDR API is not configured (VITE_API_URL).')) }))
    expect(await screen.findByText('The CIDR API is not configured (VITE_API_URL).')).toBeTruthy()
  })
})
