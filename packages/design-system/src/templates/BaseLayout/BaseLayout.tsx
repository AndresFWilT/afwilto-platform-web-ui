import { Navbar } from '../../organisms/Navbar'
import { Footer } from '../../organisms/Footer'
import type { BaseLayoutProps } from './BaseLayout.types'

const DEFAULT_NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Design System', to: '/design-system' },
  { label: 'Projects', to: '/projects' },
]

export function BaseLayout({ children, navLinks = DEFAULT_NAV_LINKS }: BaseLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Navbar brand="AFWILTO Software Lab" links={navLinks} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}
