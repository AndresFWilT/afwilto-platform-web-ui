// Client-side mirrors of studies-mngr's field rules (Slice 09a §2.2): they
// stop obviously invalid input before a request. The server stays
// authoritative for everything only it can know (duplicates, depth, cycles).

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/
// Go's unicode.IsSpace set, which strings.TrimSpace strips. Unlike JS trim() it
// includes U+0085 (NEL) and excludes U+FEFF (BOM).
const GO_SPACE = '[\\t\\n\\v\\f\\r \\u0085\\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]'
const GO_TRIM = new RegExp(`^${GO_SPACE}+|${GO_SPACE}+$`, 'g')

/** strings.TrimSpace, so client mirrors and the in-memory store trim like studies-mngr. */
export function trimSpace(value: string): string {
  return value.replace(GO_TRIM, '')
}

/** strings.Fields: the runs of non-space text, split on Go's unicode.IsSpace set. */
export function splitFields(value: string): string[] {
  return value.split(new RegExp(`${GO_SPACE}+`)).filter(Boolean)
}

/** unicode.IsControl, used for single-line text (names, titles, labels). */
export function hasControl(value: string): boolean {
  return CONTROL.test(value)
}

/** Characters as Go counts runes (code points, not UTF-16 units). */
export function runeLength(value: string): number {
  return [...value].length
}
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

/** Characters as the backend counts them (Unicode code points, not UTF-16 units). */
function length(value: string): number {
  return [...value].length
}

/** A single-line name: trimmed, 1..max characters, no control characters. */
export function validateName(value: string, max: number): string | null {
  const trimmed = trimSpace(value)
  if (trimmed === '') return 'Name is required'
  if (CONTROL.test(trimmed)) return 'Name cannot contain control characters'
  if (length(trimmed) > max) return `At most ${max} characters`
  return null
}

export function validateColor(value: string): string | null {
  return HEX_COLOR.test(trimSpace(value)) ? null : 'Use a hex color like #22D3EE'
}

export function validateDescription(value: string): string | null {
  return length(value) > 2000 ? 'At most 2000 characters' : null
}
