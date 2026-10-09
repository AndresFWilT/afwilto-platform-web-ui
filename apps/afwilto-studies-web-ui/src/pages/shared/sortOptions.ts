import { DEFAULT_NOTE_SORT, type NoteSort } from '@/application/ports'

export interface SortOption {
  label: string
  sort: NoteSort
}

// AC-F4: the closed set of sorts the UI offers, in display order.
export const SORT_OPTIONS: SortOption[] = [
  { label: 'A–Z', sort: { field: 'title', order: 'asc' } },
  { label: 'Z–A', sort: { field: 'title', order: 'desc' } },
  { label: 'Recently updated', sort: { field: 'updatedAt', order: 'desc' } },
  { label: 'Recently created', sort: { field: 'createdAt', order: 'desc' } },
  { label: 'Oldest first', sort: { field: 'createdAt', order: 'asc' } },
]

export function sortKey(sort: NoteSort): string {
  return `${sort.field}:${sort.order}`
}

/** The URL pair must match an offered option exactly; anything else is A–Z. */
export function sortFromParams(params: URLSearchParams): NoteSort {
  const field = params.get('sort')
  const order = params.get('order')
  const match = SORT_OPTIONS.find((o) => o.sort.field === field && o.sort.order === order)
  return match ? match.sort : DEFAULT_NOTE_SORT
}

/** Writes the sort into the query; the default leaves no params behind. */
export function applySortToParams(params: URLSearchParams, sort: NoteSort): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete('sort')
  next.delete('order')
  if (sortKey(sort) !== sortKey(DEFAULT_NOTE_SORT)) {
    next.set('sort', sort.field)
    next.set('order', sort.order)
  }
  return next
}
