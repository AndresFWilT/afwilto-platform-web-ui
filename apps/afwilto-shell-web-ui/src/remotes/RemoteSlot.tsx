import { Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { ErrorBoundary, Spinner } from '@afwilto/design-system'

interface RemoteSlotProps {
  component: LazyExoticComponent<ComponentType>
}

function LoadingFallback() {
  return (
    <div
      data-testid="remote-loading"
      className="flex min-h-screen items-center justify-center bg-surface-base"
    >
      <Spinner size="lg" />
    </div>
  )
}

export function RemoteSlot({ component: Remote }: RemoteSlotProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Remote />
      </Suspense>
    </ErrorBoundary>
  )
}
