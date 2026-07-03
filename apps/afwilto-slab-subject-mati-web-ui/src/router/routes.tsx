import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, ErrorBoundary } from '@afwilto/design-system'
import { SubjectPage } from '@/pages/Subject'

const MatiPage = lazy(() =>
  import('@/pages/Mati').then((m) => ({ default: m.MatiPage }))
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage }))
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
  { path: '',             element: withSuspense(MatiPage) },
  { path: ':subjectSlug', element: <SubjectPage /> },
  { path: '*',            element: withSuspense(NotFoundPage) },
]
