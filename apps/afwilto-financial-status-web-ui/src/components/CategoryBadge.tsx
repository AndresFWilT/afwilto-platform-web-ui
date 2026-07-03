const colorMap: Record<string, string> = {
  // Income
  Salary:      'bg-income-500/15 text-income-400',
  Freelance:   'bg-primary-400/15 text-primary-400',
  Investment:  'bg-purple-500/15 text-purple-400',
  Bonus:       'bg-warning-500/15 text-warning-400',
  // Expense
  Housing:     'bg-purple-700/20 text-purple-400',
  Food:        'bg-warning-500/15 text-warning-400',
  Transport:   'bg-primary-600/20 text-primary-300',
  Entertainment:'bg-expense-500/15 text-expense-400',
  Health:      'bg-income-600/15 text-income-400',
  Education:   'bg-purple-500/15 text-purple-300',
  Utilities:   'bg-dark-500/60 text-text-secondary',
  Other:       'bg-dark-500/40 text-text-muted',
}

export default function CategoryBadge({ category }: { category: string }) {
  const cls = colorMap[category] ?? colorMap.Other
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {category}
    </span>
  )
}
