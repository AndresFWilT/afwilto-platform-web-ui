import { describe, it, expect } from 'vitest'
import { groupDigits } from '../src/shared/lib/groupDigits'

// Spec 17 AC-F11 — presentation only: no numeric conversion, so values far
// beyond 2^53 group exactly.
describe('groupDigits', () => {
  it.each([
    ['79228162514264337593543950336', '79,228,162,514,264,337,593,543,950,336'],
    ['340282366920938463463374607431768211456', '340,282,366,920,938,463,463,374,607,431,768,211,456'],
    ['4294967296', '4,294,967,296'],
    ['1000', '1,000'],
    ['999', '999'],
    ['0', '0'],
  ])('%s → %s', (digits, grouped) => {
    expect(groupDigits(digits)).toBe(grouped)
  })

  it('leaves anything that is not a plain digit string untouched', () => {
    expect(groupDigits('n/a')).toBe('n/a')
    expect(groupDigits('-1000')).toBe('-1000')
  })
})
