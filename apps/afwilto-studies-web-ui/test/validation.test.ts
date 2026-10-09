import { describe, it, expect } from 'vitest'
import { validateColor, validateDescription, validateName } from '../src/domain/validation'

describe('client-side validation mirrors (S09a-3, spec §2.2)', () => {
  it.each([
    ['TI', 60, null],
    ['  padded  ', 60, null],
    ['', 60, 'Name is required'],
    ['   ', 60, 'Name is required'],
    ['x'.repeat(60), 60, null],
    ['x'.repeat(61), 60, 'At most 60 characters'],
    ['  ' + 'x'.repeat(40) + '  ', 40, null], // length counts after trimming
    ['x'.repeat(41), 40, 'At most 40 characters'],
    ['x'.repeat(121), 120, 'At most 120 characters'],
    ['tab\there', 60, 'Name cannot contain control characters'],
    ['bell\u0007', 60, 'Name cannot contain control characters'],
    ['ñandú 数学 🚀', 60, null],
    ['Cloud\u0085', 60, null], // Go TrimSpace strips U+0085 (NEL)
    ['\uFEFFBOM', 60, null], // …but keeps U+FEFF, which is not a control character
  ])('validateName(%j, %d) → %j', (value, max, expected) => {
    expect(validateName(value, max)).toBe(expected)
  })

  it('counts characters, not UTF-16 units, like the backend', () => {
    expect(validateName('🚀'.repeat(60), 60)).toBeNull()
    expect(validateName('🚀'.repeat(61), 60)).toBe('At most 60 characters')
  })

  it.each([
    ['#22D3EE', null],
    ['#22d3ee', null],
    [' #22D3EE ', null],
    ['22D3EE', 'Use a hex color like #22D3EE'],
    ['#22D3E', 'Use a hex color like #22D3EE'],
    ['#GGGGGG', 'Use a hex color like #22D3EE'],
    ['', 'Use a hex color like #22D3EE'],
  ])('validateColor(%j) → %j', (value, expected) => {
    expect(validateColor(value)).toBe(expected)
  })

  it.each([
    ['', null],
    ['line one\nline two', null],
    ['d'.repeat(2000), null],
    ['d'.repeat(2001), 'At most 2000 characters'],
  ])('validateDescription(%j) → %j', (value, expected) => {
    expect(validateDescription(value)).toBe(expected)
  })
})
