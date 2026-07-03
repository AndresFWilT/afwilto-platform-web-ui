import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { Text } from '../../atoms/Text'
import type { NavbarProps } from './Navbar.types'
import { useState } from 'react'

export function Navbar({ brand, links = [] }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="w-full border-b border-surface-border bg-surface-raised shadow-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Text variant="h4" color="primary" weight="bold">
              {brand}
            </Text>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-brand-700 text-primary-300'
                      : 'text-neutral-400 hover:bg-brand-800 hover:text-neutral-100'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-neutral-400 hover:bg-brand-800"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-brand-700 text-primary-300'
                      : 'text-neutral-400 hover:bg-brand-800 hover:text-neutral-100'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
