import { useEffect, useRef, useState } from 'react'

/** A server-synced countdown: a new `sync` (with a new token) restarts it from the server's seconds. */
export interface CountdownSync {
  seconds: number
  /** Changes with every server answer, even when `seconds` repeats. */
  token: number
}

const TICK_MS = 250

/**
 * Whole seconds left, counted against the clock (so a throttled background tab catches up).
 * It restarts from `sync.seconds` whenever the token changes, stops at 0 and calls `onExpire`
 * once per sync. There is no pause. `undefined` without a sync (an untimed attempt).
 */
export function useCountdown(sync: CountdownSync | undefined, onExpire: () => void): number | undefined {
  const [left, setLeft] = useState<number | undefined>(sync?.seconds)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  const token = sync?.token
  const seconds = sync?.seconds
  useEffect(() => {
    if (token === undefined || seconds === undefined) {
      setLeft(undefined)
      return
    }
    const deadline = Date.now() + seconds * 1000
    let expired = false
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0 && !expired) {
        expired = true
        onExpireRef.current()
      }
    }
    tick()
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [token, seconds])

  return left
}
