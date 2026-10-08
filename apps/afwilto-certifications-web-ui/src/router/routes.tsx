import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, ErrorBoundary } from '@afwilto/design-system'
import { CertificationsLayout } from '@/layouts/CertificationsLayout'

const JourneyListPage = lazy(() =>
  import('@/pages/Journey/JourneyListPage').then((m) => ({ default: m.JourneyListPage }))
)
const CertificationDetailPage = lazy(() =>
  import('@/pages/Detail/CertificationDetailPage').then((m) => ({ default: m.CertificationDetailPage }))
)
const CertificationFormPage = lazy(() =>
  import('@/pages/Form/CertificationFormPage').then((m) => ({ default: m.CertificationFormPage }))
)
const CertificationEditPage = lazy(() =>
  import('@/pages/Form/CertificationEditPage').then((m) => ({ default: m.CertificationEditPage }))
)
const TimelinePage = lazy(() =>
  import('@/pages/Timeline/TimelinePage').then((m) => ({ default: m.TimelinePage }))
)
const CategoryListPage = lazy(() =>
  import('@/pages/Categories/CategoryListPage').then((m) => ({ default: m.CategoryListPage }))
)
const CategoryFormPage = lazy(() =>
  import('@/pages/Categories/CategoryFormPage').then((m) => ({ default: m.CategoryFormPage }))
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
    <div className="flex items-center justify-center py-16">
      <span className="text-neutral-400">{label}</span>
    </div>
  )
}

// Child routes rendered inside CertificationsLayout's <Outlet/> (navbar + footer).
export const childRoutes: RouteObject[] = [
  { path: '',               element: withSuspense(JourneyListPage) },
  { path: 'new',            element: withSuspense(CertificationFormPage) },
  { path: 'timeline',       element: withSuspense(TimelinePage) },
  { path: 'categories',     element: withSuspense(CategoryListPage) },
  { path: 'categories/new', element: withSuspense(CategoryFormPage) },
  { path: ':id',            element: withSuspense(CertificationDetailPage) },
  { path: ':id/edit',       element: withSuspense(CertificationEditPage) },
  { path: '*',              element: <Stub label="Not found" /> },
]

export const routes: RouteObject[] = [
  {
    element: <CertificationsLayout />,
    children: childRoutes,
  },
]
