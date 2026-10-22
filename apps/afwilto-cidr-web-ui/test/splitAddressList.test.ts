import { describe, it, expect } from 'vitest'
import { splitAddressList } from '../src/shared/lib/splitAddressList'

// Spec 17 FR-7 — input handling only: split pasted text, drop blanks.
describe('splitAddressList', () => {
  it('AC-F8: splits on commas, spaces and new lines and drops blanks', () => {
    expect(splitAddressList('10.0.0.1, 10.0.0.2\n\n 10.0.0.3')).toEqual(['10.0.0.1', '10.0.0.2', '10.0.0.3'])
  })

  it('keeps duplicates and order (the API dedupes and counts them)', () => {
    expect(splitAddressList('10.0.0.3\t10.0.0.3;10.0.0.1')).toEqual(['10.0.0.3', '10.0.0.3', '10.0.0.1'])
  })

  it('returns nothing for blank input', () => {
    expect(splitAddressList(' \n ,, ')).toEqual([])
  })
})
