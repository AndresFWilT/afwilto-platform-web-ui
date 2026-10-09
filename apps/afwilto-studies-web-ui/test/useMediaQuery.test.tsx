import { describe, it, expect, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from '../src/hooks/useMediaQuery'

// A matchMedia fake with listeners keyed by query (CodeMirror registers its own "print" one).
function fakeMatchMedia(initial: Record<string, boolean>) {
  const state = { ...initial }
  const listeners = new Map<string, Set<() => void>>()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return state[query] ?? false
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.set(query, (listeners.get(query) ?? new Set()).add(fn)),
      removeEventListener: (_: string, fn: () => void) => listeners.get(query)?.delete(fn),
    }),
  })
  return {
    set(query: string, value: boolean) {
      state[query] = value
      listeners.get(query)?.forEach((fn) => fn())
    },
    count: (query: string) => listeners.get(query)?.size ?? 0,
  }
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('useMediaQuery', () => {
  it('reads the query on the first render, before any effect', () => {
    fakeMatchMedia({ '(min-width: 1024px)': true })
    const first: boolean[] = []
    renderHook(() => {
      const v = useMediaQuery('(min-width: 1024px)', false)
      first.push(v)
      return v
    })
    expect(first[0]).toBe(true)
  })

  it('follows live changes and unsubscribes on unmount', () => {
    const mm = fakeMatchMedia({ '(min-width: 1024px)': false })
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)', true))
    expect(result.current).toBe(false)
    act(() => mm.set('(min-width: 1024px)', true))
    expect(result.current).toBe(true)
    unmount()
    expect(mm.count('(min-width: 1024px)')).toBe(0)
  })

  it('returns the fallback without matchMedia', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)', true))
    expect(result.current).toBe(true)
  })
})
