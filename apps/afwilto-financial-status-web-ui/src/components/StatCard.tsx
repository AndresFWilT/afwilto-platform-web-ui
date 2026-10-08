import { type ReactNode } from 'react'
import { Card } from '@afwilto/design-system'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  variant?: 'income' | 'expense' | 'primary' | 'accent'
  icon?: ReactNode
}

const valueColor = {
  income:  'text-income-500',
  expense: 'text-expense-500',
  primary: 'text-primary-400',
  accent:  'text-info-400',
}

export default function StatCard({ label, value, sub, variant = 'primary', icon }: StatCardProps) {
  return (
    <Card padding="none" className="p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-neutral-500 text-xs uppercase tracking-widest">{label}</p>
        {icon && <span className="text-neutral-500">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${valueColor[variant]}`}>{value}</p>
      {sub && <p className="text-neutral-400 text-xs">{sub}</p>}
    </Card>
  )
}
