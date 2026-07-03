import { lazy } from 'react'

export const LegacyApp = lazy(() => import('mfe_legacy/App'))
export const SlabHomeApp = lazy(() => import('slab_home/App'))
export const AfwiltoHomeApp = lazy(() => import('afwilto_home/App'))
export const UDApp = lazy(() => import('ud/App'))
