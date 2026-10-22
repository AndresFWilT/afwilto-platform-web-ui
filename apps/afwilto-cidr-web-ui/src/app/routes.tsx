import { Navigate, type RouteObject } from 'react-router-dom'
import { CidrToRangePage } from '@/features/cidr-to-range/ui/pages/CidrToRangePage'
import { NotFoundPage } from '@/shared/ui/pages/NotFoundPage'

// Relative to the shell's /slab/cidr/* mount (spec 17 FR-7).
export const routes: RouteObject[] = [
  { index: true, element: <Navigate to="range" replace /> },
  { path: 'range', element: <CidrToRangePage /> },
  { path: '*', element: <NotFoundPage /> },
]
