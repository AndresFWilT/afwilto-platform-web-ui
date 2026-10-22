import { describe, it, expect } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { CidrValidationError } from '../src/cidr/application/errors'
import { deferred, fakeCalculator } from './support/fakeCalculator'
import { ipv4Range, ipv6Range } from './support/fixtures'
import { renderAt } from './support/renderCidr'

function submit(cidr: string) {
  fireEvent.change(screen.getByLabelText(/^CIDR/), { target: { value: cidr } })
  fireEvent.click(screen.getByRole('button', { name: 'Calculate' }))
}

function resultValue(label: string): string {
  const term = within(screen.getByRole('region', { name: 'Result' })).getByText(label, { selector: 'dt' })
  return term.nextElementSibling?.textContent ?? ''
}

// Spec 17 FR-7 — CIDR → Range page (AC-F4..AC-F6).
describe('CIDR → Range page', () => {
  it('AC-F4: shows every IPv4 field exactly as the API returned it', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/range', calculator)
    submit('10.0.0.0/24')

    await screen.findByRole('region', { name: 'Result' })
    expect(calculator.calculateRange).toHaveBeenCalledWith('10.0.0.0/24')
    expect(resultValue('CIDR range')).toBe('10.0.0.0/24')
    expect(resultValue('Netmask')).toBe(ipv4Range.netmask)
    expect(resultValue('Wildcard bits')).toBe(ipv4Range.wildcardBits)
    expect(resultValue('First IP')).toBe('10.0.0.0')
    expect(resultValue('First IP (decimal)')).toBe('167772160')
    expect(resultValue('Last IP')).toBe('10.0.0.255')
    expect(resultValue('Last IP (decimal)')).toBe('167772415')
    expect(resultValue('Total hosts')).toBe('256')
    expect(resultValue('Usable hosts')).toBe('254')
  })

  it('AC-F4: hides the IPv4-only rows for IPv6 and groups huge totals', async () => {
    renderAt('/slab/cidr/range', fakeCalculator({ calculateRange: () => Promise.resolve(ipv6Range) }))
    submit('2001:4860:4860::8888/32')

    const result = await screen.findByRole('region', { name: 'Result' })
    expect(resultValue('Total hosts')).toBe('79,228,162,514,264,337,593,543,950,336')
    expect(resultValue('First IP')).toBe('2001:4860:0000:0000:0000:0000:0000:0000')
    expect(resultValue('First IP (decimal)')).toBe('42541956101370907050197289607612071936')
    for (const hidden of ['Netmask', 'Wildcard bits', 'Usable hosts']) {
      expect(within(result).queryByText(hidden)).toBeNull()
    }
  })

  it('AC-F5: shows API validation messages and keeps the input', async () => {
    const message = 'cidr must be a CIDR such as 10.0.0.0/24 or 2001:db8::/32'
    const rejecting = fakeCalculator({
      calculateRange: () => Promise.reject(new CidrValidationError([{ field: 'cidr', rule: 'format', message }])),
    })
    renderAt('/slab/cidr/range', rejecting)
    submit('10.0.0.1')

    expect(await screen.findByText(message)).toBeTruthy()
    expect((screen.getByLabelText(/^CIDR/) as HTMLInputElement).value).toBe('10.0.0.1')
    expect(screen.queryByRole('region', { name: 'Result' })).toBeNull()
  })

  it('shows any other failure in an alert', async () => {
    renderAt('/slab/cidr/range', fakeCalculator({ calculateRange: () => Promise.reject(new Error('Could not reach the CIDR API (Failed to fetch)')) }))
    submit('10.0.0.0/24')
    expect(await screen.findByText('Could not reach the CIDR API (Failed to fetch)')).toBeTruthy()
  })

  it('AC-F6: an empty submit never calls the API', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/range', calculator)
    submit('   ')

    expect(await screen.findByText('Enter a CIDR such as 10.0.0.0/24')).toBeTruthy()
    expect(calculator.calculateRange).not.toHaveBeenCalled()
  })

  it('disables Calculate while the request is in flight', async () => {
    const pending = deferred<typeof ipv4Range>()
    renderAt('/slab/cidr/range', fakeCalculator({ calculateRange: () => pending.promise }))
    submit('10.0.0.0/24')

    await waitFor(() => expect((screen.getByRole('button', { name: /Calculate/ }) as HTMLButtonElement).disabled).toBe(true))
    pending.resolve(ipv4Range)
    await screen.findByRole('region', { name: 'Result' })
    expect((screen.getByRole('button', { name: 'Calculate' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
