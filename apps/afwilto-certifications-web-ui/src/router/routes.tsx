import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, ErrorBoundary } from '@afwilto/design-system'

const CatalogPage = lazy(() =>
  import('@/pages/Catalog/CatalogPage').then((m) => ({ default: m.CatalogPage }))
)
const RoadmapPage = lazy(() =>
  import('@/pages/Roadmap/RoadmapPage').then((m) => ({ default: m.RoadmapPage }))
)
const CertDetailPage = lazy(() =>
  import('@/pages/Detail/CertDetailPage').then((m) => ({ default: m.CertDetailPage }))
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

export const routes: RouteObject[] = [
  { path: '',          element: withSuspense(CatalogPage) },
  { path: 'roadmap',   element: withSuspense(RoadmapPage) },
  { path: ':certSlug', element: withSuspense(CertDetailPage) },
  { path: '*',         element: withSuspense(CertDetailPage) },
]
