import { describe, it, expect } from 'vitest'
import { addTag, normalizeTag } from '../src/domain/tags'

// The Slice 06 normalization table (backend domain/tag.go), mirrored on the client.
describe('normalizeTag (FR-5, S09b-3)', () => {
  it.each([
    [' Cloud Security ', 'cloud-security', ''],
    ['IAM', 'iam', ''],
    ['cloud-security', 'cloud-security', ''],
    ['a b', 'a-b', ''], // NBSP is whitespace for Go strings.Fields
    ['  multi   space  ', 'multi-space', ''],
    ['', '', 'required'],
    ['   ', '', 'required'],
    ['bad_tag!', '', 'format'],
    ['-a', '', 'format'],
    ['a--b', '', 'format'],
    ['x'.repeat(40), 'x'.repeat(40), ''],
    ['x'.repeat(41), '', 'max_length'],
    ['İAM', 'iam', ''], // Go strings.ToLower maps U+0130 to plain i
  ])('%j → %j (rule %j)', (raw, tag, rule) => {
    expect(normalizeTag(raw)).toEqual({ tag, rule })
  })
})

describe('addTag (S09b-3)', () => {
  it('adds the normalized tag', () => {
    expect(addTag([], ' Cloud Security ')).toEqual({ tags: ['cloud-security'] })
  })

  it('merges a duplicate silently', () => {
    expect(addTag(['iam'], 'IAM')).toEqual({ tags: ['iam'] })
  })

  it('rejects an invalid tag with the UI message and keeps the list', () => {
    expect(addTag(['iam'], 'bad_tag!')).toEqual({
      tags: ['iam'],
      error: 'Tags are lowercase words joined by dashes (max 40 characters)',
    })
  })

  it('caps at 10 distinct tags, but a duplicate of an 11th is still fine', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `t${i}`)
    expect(addTag(ten, 'eleven')).toEqual({ tags: ten, error: 'At most 10 tags' })
    expect(addTag(ten, 'T3')).toEqual({ tags: ten })
  })

  it('ignores blank input without an error', () => {
    expect(addTag(['iam'], '   ')).toEqual({ tags: ['iam'] })
  })
})
