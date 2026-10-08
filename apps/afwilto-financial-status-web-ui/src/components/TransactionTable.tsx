import { Trash2 } from 'lucide-react'
import { type Transaction, fmt } from '../types'
import CategoryBadge from './CategoryBadge'

interface Props {
  transactions: Transaction[]
  onDelete?: (id: string) => void
  emptyMessage?: string
}

export default function TransactionTable({ transactions, onDelete, emptyMessage = 'No transactions found.' }: Props) {
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  if (!sorted.length)
    return <p className="text-neutral-500 text-sm text-center py-10">{emptyMessage}</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-raised text-neutral-500 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3">Date</th>
            <th className="text-left px-4 py-3">Description</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
            <th className="text-right px-4 py-3">Amount</th>
            {onDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr
              key={t.id}
              className={`border-t border-surface-border hover:bg-surface-overlay/40 transition-colors ${i % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-raised/60'}`}
            >
              <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">{t.date}</td>
              <td className="px-4 py-3 text-neutral-100">{t.description}</td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <CategoryBadge category={t.category} />
              </td>
              <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                t.type === 'income' ? 'text-income-500' : 'text-expense-500'
              }`}>
                {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
              </td>
              {onDelete && (
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-neutral-500 hover:text-expense-500 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
