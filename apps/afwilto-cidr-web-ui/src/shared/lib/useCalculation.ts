import { useCallback, useRef, useState } from 'react'
import { CidrValidationError } from '@/cidr/application/errors'

export type CalculationState<R> =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'done'; result: R }
  | { status: 'invalid'; error: CidrValidationError }
  | { status: 'failed'; message: string }

/**
 * Runs one backend calculation at a time and keeps only the latest answer,
 * so a slow earlier response never overwrites a newer one.
 */
export function useCalculation<A extends unknown[], R>(calculate: (...args: A) => Promise<R>) {
  const [state, setState] = useState<CalculationState<R>>({ status: 'idle' })
  const latest = useRef(0)

  const run = useCallback(
    async (...args: A) => {
      const id = ++latest.current
      setState({ status: 'pending' })
      try {
        const result = await calculate(...args)
        if (id === latest.current) setState({ status: 'done', result })
      } catch (e) {
        if (id !== latest.current) return
        if (e instanceof CidrValidationError) setState({ status: 'invalid', error: e })
        else setState({ status: 'failed', message: e instanceof Error ? e.message : String(e) })
      }
    },
    [calculate]
  )

  return { state, run }
}
