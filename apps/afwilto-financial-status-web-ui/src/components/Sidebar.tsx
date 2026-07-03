import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, TrendingDown, Target, CreditCard, Palette, X } from 'lucide-react'

const links = [
  { to: '/finance',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finance/incomes',  icon: TrendingUp,      label: 'Incomes'   },
  { to: '/finance/expenses', icon: TrendingDown,    label: 'Expenses'  },
  { to: '/finance/goals',    icon: Target,          label: 'Metas'     },
  { to: '/finance/credits',  icon: CreditCard,      label: 'Créditos'  },
  { to: '/finance/design',   icon: Palette,         label: 'Design'    },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="h-full bg-dark-800 border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-border">
        <div>
          <span className="text-primary-400 font-bold text-lg tracking-tight text-glow-primary">FinStatus</span>
          <p className="text-text-muted text-[10px] mt-0.5">Personal Finance</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text-primary p-1 rounded">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/finance'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-primary-400/10 text-primary-400 border border-primary-400/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-dark-700 border border-transparent'}`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-text-disabled text-[10px] uppercase tracking-widest">v1.0.0</p>
      </div>
    </div>
  )
}
