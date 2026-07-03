export type TransactionType = 'income' | 'expense'

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other'] as const
export const EXPENSE_CATEGORIES = ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Education', 'Utilities', 'Other'] as const

export type IncomeCategory = typeof INCOME_CATEGORIES[number]
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category: string
  date: string // YYYY-MM-DD
}

export interface GoalContribution {
  id: string
  amount: number
  date: string // YYYY-MM-DD
  note?: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  targetDate?: string // YYYY-MM-DD, optional
  createdAt: string   // YYYY-MM-DD
  contributions: GoalContribution[]
}

export const goalSaved     = (g: Goal) => g.contributions.reduce((s, c) => s + c.amount, 0)
export const goalProgress  = (g: Goal) => Math.min((goalSaved(g) / g.targetAmount) * 100, 100)
export const goalRemaining = (g: Goal) => Math.max(g.targetAmount - goalSaved(g), 0)
export const goalComplete  = (g: Goal) => goalSaved(g) >= g.targetAmount

// ── Credits ───────────────────────────────────────────────────────────────────

export type CreditType = 'credit_card' | 'loan'

export interface Credit {
  id: string
  type: CreditType
  name: string         // "Visa Platinum - Bancolombia"
  description?: string // "iPhone 15 Pro"
  principal: number    // Original amount
  monthlyRate: number  // Decimal (0.018 = 1.8% monthly)
  installments: number // Total cuotas
  paidInstallments: number
  startDate: string    // YYYY-MM-DD — first payment date
  createdAt: string
}

export interface AmortizationRow {
  installment: number
  date: string
  payment: number
  principalPortion: number
  interestPortion: number
  balance: number
  isPaid: boolean
}

// Monthly fixed payment (cuota fija — French amortization)
export const creditMonthlyPayment = (c: Credit): number => {
  if (c.monthlyRate === 0 || c.installments === 0) return c.principal / c.installments
  const r = c.monthlyRate
  const n = c.installments
  return (c.principal * r) / (1 - Math.pow(1 + r, -n))
}

// Remaining principal balance after paidInstallments payments
export const creditRemainingBalance = (c: Credit): number => {
  const M = creditMonthlyPayment(c)
  const r = c.monthlyRate
  const remaining = c.installments - c.paidInstallments
  if (remaining <= 0) return 0
  if (r === 0) return M * remaining
  return (M * (1 - Math.pow(1 + r, -remaining))) / r
}

export const creditTotalInterest  = (c: Credit): number =>
  creditMonthlyPayment(c) * c.installments - c.principal

export const creditIsActive        = (c: Credit): boolean =>
  c.paidInstallments < c.installments

export const creditProgress        = (c: Credit): number =>
  Math.min((c.paidInstallments / c.installments) * 100, 100)

export const creditAnnualRate      = (c: Credit): number =>
  Math.pow(1 + c.monthlyRate, 12) - 1

export const creditAmortizationTable = (c: Credit): AmortizationRow[] => {
  const M = creditMonthlyPayment(c)
  const r = c.monthlyRate
  const rows: AmortizationRow[] = []
  let balance = c.principal
  const [y, mo, d] = c.startDate.split('-').map(Number)

  for (let i = 1; i <= c.installments; i++) {
    const interest = balance * r
    const principal = r === 0 ? M : M - interest
    balance = Math.max(balance - principal, 0)
    const date = new Date(y, mo - 1 + (i - 1), d)
    rows.push({
      installment: i,
      date: date.toISOString().slice(0, 10),
      payment: M,
      principalPortion: principal,
      interestPortion: interest,
      balance,
      isPaid: i <= c.paidInstallments,
    })
  }
  return rows
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fmt = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount)

export const fmtPct = (decimal: number, digits = 2) =>
  `${(decimal * 100).toFixed(digits)}%`
