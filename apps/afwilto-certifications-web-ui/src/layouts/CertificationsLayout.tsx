import { Outlet } from 'react-router-dom'
import { BaseLayout } from '@afwilto/design-system'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Certifications', to: '/certifications' },
  { label: 'Timeline', to: '/certifications/timeline' },
  { label: 'Categories', to: '/certifications/categories' },
]

export function CertificationsLayout() {
  return (
    <BaseLayout navLinks={NAV_LINKS}>
      <Outlet />
    </BaseLayout>
  )
}
