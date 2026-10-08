import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, CalendarDays,
  CreditCard, Target, ChevronRight, CheckCircle,
  Landmark, Wallet, ArrowUpRight,
} from 'lucide-react'
import { useTransactions } from '../../context/TransactionsContext'
import { useGoals }        from '../../context/GoalsContext'
import { useCredits }      from '../../context/CreditsContext'
import StatCard            from '../../components/StatCard'
import TransactionTable    from '../../components/TransactionTable'
import {
  MONTHS, fmt,
  goalSaved, goalProgress, goalRemaining, goalComplete,
  creditMonthlyPayment, creditRemainingBalance, creditIsActive, creditProgress,
  type Credit,
} from '../../types'
import { colors } from '../../tokens'

// ── Helpers ───────────────────────────────────────────────────────────────────

function creditProgressColor(pct: number, done: boolean) {
  if (done)     return colors.income[500]
  if (pct > 66) return colors.primary[400]
  if (pct > 33) return colors.info[500]
  return colors.expense[500]
}

function goalProgressColor(pct: number, done: boolean) {
  if (done)     return colors.income[500]
  if (pct > 66) return colors.primary[400]
  if (pct > 33) return colors.info[500]
  return colors.expense[500]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function creditPaymentForMonth(credits: Credit[], year: number, month: number): number {
  return credits.reduce((sum, c) => {
    const [sy, sm] = c.startDate.split('-').map(Number)
    const offset = (year - sy) * 12 + (month - sm)
    if (offset >= 0 && offset < c.installments) return sum + creditMonthlyPayment(c)
    return sum
  }, 0)
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const income   = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0
  const outflows = payload.filter((p: any) => p.dataKey !== 'income')
  const totalOut = outflows.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  const bal      = income - totalOut
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-3 text-sm shadow-lg min-w-[200px]">
      <p className="text-neutral-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) => p.value > 0 && (
        <p key={p.name} className="flex justify-between gap-6" style={{ color: p.fill }}>
          <span>{p.name}</span><span className="font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
      {totalOut > 0 && outflows.length > 1 && (
        <p className="flex justify-between gap-6 text-neutral-500 mt-1">
          <span>Total outflow</span><span className="font-semibold">{fmt(totalOut)}</span>
        </p>
      )}
      <p className={`mt-2 pt-2 border-t border-surface-border flex justify-between font-semibold ${bal >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
        <span>Balance</span><span>{fmt(bal)}</span>
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { transactions, deleteTransaction } = useTransactions()
  const { goals }   = useGoals()
  const { credits } = useCredits()

  // ── Year selector ─────────────────────────────────────────────────────────
  const years = useMemo(() => {
    const ys = [...new Set(transactions.map(t => Number(t.date.slice(0, 4))))].sort((a, b) => b - a)
    if (!ys.length) ys.push(new Date().getFullYear())
    return ys
  }, [transactions])

  const [selectedYear,  setSelectedYear]  = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // ── Transactions for selected year ────────────────────────────────────────
  const yearTxs = useMemo(
    () => transactions.filter(t => t.date.startsWith(String(selectedYear))),
    [transactions, selectedYear]
  )
  const yearIncome  = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const yearExpense = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const yearBalance = yearIncome - yearExpense

  // ── Monthly chart data ────────────────────────────────────────────────────
  const monthlyData = useMemo(() => MONTHS.map((name, i) => {
    const month  = i + 1
    const prefix = `${selectedYear}-${String(month).padStart(2, '0')}`
    const txs    = transactions.filter(t => t.date.startsWith(prefix))
    const goalContribs = goals.reduce((s, g) =>
      s + g.contributions.filter(c => c.date.startsWith(prefix)).reduce((ss, c) => ss + c.amount, 0), 0)
    return {
      name,
      income:   txs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0),
      expense:  txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      goals:    goalContribs,
      credits:  creditPaymentForMonth(credits, selectedYear, month),
    }
  }), [transactions, goals, credits, selectedYear])

  const avgMonthlyIncome = useMemo(() => {
    const active = monthlyData.filter(m => m.income > 0)
    return active.length > 0 ? active.reduce((s, m) => s + m.income, 0) / active.length : 0
  }, [monthlyData])

  // ── Period detail (month drill-down) ──────────────────────────────────────
  const periodTxs = useMemo(() => {
    if (selectedMonth === null) return yearTxs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
    return transactions.filter(t => t.date.startsWith(prefix))
  }, [transactions, yearTxs, selectedYear, selectedMonth])

  const periodIncome  = periodTxs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0)
  const periodExpense = periodTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const periodLabel   = selectedMonth === null ? `Year ${selectedYear}` : `${MONTHS[selectedMonth - 1]} ${selectedYear}`

  // ── Goals aggregates ──────────────────────────────────────────────────────
  const yearStr           = String(selectedYear)
  const totalGoalSaved    = goals.reduce((s, g) =>
    s + g.contributions.filter(c => c.date.startsWith(yearStr)).reduce((ss, c) => ss + c.amount, 0), 0)
  const totalGoalTarget   = goals.reduce((s, g) => s + g.targetAmount, 0)
  const activeGoals       = goals.filter(g => !goalComplete(g))
  const completedGoals    = goals.filter(g => goalComplete(g))

  // ── Credits aggregates ────────────────────────────────────────────────────
  const activeCredits     = useMemo(() => credits.filter(creditIsActive), [credits])
  const totalDebt         = credits.reduce((s, c) => s + creditRemainingBalance(c), 0)
  const totalMonthlyDebt  = activeCredits.reduce((s, c) => s + creditMonthlyPayment(c), 0)

  // ── Budget breakdown ──────────────────────────────────────────────────────
  const avgMonthlyExpenses = useMemo(() => {
    const active = monthlyData.filter(m => m.expense > 0)
    return active.length > 0 ? active.reduce((s, m) => s + m.expense, 0) / active.length : 0
  }, [monthlyData])

  const monthlyGoalContribs = useMemo(() => {
    const yearStr = String(selectedYear)
    const total   = goals.reduce((s, g) =>
      s + g.contributions.filter(c => c.date.startsWith(yearStr)).reduce((ss, c) => ss + c.amount, 0), 0)
    const months  = new Set(
      goals.flatMap(g => g.contributions.filter(c => c.date.startsWith(yearStr)).map(c => c.date.slice(0, 7)))
    ).size
    return months > 0 ? total / months : 0
  }, [goals, selectedYear])

  const freeCash = Math.max(avgMonthlyIncome - avgMonthlyExpenses - totalMonthlyDebt - monthlyGoalContribs, 0)

  const breakdown = avgMonthlyIncome > 0 ? [
    { label: 'Expenses',     value: avgMonthlyExpenses,   color: colors.expense[500],  pct: (avgMonthlyExpenses   / avgMonthlyIncome) * 100 },
    { label: 'Credits',   value: totalMonthlyDebt,     color: colors.info[500],   pct: (totalMonthlyDebt     / avgMonthlyIncome) * 100 },
    { label: 'Goals',      value: monthlyGoalContribs,  color: colors.warning[500],  pct: (monthlyGoalContribs  / avgMonthlyIncome) * 100 },
    { label: 'Libre',      value: freeCash,             color: colors.income[500],   pct: (freeCash             / avgMonthlyIncome) * 100 },
  ] : []

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Financial summary — {periodLabel}</p>
        </div>
        <select
          value={selectedYear}
          onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedMonth(null) }}
          className="w-fit bg-brand-800 border border-surface-border text-neutral-100 rounded-md px-4 py-2 text-base transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── Stat row 1: Income / Expenses / Balance ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Income"     value={fmt(yearIncome)}  sub={`Year ${selectedYear}`} variant="income"  icon={<TrendingUp  size={16} />} />
        <StatCard label="Expenses"       value={fmt(yearExpense)} sub={`Year ${selectedYear}`} variant="expense" icon={<TrendingDown size={16} />} />
        <StatCard label="Net balance" value={fmt(yearBalance)} sub={`Year ${selectedYear}`} variant={yearBalance >= 0 ? 'primary' : 'expense'} icon={<DollarSign size={16} />} />
      </div>

      {/* ── Stat row 2: Goals / Debt / Monthly payment ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Saved in goals"
          value={fmt(totalGoalSaved)}
          sub={`saved in ${selectedYear} · ${goals.length} goal${goals.length !== 1 ? 's' : ''}`}
          variant="accent"
          icon={<Target size={16} />}
        />
        <StatCard
          label="Active debt"
          value={fmt(totalDebt)}
          sub={`${activeCredits.length} active credit${activeCredits.length !== 1 ? 's' : ''}`}
          variant="expense"
          icon={<CreditCard size={16} />}
        />
        <StatCard
          label="Monthly credit payments"
          value={fmt(totalMonthlyDebt)}
          sub={`${(totalMonthlyDebt / Math.max(avgMonthlyIncome, 1) * 100).toFixed(1)}% of average income`}
          variant={totalMonthlyDebt / Math.max(avgMonthlyIncome, 1) > 0.3 ? 'expense' : 'primary'}
          icon={<Wallet size={16} />}
        />
      </div>

      {/* ── Bar chart ──────────────────────────────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
        <h2 className="text-neutral-100 font-semibold mb-5 text-sm uppercase tracking-wider">
          Income vs Expenses — {selectedYear}
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: colors.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: colors.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(0)}M` : `$${(v/1_000).toFixed(0)}k`}
              width={44} />
            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: colors.text.secondary }} />
            <Bar dataKey="income"   name="Income" fill={colors.primary[400]}  radius={[4,4,0,0]} />
            <Bar dataKey="expense"  name="Expenses"   fill={colors.expense[500]}  stackId="out" radius={[0,0,0,0]} />
            <Bar dataKey="goals"    name="Goals"    fill={colors.info[500]}   stackId="out" radius={[0,0,0,0]} />
            <Bar dataKey="credits" name="Credits" fill={colors.income[500]}   stackId="out" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Month selector ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
          <CalendarDays size={13} /> Filtrar por mes
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedMonth(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMonth === null
                ? 'bg-primary-400/15 text-primary-400 border border-primary-400/30'
                : 'bg-surface-raised text-neutral-400 hover:text-neutral-100 border border-surface-border'
            }`}
          >
            Todo el año
          </button>
          {MONTHS.map((name, i) => {
            const m = monthlyData[i]
            const hasData = m.income > 0 || m.expense > 0
            return (
              <button
                key={name}
                onClick={() => hasData && setSelectedMonth(i + 1)}
                disabled={!hasData}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedMonth === i + 1
                    ? 'bg-primary-400/15 text-primary-400 border border-primary-400/30'
                    : hasData
                      ? 'bg-surface-raised text-neutral-400 hover:text-neutral-100 border border-surface-border'
                      : 'bg-surface-raised text-neutral-600 border border-surface-border cursor-not-allowed'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Period stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Period income"  value={fmt(periodIncome)}               sub={periodLabel} variant="income" />
        <StatCard label="Period expenses"    value={fmt(periodExpense)}              sub={periodLabel} variant="expense" />
        <StatCard label="Period balance"   value={fmt(periodIncome - periodExpense)} sub={periodLabel}
          variant={periodIncome - periodExpense >= 0 ? 'primary' : 'expense'} />
      </div>

      {/* ── Goals + Credits (two columns) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Goals mini-list ───────────────────────────────────────────────── */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">Savings goals</h2>
              <p className="text-neutral-500 text-xs mt-0.5">
                {completedGoals.length} completada{completedGoals.length !== 1 ? 's' : ''} · {activeGoals.length} en curso
              </p>
            </div>
            <button onClick={() => navigate('/finance/goals')}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-primary-400 transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>

          {goals.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">No goals recorded</p>
          ) : (
            <div className="space-y-4">
              {/* Overall progress */}
              {totalGoalTarget > 0 && (
                <div className="bg-surface-raised rounded-lg p-3 border border-surface-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500">Progreso global</span>
                    <span className="text-neutral-100 font-semibold">
                      {fmt(totalGoalSaved)} <span className="text-neutral-500 font-normal">de {fmt(totalGoalTarget)}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-brand-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((totalGoalSaved / totalGoalTarget) * 100, 100)}%`,
                        backgroundColor: colors.primary[400],
                      }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">{((totalGoalSaved / totalGoalTarget) * 100).toFixed(1)}% del objetivo total</p>
                </div>
              )}

              {/* Individual goals */}
              {goals.map(g => {
                const saved    = goalSaved(g)
                const pct      = goalProgress(g)
                const done     = goalComplete(g)
                const color    = goalProgressColor(pct, done)
                const remaining = goalRemaining(g)

                return (
                  <button key={g.id} onClick={() => navigate(`/finance/goals/${g.id}`)}
                    className="w-full text-left group hover:bg-surface-overlay/40 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {done
                          ? <CheckCircle size={12} className="text-income-500 shrink-0" />
                          : <Target size={12} className="text-neutral-500 shrink-0" />}
                        <span className="text-neutral-100 text-sm font-medium truncate group-hover:text-primary-400 transition-colors">
                          {g.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>
                        <ChevronRight size={12} className="text-neutral-600 group-hover:text-primary-400 transition-colors" />
                      </div>
                    </div>
                    <div className="h-1.5 bg-brand-700 rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span style={{ color }}>{fmt(saved)} saved</span>
                      {!done && <span>{fmt(remaining)} restante</span>}
                      {done && <span className="text-income-500 font-medium">¡Completada!</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Credits mini-list ─────────────────────────────────────────────── */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">Credits</h2>
              <p className="text-neutral-500 text-xs mt-0.5">
                {activeCredits.length} activo{activeCredits.length !== 1 ? 's' : ''} · {fmt(totalMonthlyDebt)}/mes
              </p>
            </div>
            <button onClick={() => navigate('/finance/credits')}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-info-400 transition-colors">
              View all <ArrowUpRight size={12} />
            </button>
          </div>

          {credits.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">No credits recorded</p>
          ) : (
            <div className="space-y-4">
              {/* Debt summary */}
              <div className="bg-surface-raised rounded-lg p-3 border border-surface-border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-neutral-500 text-xs uppercase tracking-wider mb-0.5">Total active debt</p>
                    <p className="text-expense-400 font-bold text-lg">{fmt(totalDebt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-500 text-xs uppercase tracking-wider mb-0.5">Monthly payment</p>
                    <p className="text-info-400 font-bold text-lg">{fmt(totalMonthlyDebt)}</p>
                  </div>
                </div>
              </div>

              {/* Individual credits */}
              {credits.map(c => {
                const monthly  = creditMonthlyPayment(c)
                const debt     = creditRemainingBalance(c)
                const pct      = creditProgress(c)
                const done     = !creditIsActive(c)
                const color    = creditProgressColor(pct, done)

                return (
                  <button key={c.id} onClick={() => navigate(`/finance/credits/${c.id}`)}
                    className="w-full text-left group hover:bg-surface-overlay/40 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {c.type === 'credit_card'
                          ? <CreditCard size={12} className="text-info-400 shrink-0" />
                          : <Landmark   size={12} className="text-primary-400 shrink-0" />}
                        <span className="text-neutral-100 text-sm font-medium truncate group-hover:text-info-400 transition-colors">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {done
                          ? <CheckCircle size={12} className="text-income-500" />
                          : <span className="text-xs text-info-400 font-semibold">{fmt(monthly)}/mo</span>}
                        <ChevronRight size={12} className="text-neutral-600 group-hover:text-info-400 transition-colors" />
                      </div>
                    </div>
                    <div className="h-1.5 bg-brand-700 rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>{c.paidInstallments}/{c.installments} installments — {pct.toFixed(0)}%</span>
                      {!done && <span className="text-expense-400">{fmt(debt)} restante</span>}
                      {done  && <span className="text-income-500 font-medium">¡Pagado!</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Budget breakdown ───────────────────────────────────────────────── */}
      {breakdown.length > 0 && (
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
          <div className="mb-4">
            <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">Monthly income distribution</h2>
            <p className="text-neutral-500 text-xs mt-0.5">
              Based on average monthly income of {fmt(avgMonthlyIncome)} — {selectedYear}
            </p>
          </div>

          {/* Stacked bar */}
          <div className="h-5 rounded-full overflow-hidden flex mb-5">
            {breakdown.map(b => b.pct > 0 && (
              <div key={b.label}
                style={{ width: `${Math.min(b.pct, 100)}%`, backgroundColor: b.color }}
                className="h-full transition-all"
                title={`${b.label}: ${b.pct.toFixed(1)}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {breakdown.map(b => (
              <div key={b.label} className="bg-surface-raised rounded-xl p-4 border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-neutral-500 text-xs uppercase tracking-wider">{b.label}</span>
                </div>
                <p className="text-neutral-100 font-bold text-base">{fmt(b.value)}</p>
                <p className="text-neutral-600 text-xs mt-0.5">{b.pct.toFixed(1)}% of income</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent transactions ────────────────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">
            Transactions — {periodLabel}
          </h2>
          {selectedMonth === null && (
            <span className="text-neutral-600 text-xs">Últimas 10</span>
          )}
        </div>
        <TransactionTable
          transactions={periodTxs}
          onDelete={deleteTransaction}
          emptyMessage="No transactions for this period."
        />
      </div>

    </div>
  )
}
