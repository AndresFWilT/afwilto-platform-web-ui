/** A server-synced countdown: a new `sync` (with a new token) restarts it from the server's seconds. */
export interface CountdownSync {
  seconds: number
  /** Changes with every server answer, even when `seconds` repeats. */
  token: number
}

export function useCountdown(_sync: CountdownSync | undefined, _onExpire: () => void): number | undefined {
  return undefined
}
