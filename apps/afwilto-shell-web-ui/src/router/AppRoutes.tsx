import { Routes, Route } from 'react-router-dom'
import { RemoteSlot } from '@/remotes/RemoteSlot'
import { LegacyApp, SlabHomeApp, AfwiltoHomeApp, UDApp } from '@/remotes/remotes'
import { DesignSystemPage } from '@/pages/DesignSystem'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RemoteSlot component={AfwiltoHomeApp} />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="/slab" element={<RemoteSlot component={SlabHomeApp} />} />
      <Route path="/slab/ud/*" element={<RemoteSlot component={UDApp} />} />
      {/* legacy owns everything else (incl. its own 404) until Phases 4-7 strip it */}
      <Route path="*" element={<RemoteSlot component={LegacyApp} />} />
    </Routes>
  )
}
