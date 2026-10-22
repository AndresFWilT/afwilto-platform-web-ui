import { Navigate, type RouteObject } from 'react-router-dom'
import { AddressAggregationPage } from '@/features/address-aggregation/ui/pages/AddressAggregationPage'
import { CidrToRangePage } from '@/features/cidr-to-range/ui/pages/CidrToRangePage'
import { PrefixTablesPage } from '@/features/prefix-tables/ui/pages/PrefixTablesPage'
import { RangeToCidrPage } from '@/features/range-to-cidr/ui/pages/RangeToCidrPage'
import { NotFoundPage } from '@/shared/ui/pages/NotFoundPage'

// Relative to the shell's /slab/cidr/* mount (spec 17 FR-7).
export const routes: RouteObject[] = [
  { index: true, element: <Navigate to="range" replace /> },
  { path: 'range', element: <CidrToRangePage /> },
  { path: 'summarize', element: <RangeToCidrPage /> },
  { path: 'aggregate', element: <AddressAggregationPage /> },
  { path: 'tables', element: <PrefixTablesPage /> },
  { path: '*', element: <NotFoundPage /> },
]
