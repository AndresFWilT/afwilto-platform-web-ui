import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCountdown, type CountdownSync } from '../../src/shared/lib/useCountdown'

// Only the interval and the clock are faked: nothing else may tick behind the test's back.
beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'performance'] }))
afterEach(() => vi.useRealTimers())

const tick = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

describe('useCountdown', () => {
  it('counts down from the synced seconds, one per second', async () => {
    const { result } = renderHook(() => useCountdown({ seconds: 130, token: 0 }, () => {}))
    expect(result.current).toBe(130)
    await tick(3000)
    expect(result.current).toBe(127)
  })

  it('is undefined without a sync (an untimed attempt) and never expires', async () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(undefined, onExpire))
    await tick(10_000)
    expect(result.current).toBeUndefined()
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('stops at 0 and calls onExpire once (S09-3)', async () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown({ seconds: 5, token: 0 }, onExpire))
    await tick(4000)
    expect(onExpire).not.toHaveBeenCalled()
    await tick(1000)
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
    await tick(10_000)
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('a server already at 0 expires at once', async () => {
    const onExpire = vi.fn()
    renderHook(() => useCountdown({ seconds: 0, token: 0 }, onExpire))
    await tick(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('resyncs from a new token: the local 130 becomes the server\'s 100 (S09-4)', async () => {
    const { result, rerender } = renderHook(({ sync }: { sync: CountdownSync }) => useCountdown(sync, () => {}), {
      initialProps: { sync: { seconds: 150, token: 0 } },
    })
    await tick(20_000)
    expect(result.current).toBe(130)
    rerender({ sync: { seconds: 100, token: 1 } })
    await tick(0)
    expect(result.current).toBe(100)
    await tick(2000)
    expect(result.current).toBe(98)
  })

  it('a resync after expiry can expire again, and rounds partial seconds up', async () => {
    const onExpire = vi.fn()
    const { result, rerender } = renderHook(({ sync }: { sync: CountdownSync }) => useCountdown(sync, onExpire), {
      initialProps: { sync: { seconds: 1, token: 0 } },
    })
    await tick(1000)
    expect(onExpire).toHaveBeenCalledTimes(1)
    rerender({ sync: { seconds: 2, token: 1 } })
    await tick(500)
    expect(result.current).toBe(2)
    await tick(1500)
    expect(onExpire).toHaveBeenCalledTimes(2)
  })

  it('keeps calling the latest onExpire without restarting', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const sync = { seconds: 3, token: 0 }
    const { rerender } = renderHook(({ cb }: { cb: () => void }) => useCountdown(sync, cb), { initialProps: { cb: first } })
    await tick(1000)
    rerender({ cb: second })
    await tick(2000)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('measures elapsed time with performance.now(), so a wall-clock jump does not move the countdown (R6)', async () => {
    const { result } = renderHook(() => useCountdown({ seconds: 130, token: 0 }, () => {}))
    await tick(20_000)
    expect(result.current).toBe(110)
    vi.setSystemTime(Date.now() + 60_000)
    await tick(1000)
    expect(result.current).toBe(109)
  })
})
