import { useEffect, useState, type DependencyList } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

const LOADING = { status: 'loading' } as const

function sameDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
}

/**
 * Runs `load` whenever `deps` change. Each result is stored with the deps that
 * produced it, so a render under new deps reads "loading" instead of the
 * previous result, and results of superseded runs are dropped.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [result, setResult] = useState<{ deps: DependencyList; state: AsyncState<T> }>({ deps, state: LOADING })

  useEffect(() => {
    let current = true
    load().then(
      (data) => current && setResult({ deps, state: { status: 'success', data } }),
      (e: unknown) =>
        current && setResult({ deps, state: { status: 'error', error: e instanceof Error ? e : new Error(String(e)) } })
    )
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return sameDeps(result.deps, deps) ? result.state : LOADING
}
