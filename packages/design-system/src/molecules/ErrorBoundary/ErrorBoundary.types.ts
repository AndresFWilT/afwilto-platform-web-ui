import type { ReactNode } from 'react'

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}
