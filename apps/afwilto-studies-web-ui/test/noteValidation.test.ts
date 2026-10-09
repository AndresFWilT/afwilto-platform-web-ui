import { describe, it, expect } from 'vitest'
import { validateContent, validateSlabLink, validateTitle } from '../src/domain/noteValidation'

describe('note validation mirrors (S09b-3, spec §2.2)', () => {
  it.each([
    ['Storage', null],
    ['  padded  ', null],
    ['', 'Title is required'],
    ['   ', 'Title is required'],
    ['x'.repeat(200), null],
    ['x'.repeat(201), 'At most 200 characters'],
    ['tab\there', 'Title cannot contain control characters'],
    ['🚀'.repeat(200), null],
  ])('validateTitle(%j) → %j', (value, expected) => {
    expect(validateTitle(value)).toBe(expected)
  })

  it.each([
    ['', null],
    ['# Heading\n\n$$x$$', null],
    ['a'.repeat(200_000), null],
    ['a'.repeat(200_001), 'At most 200,000 characters'],
    ['nul\u0000here', 'Content cannot contain NUL characters'],
  ])('validateContent(%#) → %j', (value, expected) => {
    expect(validateContent(value)).toBe(expected)
  })

  it.each([
    [{ label: 'Round robin lab', path: '/slab/ud/operative-systems' }, {}],
    [{ label: '', path: '/slab/ud' }, { label: 'Label is required' }],
    [{ label: 'x'.repeat(81), path: '/slab/ud' }, { label: 'At most 80 characters' }],
    [{ label: 'bell\u0007', path: '/slab/ud' }, { label: 'Label cannot contain control characters' }],
    [{ label: 'ok', path: '/finance' }, { path: 'Use a path like /slab/ud/operative-systems' }],
    [{ label: 'ok', path: 'https://x.com/slab/a' }, { path: 'Use a path like /slab/ud/operative-systems' }],
    [{ label: 'ok', path: '/slab/' }, { path: 'Use a path like /slab/ud/operative-systems' }],
    [{ label: 'ok', path: '/slab/UPPER' }, { path: 'Use a path like /slab/ud/operative-systems' }],
    [{ label: '', path: '/nope' }, { label: 'Label is required', path: 'Use a path like /slab/ud/operative-systems' }],
  ])('validateSlabLink(%j) → %j', (link, expected) => {
    expect(validateSlabLink(link)).toEqual(expected)
  })
})
