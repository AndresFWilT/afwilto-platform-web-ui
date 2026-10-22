import { describe, it, expect } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useCalculation } from '../src/shared/lib/useCalculation'
import { deferred } from './support/fakeCalculator'

// Review follow-up: a slow earlier answer never overwrites a newer one.
describe('useCalculation', () => {
  it('keeps only the latest response', async () => {
    const slow = deferred<string>()
    const fast = deferred<string>()
    const answers: Record<string, Promise<string>> = { slow: slow.promise, fast: fast.promise }
    const { result } = renderHook(() => useCalculation((key: string) => answers[key]))

    act(() => {
      void result.current.run('slow')
      void result.current.run('fast')
    })
    await act(async () => fast.resolve('fast answer'))
    await act(async () => slow.resolve('slow answer'))

    await waitFor(() => expect(result.current.state).toEqual({ status: 'done', result: 'fast answer' }))
  })
})
