import { hasControl, runeLength, trimSpace } from './validation'

// Client mirrors of the note rules (Slice 09b §2.2). The server stays
// authoritative; these only stop obviously invalid input before a request.

const SLAB_PATH = /^\/slab(\/[a-z0-9-]+)+$/
export const MAX_CONTENT = 200_000
export const MAX_SLAB_LINKS = 10

export function validateTitle(value: string): string | null {
  const title = trimSpace(value)
  if (title === '') return 'Title is required'
  if (hasControl(title)) return 'Title cannot contain control characters'
  if (runeLength(title) > 200) return 'At most 200 characters'
  return null
}

export function validateContent(value: string): string | null {
  if (value.includes('\u0000')) return 'Content cannot contain NUL characters'
  if (value.length > MAX_CONTENT && runeLength(value) > MAX_CONTENT) return 'At most 200,000 characters'
  return null
}

export function validateSlabLink(link: { label: string; path: string }): { label?: string; path?: string } {
  const errors: { label?: string; path?: string } = {}
  const label = trimSpace(link.label)
  if (label === '') errors.label = 'Label is required'
  else if (hasControl(label)) errors.label = 'Label cannot contain control characters'
  else if (runeLength(label) > 80) errors.label = 'At most 80 characters'
  if (!SLAB_PATH.test(link.path)) errors.path = 'Use a path like /slab/ud/operative-systems'
  return errors
}
