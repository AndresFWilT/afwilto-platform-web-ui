import { useCallback, useState, type DependencyList } from 'react'
import { useAsync, type AsyncState } from './useAsync'

/**
 * useAsync plus an explicit reload that keeps the last loaded data on screen
 * while it refetches (Slice 09a-2 review, F2/F5): open dialogs, expand state
 * and focus survive, and the page never flashes back to a skeleton.
 */
export function useReloadable<T>(
  load: () => Promise<T>,
  deps: DependencyList
): { state: AsyncState<T>; data: T | undefined; reload: () => void } {
  const [reloadKey, setReloadKey] = useState(0)
  const state = useAsync(load, [...deps, reloadKey])
  const [last, setLast] = useState<T>()
  if (state.status === 'success' && state.data !== last) setLast(state.data)
  const reload = useCallback(() => setReloadKey((n) => n + 1), [])
  return { state, data: state.status === 'success' ? state.data : last, reload }
}
