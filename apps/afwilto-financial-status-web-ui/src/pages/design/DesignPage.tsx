import { Badge, Button, Card } from '@afwilto/design-system'
import StatCard from '../../components/StatCard'
import CategoryBadge from '../../components/CategoryBadge'

const palettes = [
  { title: 'Primary (Blue)', swatches: [['Light', 'bg-primary-300'], ['Accent', 'bg-primary-500'], ['Dark', 'bg-primary-700']] },
  { title: 'Info (Cyan)', swatches: [['Light', 'bg-info-300'], ['Main', 'bg-info-400'], ['Dark', 'bg-info-500']] },
  { title: 'Domain', swatches: [['Income', 'bg-income-500'], ['Expense', 'bg-expense-500'], ['Warning', 'bg-warning-500']] },
  { title: 'Surfaces', swatches: [['Base', 'bg-surface-base'], ['Raised', 'bg-surface-raised'], ['Overlay', 'bg-surface-overlay']] },
]

export default function DesignPage() {
  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-primary-400">Design System</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Shared @afwilto/design-system tokens & components, plus finance domain aliases
        </p>
      </div>

      <section>
        <h2 className="text-neutral-100 text-sm font-semibold uppercase tracking-wider mb-4">Color Palette</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {palettes.map(({ title, swatches }) => (
            <Card key={title} padding="none" className="p-4">
              <p className="text-neutral-500 text-xs uppercase tracking-widest mb-3">{title}</p>
              <div className="space-y-2">
                {swatches.map(([label, cls]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded border border-surface-border ${cls}`} />
                    <span className="text-neutral-400 text-xs">{label}</span>
                    <span className="text-neutral-500 text-xs ml-auto font-mono">{cls.replace('bg-', '')}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-neutral-100 text-sm font-semibold uppercase tracking-wider mb-4">Stat Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Income" value="+ $4,200.00" sub="April 2026" variant="income" />
          <StatCard label="Total Expenses" value="- $2,830.00" sub="April 2026" variant="expense" />
          <StatCard label="Net Balance" value="$1,370.00" sub="April 2026" variant="primary" />
        </div>
      </section>

      <section>
        <h2 className="text-neutral-100 text-sm font-semibold uppercase tracking-wider mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm">Primary</Button>
          <Button variant="secondary" size="sm">Secondary</Button>
          <Button variant="ghost" size="sm">Ghost</Button>
          <Button variant="danger" size="sm">Danger — Expense</Button>
          <Button variant="success" size="sm">Success — Income</Button>
          <Button variant="info" size="sm">Info — Credit</Button>
          <Button variant="primary" size="sm" loading>Loading</Button>
        </div>
      </section>

      <section>
        <h2 className="text-neutral-100 text-sm font-semibold uppercase tracking-wider mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-neutral-100 text-sm font-semibold uppercase tracking-wider mb-4">Category Badges</h2>
        <div className="flex flex-wrap gap-2">
          {['Salary', 'Freelance', 'Investment', 'Housing', 'Food', 'Health', 'Other'].map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
        </div>
      </section>
    </div>
  )
}
