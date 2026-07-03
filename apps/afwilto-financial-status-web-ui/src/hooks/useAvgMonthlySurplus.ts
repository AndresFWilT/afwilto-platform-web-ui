import { useMemo } from 'react'
import { type Transaction } from '../types'

export function useAvgMonthlySurplus(transactions: Transaction[], lookbackMonths = 6): number {
  return useMemo(() => {
    const today = new Date()
    const keys: string[] = []
    for (let i = lookbackMonths - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const surpluses = keys
      .map(prefix => {
        const mTxs = transactions.filter(t => t.date.startsWith(prefix))
        const inc = mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const exp = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return { surplus: inc - exp, hasData: inc > 0 || exp > 0 }
      })
      .filter(m => m.hasData)
    if (!surpluses.length) return 0
    return surpluses.reduce((s, m) => s + m.surplus, 0) / surpluses.length
  }, [transactions, lookbackMonths])
}
