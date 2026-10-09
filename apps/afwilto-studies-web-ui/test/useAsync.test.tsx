import { describe, it, expect } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAsync, type AsyncState } from '../src/hooks/useAsync'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe('useAsync', () => {
  it('never renders the previous key’s data under a new key (no stale frame)', async () => {
    const renders: Array<{ id: string; state: AsyncState<string> }> = []
    const pendingB = deferred<string>()
    const { rerender } = renderHook(
      ({ id }) => {
        const state = useAsync(() => (id === 'A' ? Promise.resolve('A') : pendingB.promise), [id])
        renders.push({ id, state })
        return state
      },
      { initialProps: { id: 'A' } }
    )
    await waitFor(() => expect(renders.at(-1)!.state).toEqual({ status: 'success', data: 'A' }))

    rerender({ id: 'B' })
    const underB = renders.filter((r) => r.id === 'B')
    expect(underB.length).toBeGreaterThan(0)
    for (const r of underB) expect(r.state).toEqual({ status: 'loading' })

    await act(async () => pendingB.resolve('B'))
    expect(renders.at(-1)!.state).toEqual({ status: 'success', data: 'B' })
  })

  it('drops the result of a superseded run that resolves late', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const { result, rerender } = renderHook(({ id }) => useAsync(() => (id === 'slow' ? slow.promise : fast.promise), [id]), {
      initialProps: { id: 'slow' },
    })
    rerender({ id: 'fast' })
    await act(async () => fast.resolve('fast'))
    await act(async () => slow.resolve('slow'))
    expect(result.current).toEqual({ status: 'success', data: 'fast' })
  })

  it('reports a rejection as an error state', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(new Error('down')), []))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.status === 'error' && result.current.error.message).toBe('down')
  })
})
