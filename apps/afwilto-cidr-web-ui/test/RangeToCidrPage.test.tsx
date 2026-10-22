import { describe, it, expect } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { CidrValidationError } from '../src/cidr/application/errors'
import { fakeCalculator } from './support/fakeCalculator'
import { renderAt } from './support/renderCidr'

function submit(first: string, last: string) {
  fireEvent.change(screen.getByLabelText(/^First IP/), { target: { value: first } })
  fireEvent.change(screen.getByLabelText(/^Last IP/), { target: { value: last } })
  fireEvent.click(screen.getByRole('button', { name: 'Calculate' }))
}

// Spec 17 FR-3 / FR-7 — Range → CIDR page (AC-F7).
describe('Range → CIDR page', () => {
  it('AC-F7: renders the blocks and their count from the port', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/summarize', calculator)
    submit(' 192.168.1.10 ', '192.168.1.20')

    const result = await screen.findByRole('region', { name: 'Result' })
    expect(calculator.summarizeRange).toHaveBeenCalledWith('192.168.1.10', '192.168.1.20')
    const blocks = within(result).getByRole('list', { name: 'CIDR blocks' })
    expect(within(blocks).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '192.168.1.10/31',
      '192.168.1.12/30',
      '192.168.1.16/30',
      '192.168.1.20/32',
    ])
    expect(within(result).getByText('Blocks', { selector: 'dt' }).nextElementSibling?.textContent).toBe('4')
  })

  it('requires both bounds before calling the API', async () => {
    const calculator = fakeCalculator()
    renderAt('/slab/cidr/summarize', calculator)
    submit('10.0.0.1', '')

    expect(await screen.findByText('Enter the last IP of the range')).toBeTruthy()
    expect(calculator.summarizeRange).not.toHaveBeenCalled()
  })

  it('shows the API message under the field it belongs to', async () => {
    const message = 'lastIp must not be lower than firstIp'
    renderAt('/slab/cidr/summarize', fakeCalculator({
      summarizeRange: () => Promise.reject(new CidrValidationError([{ field: 'lastIp', rule: 'range_order', message }])),
    }))
    submit('10.0.0.2', '10.0.0.1')

    expect(await screen.findByText(message)).toBeTruthy()
    expect((screen.getByLabelText(/^Last IP/) as HTMLInputElement).value).toBe('10.0.0.1')
  })

  it('falls back to the API message when no field matches (review finding 8)', async () => {
    const message = 'request could not be processed'
    renderAt('/slab/cidr/summarize', fakeCalculator({
      summarizeRange: () => Promise.reject(new CidrValidationError([{ field: 'body', rule: 'format', message }])),
    }))
    submit('10.0.0.1', '10.0.0.2')

    expect(await screen.findByText(message)).toBeTruthy()
  })
})
