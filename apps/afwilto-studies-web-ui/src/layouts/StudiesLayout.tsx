import { Outlet } from 'react-router-dom'
import { BaseLayout } from '@afwilto/design-system'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Studies', to: '/studies' },
]

export function StudiesLayout() {
  return (
    <BaseLayout navLinks={NAV_LINKS}>
      <Outlet />
    </BaseLayout>
  )
}
