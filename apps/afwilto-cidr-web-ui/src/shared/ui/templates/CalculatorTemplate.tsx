import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { BaseLayout, Text } from '@afwilto/design-system'

const TABS = [
  { label: 'CIDR → Range', to: '/slab/cidr/range' },
  { label: 'Range → CIDR', to: '/slab/cidr/summarize' },
  { label: 'Aggregate', to: '/slab/cidr/aggregate' },
  { label: 'Prefix tables', to: '/slab/cidr/tables' },
]

/** Page chrome for every calculator: header, links, tab bar, content slot. */
export function CalculatorTemplate({ children }: { children: ReactNode }) {
  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <header className="flex flex-col gap-2">
          <Link to="/slab" className="text-sm text-neutral-400 hover:text-neutral-100 self-start">
            ← All lab projects
          </Link>
          <Text variant="h1" color="default">
            CIDR Calculator
          </Text>
          <Text variant="body" color="muted">
            IPv4 and IPv6 subnet math, computed by a hexagonal Ruby service.{' '}
            <Link to="/studies/tags/cidr" className="text-primary-400 hover:text-primary-300">
              Learn the theory in Studies →
            </Link>
          </Text>
        </header>

        <nav aria-label="Calculators" className="flex flex-wrap gap-2 border-b border-surface-border pb-3">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-500/20 text-primary-300' : 'text-neutral-400 hover:text-neutral-100'
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {children}
      </div>
    </BaseLayout>
  )
}
