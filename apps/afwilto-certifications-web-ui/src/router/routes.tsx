import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, ErrorBoundary } from '@afwilto/design-system'

const JourneyListPage = lazy(() =>
  import('@/pages/Journey/JourneyListPage').then((m) => ({ default: m.JourneyListPage }))
)
const CertificationDetailPage = lazy(() =>
  import('@/pages/Detail/CertificationDetailPage').then((m) => ({ default: m.CertificationDetailPage }))
)

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base">
      <Spinner size="lg" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

function Stub({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base">
      <span className="text-neutral-400">{label}</span>
    </div>
  )
}

export const routes: RouteObject[] = [
  { path: '',           element: withSuspense(JourneyListPage) },
  { path: 'new',        element: <Stub label="New certification — coming soon" /> },
  { path: 'timeline',   element: <Stub label="Timeline — coming soon" /> },
  { path: ':id',        element: withSuspense(CertificationDetailPage) },
  { path: ':id/edit',   element: <Stub label="Edit — coming soon" /> },
  { path: '*',          element: <Stub label="Not found" /> },
]
