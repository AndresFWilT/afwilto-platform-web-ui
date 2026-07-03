import { type ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  variant?: 'income' | 'expense' | 'primary' | 'purple'
  icon?: ReactNode
  glow?: boolean
}

const variantMap = {
  income:  { value: 'text-income-500',  glow: '' },
  expense: { value: 'text-expense-500', glow: '' },
  primary: { value: 'text-primary-400 text-glow-primary', glow: 'glow-primary' },
  purple:  { value: 'text-purple-400',  glow: 'glow-purple' },
}

export default function StatCard({ label, value, sub, variant = 'primary', icon, glow }: StatCardProps) {
  const v = variantMap[variant]
  return (
    <div className={`bg-dark-700 rounded-xl border border-border p-5 flex flex-col gap-1 ${glow ? v.glow : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-text-muted text-xs uppercase tracking-widest">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${v.value}`}>{value}</p>
      {sub && <p className="text-text-secondary text-xs">{sub}</p>}
    </div>
  )
}
