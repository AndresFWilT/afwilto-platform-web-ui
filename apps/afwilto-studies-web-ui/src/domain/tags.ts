import { runeLength, splitFields } from './validation'

// Mirror of studies-mngr domain/tag.go (FR-5): fields joined by '-', lowercased,
// then required → max_length → format. `rule` is '' when the tag is valid.

const TAG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_TAG_LENGTH = 40
export const MAX_TAGS = 10

/** Go strings.ToLower maps U+0130 (İ) to a plain i; JS adds a combining dot. */
function goLower(value: string): string {
  return value.replace(/\u0130/g, 'i').toLowerCase()
}

export function normalizeTag(raw: string): { tag: string; rule: string } {
  const tag = goLower(splitFields(raw).join('-'))
  if (tag === '') return { tag: '', rule: 'required' }
  if (runeLength(tag) > MAX_TAG_LENGTH) return { tag: '', rule: 'max_length' }
  if (!TAG_PATTERN.test(tag)) return { tag: '', rule: 'format' }
  return { tag, rule: '' }
}

/** Adds one raw tag to a note's tag list (Slice 09b §2.2): duplicates merge silently. */
export function addTag(tags: string[], raw: string): { tags: string[]; error?: string } {
  if (splitFields(raw).length === 0) return { tags }
  const { tag, rule } = normalizeTag(raw)
  if (rule) return { tags, error: 'Tags are lowercase words joined by dashes (max 40 characters)' }
  if (tags.includes(tag)) return { tags }
  if (tags.length >= MAX_TAGS) return { tags, error: 'At most 10 tags' }
  return { tags: [...tags, tag] }
}
