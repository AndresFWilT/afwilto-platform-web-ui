import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const VARIANTS = {
  primary: 'bg-primary-500 text-white hover:bg-primary-400',
  ghost: 'bg-transparent text-neutral-300 hover:bg-brand-800 hover:text-neutral-100',
}

/** A router link that looks like a design-system Button. */
export function ButtonLink({ to, variant = 'primary', children }: { to: string; variant?: keyof typeof VARIANTS; children: ReactNode }) {
  return (
    <Link to={to} className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${VARIANTS[variant]}`}>
      {children}
    </Link>
  )
}
