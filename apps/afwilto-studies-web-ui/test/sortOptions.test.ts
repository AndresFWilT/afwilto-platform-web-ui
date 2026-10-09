import { describe, it, expect } from 'vitest'
import { SORT_OPTIONS, applySortToParams, sortFromParams } from '../src/pages/shared/sortOptions'

const params = (query: string) => new URLSearchParams(query)

describe('sort ↔ URL query (AC-F4, S07-7)', () => {
  it.each(SORT_OPTIONS)('"$label" round-trips through the query', ({ sort }) => {
    expect(sortFromParams(applySortToParams(params(''), sort))).toEqual(sort)
  })

  it('the default writes no params', () => {
    expect(applySortToParams(params('sort=updatedAt&order=desc'), { field: 'title', order: 'asc' }).toString()).toBe('')
  })

  it('a non-default sort writes both params and keeps unrelated ones', () => {
    expect(applySortToParams(params('x=1'), { field: 'updatedAt', order: 'desc' }).toString()).toBe(
      'x=1&sort=updatedAt&order=desc'
    )
  })

  it.each(['', 'sort=size', 'sort=title', 'order=desc', 'sort=title&order=sideways', 'sort=updatedAt&order=asc'])(
    'a pair that matches no offered option ("%s") reads as A–Z',
    (query) => {
      expect(sortFromParams(params(query))).toEqual({ field: 'title', order: 'asc' })
    }
  )
})
