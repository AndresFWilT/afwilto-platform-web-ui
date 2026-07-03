import { Routes, Route } from 'react-router-dom'
import { RemoteSlot } from '@/remotes/RemoteSlot'
import { LegacyApp } from '@/remotes/remotes'
import { DesignSystemPage } from '@/pages/DesignSystem'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/design-system" element={<DesignSystemPage />} />
      {/* legacy owns everything else (incl. its own 404) until Phases 2-7 strip it */}
      <Route path="*" element={<RemoteSlot component={LegacyApp} />} />
    </Routes>
  )
}
