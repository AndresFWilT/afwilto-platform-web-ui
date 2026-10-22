import { describe, it, expect } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { CidrValidationError } from '../src/cidr/application/errors'
import { fakeCalculator } from './support/fakeCalculator'
import { renderAt } from './support/renderCidr'

function submit(text: string) {
  fireEvent.change(screen.getByLabelText(/^IP addresses/), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Aggregate' }))
}

function value(result: HTMLElement, label: string) {
  return within(result).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent
}

// Spec 17 FR-4 / FR-7 — Aggregate page (AC-F8).
describe('Aggregate page', () => {
  it('AC-F8: sends the split list and shows blocks and counts', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/aggregate', calculator)
    submit('10.0.0.1, 10.0.0.2\n\n 10.0.0.3')

    const result = await screen.findByRole('region', { name: 'Result' })
    expect(calculator.aggregate).toHaveBeenCalledWith(['10.0.0.1', '10.0.0.2', '10.0.0.3'])
    expect(value(result, 'Addresses entered')).toBe('6')
    expect(value(result, 'Unique addresses')).toBe('5')
    expect(value(result, 'Blocks')).toBe('2')
    const blocks = within(result).getByRole('list', { name: 'CIDR blocks' })
    expect(within(blocks).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['10.0.0.0/30', '10.0.0.5/32'])
  })

  it('requires at least one address before calling the API', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/aggregate', calculator)
    submit(' \n , ')

    expect(await screen.findByText('Enter at least one IPv4 address')).toBeTruthy()
    expect(calculator.aggregate).not.toHaveBeenCalled()
  })

  it('lists every rejected entry from the API', async () => {
    const violations = [
      { field: 'addresses[1]', rule: 'unsupported_family', message: 'addresses[1] must be IPv4; aggregation does not support IPv6' },
      { field: 'addresses[2]', rule: 'format', message: 'addresses[2] is not a valid IPv4 or IPv6 address' },
    ]
    renderAt('/slab/cidr/aggregate', fakeCalculator({ aggregate: () => Promise.reject(new CidrValidationError(violations)) }))
    submit('10.0.0.1 ::1 x')

    for (const v of violations) expect(await screen.findByText(v.message)).toBeTruthy()
  })
})
