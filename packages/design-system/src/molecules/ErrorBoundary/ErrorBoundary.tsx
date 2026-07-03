import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary.types'

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error.message, info.componentStack)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) {
      return this.props.fallback(this.state.error!, this.reset)
    }

    return <DefaultFallback error={this.state.error} onReset={this.reset} />
  }
}

function DefaultFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-xl p-8 text-center"
      style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)' }}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl select-none">⚠</span>
        <p className="text-base font-semibold text-neutral-100">Something went wrong</p>
        <p className="text-sm text-neutral-400 max-w-sm">
          A render error occurred in this section. You can try to recover or navigate home.
        </p>
        {error && (
          <p className="mt-1 rounded bg-surface-overlay px-3 py-1.5 font-mono text-xs text-red-400 max-w-sm truncate">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border px-4 py-2 text-sm font-medium text-neutral-300 transition-colors"
          style={{ borderColor: 'var(--color-surface-border)', backgroundColor: 'var(--color-surface-overlay)' }}
        >
          Go home
        </a>
      </div>
    </div>
  )
}
