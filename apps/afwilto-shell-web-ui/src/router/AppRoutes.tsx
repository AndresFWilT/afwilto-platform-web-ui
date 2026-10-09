import { Routes, Route } from 'react-router-dom'
import { RemoteSlot } from '@/remotes/RemoteSlot'
import {
  SlabHomeApp,
  AfwiltoHomeApp,
  UDApp,
  MatiApp,
  FinanceApp,
  CertificationsApp,
  LovePointsBankApp,
  StudiesApp,
} from '@/remotes/remotes'
import { DesignSystemPage } from '@/pages/DesignSystem'
import { NotFoundPage } from '@/pages/NotFound'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RemoteSlot component={AfwiltoHomeApp} />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="/slab" element={<RemoteSlot component={SlabHomeApp} />} />
      <Route path="/slab/ud/*" element={<RemoteSlot component={UDApp} />} />
      <Route path="/slab/mati/*" element={<RemoteSlot component={MatiApp} />} />
      <Route path="/finance/*" element={<RemoteSlot component={FinanceApp} />} />
      <Route path="/certifications/*" element={<RemoteSlot component={CertificationsApp} />} />
      <Route path="/love-points-bank/*" element={<RemoteSlot component={LovePointsBankApp} />} />
      <Route path="/studies/*" element={<RemoteSlot component={StudiesApp} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
