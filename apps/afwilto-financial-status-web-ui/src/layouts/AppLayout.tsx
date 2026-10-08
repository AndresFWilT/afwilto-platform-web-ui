import { NavLink, Outlet } from 'react-router-dom'
import { BaseLayout } from '@afwilto/design-system'

const sections = [
  { to: '/finance',          label: 'Dashboard', end: true },
  { to: '/finance/incomes',  label: 'Incomes' },
  { to: '/finance/expenses', label: 'Expenses' },
  { to: '/finance/goals',    label: 'Goals' },
  { to: '/finance/credits',  label: 'Credits' },
  { to: '/finance/design',   label: 'Design' },
]

export default function AppLayout() {
  return (
    <BaseLayout>
      <nav className="flex flex-wrap gap-1 pb-3 mb-8 border-b border-surface-border">
        {sections.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-700 text-primary-300'
                  : 'text-neutral-400 hover:bg-brand-800 hover:text-neutral-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </BaseLayout>
  )
}
