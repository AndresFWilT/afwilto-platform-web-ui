import { Outlet } from 'react-router-dom'
import { BaseLayout } from '@afwilto/design-system'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Studies', to: '/studies' },
  { label: 'Categories', to: '/studies/categories' },
  { label: 'Kinds', to: '/studies/kinds' },
]

export function StudiesLayout() {
  return (
    <BaseLayout navLinks={NAV_LINKS}>
      <Outlet />
    </BaseLayout>
  )
}
