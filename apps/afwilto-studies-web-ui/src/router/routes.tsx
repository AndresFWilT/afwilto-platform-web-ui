import type { RouteObject } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, ErrorBoundary } from '@afwilto/design-system'
import { StudiesLayout } from '@/layouts/StudiesLayout'

const LibraryPage = lazy(() => import('@/pages/Library/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const SubjectPage = lazy(() => import('@/pages/Subject/SubjectPage').then((m) => ({ default: m.SubjectPage })))
const NotePage = lazy(() => import('@/pages/Note/NotePage').then((m) => ({ default: m.NotePage })))
const CategoriesPage = lazy(() =>
  import('@/pages/Categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
)
const CategoryPage = lazy(() => import('@/pages/Category/CategoryPage').then((m) => ({ default: m.CategoryPage })))
const KindsPage = lazy(() => import('@/pages/Kinds/KindsPage').then((m) => ({ default: m.KindsPage })))
const NoteEditorPage = lazy(() =>
  import('@/pages/NoteEditor/NoteEditorPage').then((m) => ({ default: m.NoteEditorPage }))
)
const ExamsPage = lazy(() =>
  import('@/features/manage-exams/ui/pages/ExamsPage').then((m) => ({ default: m.ExamsPage }))
)
const NewExamPage = lazy(() =>
  import('@/features/manage-exams/ui/pages/NewExamPage').then((m) => ({ default: m.NewExamPage }))
)
const TagPage = lazy(() => import('@/pages/Tag/TagPage').then((m) => ({ default: m.TagPage })))

function Fallback() {
  return (
    <div className="flex items-center justify-center py-16">
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

function NotFound() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="text-neutral-400">Not found</span>
    </div>
  )
}

// Child routes rendered inside StudiesLayout's <Outlet/> (Spec 16 §9.1; the
// note editor routes are Slice 09b's).
export const childRoutes: RouteObject[] = [
  { path: '', element: withSuspense(LibraryPage) },
  { path: 'categories', element: withSuspense(CategoriesPage) },
  { path: 'categories/:categoryId', element: withSuspense(CategoryPage) },
  { path: 'kinds', element: withSuspense(KindsPage) },
  { path: 'subjects/:subjectId', element: withSuspense(SubjectPage) },
  { path: 'subjects/:subjectId/exams', element: withSuspense(ExamsPage) },
  { path: 'subjects/:subjectId/exams/new', element: withSuspense(NewExamPage) },
  { path: 'subjects/:subjectId/notes/new', element: withSuspense(NoteEditorPage) },
  { path: 'notes/:noteId', element: withSuspense(NotePage) },
  { path: 'notes/:noteId/edit', element: withSuspense(NoteEditorPage) },
  { path: 'tags/:tag', element: withSuspense(TagPage) },
  { path: '*', element: <NotFound /> },
]

export const routes: RouteObject[] = [
  {
    element: <StudiesLayout />,
    children: childRoutes,
  },
]
