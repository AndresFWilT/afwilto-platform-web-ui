import type { ReactNode } from 'react'
import type { NavLink } from '../../organisms/Navbar'

export interface BaseLayoutProps {
  children: ReactNode
  navLinks?: NavLink[]
}
