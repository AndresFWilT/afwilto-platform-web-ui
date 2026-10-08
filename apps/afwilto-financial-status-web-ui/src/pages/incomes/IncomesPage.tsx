import { useMemo, useState } from 'react'
import { Button, Input } from '@afwilto/design-system'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { PlusCircle, X, ChevronLeft, TrendingUp } from 'lucide-react'
import { useTransactions } from '../../context/TransactionsContext'
import StatCard from '../../components/StatCard'
import TransactionTable from '../../components/TransactionTable'
import { INCOME_CATEGORIES, MONTHS, fmt } from '../../types'
import { colors } from '../../tokens'

// ── Category → chart color mapping ───────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Salary:     colors.primary[400],
  Bonus:      colors.info[500],
  Other:      colors.income[500],
  Freelance:  colors.income[400],
  Investment: colors.warning[400],
}

const KNOWN_CATS = ['Salary', 'Bonus', 'Freelance']
const STACK_CATS = [...KNOWN_CATS, 'Other'] as const

function catColor(name: string) {
  return CAT_COLORS[name] ?? colors.text.secondary
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-3 text-sm shadow-lg min-w-[180px]">
      <p className="text-neutral-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) =>
        p.value > 0 && (
          <p key={p.name} className="flex justify-between gap-6" style={{ color: p.fill }}>
            <span>{p.name}</span>
            <span className="font-semibold">{fmt(p.value)}</span>
          </p>
        )
      )}
      {payload.length > 1 && total > 0 && (
        <p className="mt-2 pt-2 border-t border-surface-border flex justify-between gap-6 text-neutral-100 font-semibold">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const currentYear  = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export default function IncomesPage() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions()

  // ── Available years ───────────────────────────────────────────────────────
  const years = useMemo(() => {
    const ys = [...new Set(
      transactions.filter(t => t.type === 'income').map(t => Number(t.date.slice(0, 4)))
    )].sort((a, b) => b - a)
    if (!ys.includes(currentYear)) ys.unshift(currentYear)
    return ys
  }, [transactions])

  const [year,         setYear]         = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [showForm,      setShowForm]      = useState(false)

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), description: '', category: INCOME_CATEGORIES[0], amount: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.description || Number(form.amount) <= 0) return
    addTransaction({ type: 'income', date: form.date, description: form.description, category: form.category, amount: Number(form.amount) })
    setForm({ date: new Date().toISOString().slice(0, 10), description: '', category: INCOME_CATEGORIES[0], amount: '' })
    setShowForm(false)
  }

  // ── Year's income transactions ────────────────────────────────────────────
  const yearIncomes = useMemo(
    () => transactions.filter(t => t.type === 'income' && t.date.startsWith(String(year))),
    [transactions, year]
  )

  const yearTotal = yearIncomes.reduce((s, t) => s + t.amount, 0)

  // ── Previous year for YoY ─────────────────────────────────────────────────
  const prevYearTotal = useMemo(
    () => transactions.filter(t => t.type === 'income' && t.date.startsWith(String(year - 1))).reduce((s, t) => s + t.amount, 0),
    [transactions, year]
  )
  const yoyPct = prevYearTotal > 0 ? ((yearTotal - prevYearTotal) / prevYearTotal) * 100 : null

  // ── Monthly chart data ────────────────────────────────────────────────────
  const monthlyData = useMemo(() => MONTHS.map((name, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`
    const txs = yearIncomes.filter(t => t.date.startsWith(prefix))
    const byCat: Record<string, number> = {}
    let other = 0
    for (const t of txs) {
      if (KNOWN_CATS.includes(t.category)) byCat[t.category] = (byCat[t.category] ?? 0) + t.amount
      else other += t.amount
    }
    return {
      name,
      month: i + 1,
      Salary:     byCat['Salary']     ?? 0,
      Bonus:      byCat['Bonus']      ?? 0,
      'Freelance': byCat['Freelance'] ?? 0,
      Other:      other,
      total:      txs.reduce((s, t) => s + t.amount, 0),
    }
  }), [yearIncomes, year])

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const monthsWithIncome = monthlyData.filter(m => m.total > 0)
  const avgMonthly       = monthsWithIncome.length > 0 ? yearTotal / monthsWithIncome.length : 0
  const bestMonth        = monthlyData.reduce((best, m) => m.total > best.total ? m : best, { name: '—', total: 0 })

  // ── Selected month detail ─────────────────────────────────────────────────
  const selectedMonthTxs = useMemo(() => {
    if (selectedMonth === null) return []
    const prefix = `${year}-${String(selectedMonth).padStart(2, '0')}`
    return yearIncomes.filter(t => t.date.startsWith(prefix))
  }, [yearIncomes, year, selectedMonth])

  const selectedMonthTotal = selectedMonthTxs.reduce((s, t) => s + t.amount, 0)

  // ── Category breakdown for selected month (sorted by amount) ─────────────
  const monthCatBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of selectedMonthTxs) {
      map[t.category || 'Other'] = (map[t.category || 'Other'] ?? 0) + t.amount
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [selectedMonthTxs])

  const changeYear = (y: number) => { setYear(y); setSelectedMonth(null) }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {selectedMonth !== null ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedMonth(null)} className="text-neutral-500 hover:text-primary-400 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-100">{MONTHS[selectedMonth - 1]} {year}</h1>
                <p className="text-neutral-500 text-sm mt-0.5">Income detail</p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-neutral-100">Income</h1>
              <p className="text-neutral-500 text-sm mt-0.5">Annual income history</p>
            </div>
          )}
        </div>
        <Button variant="success" size="sm" className="w-fit" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={16} /> : <PlusCircle size={16} />}
          {showForm ? 'Cancel' : 'Add income'}
        </Button>
      </div>

      {/* ── Add form ───────────────────────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface-raised border border-primary-400/20 rounded-xl p-5">
          <h2 className="text-neutral-100 font-semibold mb-4">New income</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Date</label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as typeof f.category }))}
                className="w-full bg-brand-800 border border-surface-border text-neutral-100 rounded-md px-4 py-2 text-base transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400">
                {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Description</label>
              <Input type="text" placeholder="e.g. Monthly salary" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Amount (COP)</label>
              <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="success" type="submit">
              Save
              </Button>
          </div>
        </form>
      )}

      {/* ── Year selector tabs ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {years.map(y => (
          <button
            key={y}
            onClick={() => changeYear(y)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              year === y
                ? 'bg-primary-400/15 text-primary-400 border border-primary-400/30'
                : 'bg-surface-raised text-neutral-400 hover:text-neutral-100 border border-surface-border'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* ══════════════ MONTHLY DETAIL VIEW ══════════════ */}
      {selectedMonth !== null ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Month total" value={fmt(selectedMonthTotal)} sub={`${MONTHS[selectedMonth - 1]} ${year}`} variant="income" />
            <StatCard label="Transactions" value={String(selectedMonthTxs.length)} sub="Recorded income" variant="primary" />
            <StatCard label="vs. Annual average" value={fmt(selectedMonthTotal - avgMonthly)}
              sub={selectedMonthTotal >= avgMonthly ? 'Above average' : 'Below average'}
              variant={selectedMonthTotal >= avgMonthly ? 'income' : 'expense'} />
          </div>

          {/* Category breakdown */}
          {monthCatBreakdown.length > 0 && (
            <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
              <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider mb-4">Month composition</h2>
              <div className="space-y-3">
                {monthCatBreakdown.map(([cat, amount]) => {
                  const pct = selectedMonthTotal > 0 ? (amount / selectedMonthTotal) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-400" style={{ color: catColor(cat) }}>{cat}</span>
                        <span className="text-neutral-100 font-semibold">{fmt(amount)} <span className="text-neutral-500 font-normal text-xs">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-brand-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: catColor(cat) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
            <h2 className="text-neutral-100 font-semibold mb-4 text-sm uppercase tracking-wider">
              Transactions — {MONTHS[selectedMonth - 1]} {year}
            </h2>
            <TransactionTable transactions={selectedMonthTxs} onDelete={deleteTransaction} emptyMessage="No income this month." />
          </div>
        </>

      ) : (
        /* ══════════════ ANNUAL OVERVIEW ══════════════ */
        <>
          {/* Annual stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Annual total" value={fmt(yearTotal)} sub={String(year)} variant="income" icon={<TrendingUp size={16} />} />
            <StatCard label="Monthly average" value={fmt(avgMonthly)} sub={`${monthsWithIncome.length} months with income`} variant="primary" />
            <StatCard label="Best month" value={bestMonth.name} sub={fmt(bestMonth.total)} variant="accent" />
            {yoyPct !== null ? (
              <StatCard label="vs. previous year" value={`${yoyPct >= 0 ? '+' : ''}${yoyPct.toFixed(1)}%`}
                sub={`${year - 1}: ${fmt(prevYearTotal)}`}
                variant={yoyPct >= 0 ? 'income' : 'expense'} />
            ) : (
              <StatCard label="Previous year" value="—" sub="No prior data" variant="primary" />
            )}
          </div>

          {/* Stacked bar chart by category */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
            <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider mb-5">
              Monthly income {year} — by source
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: colors.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(0)}M` : `$${(v / 1_000).toFixed(0)}k`}
                  width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: colors.text.secondary }} />
                {STACK_CATS.map(cat => (
                  <Bar key={cat} dataKey={cat} stackId="a" fill={catColor(cat)}
                    radius={cat === 'Other' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly breakdown table */}
          <div className="bg-surface-raised rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border">
              <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">Monthly summary</h2>
              <p className="text-neutral-500 text-xs mt-0.5">Click a month to see its transaction detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-raised text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Month</th>
                    <th className="text-right px-4 py-3" style={{ color: catColor('Salary') }}>Salary</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell" style={{ color: catColor('Bonus') }}>Bonus</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell" style={{ color: catColor('Freelance') }}>Freelance</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell" style={{ color: catColor('Other') }}>Other</th>
                    <th className="text-right px-5 py-3 text-neutral-500">Total</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m, i) => {
                    const isCurrent = year === currentYear && m.month === currentMonth
                    const isEmpty   = m.total === 0
                    return (
                      <tr
                        key={m.name}
                        onClick={() => !isEmpty && setSelectedMonth(m.month)}
                        className={`border-t border-surface-border transition-colors ${
                          isEmpty
                            ? 'opacity-40 cursor-default'
                            : 'cursor-pointer hover:bg-surface-overlay/50 hover:border-primary-400/10'
                        } ${i % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-raised/40'}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-100 font-medium">{m.name}</span>
                            {isCurrent && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-primary-400/15 text-primary-400 border border-primary-400/20">current</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium" style={{ color: m.Salary > 0 ? catColor('Salary') : colors.text.muted }}>
                          {m.Salary > 0 ? fmt(m.Salary) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell" style={{ color: m.Bonus > 0 ? catColor('Bonus') : colors.text.muted }}>
                          {m.Bonus > 0 ? fmt(m.Bonus) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell" style={{ color: m['Freelance'] > 0 ? catColor('Freelance') : colors.text.muted }}>
                          {m['Freelance'] > 0 ? fmt(m['Freelance']) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell text-neutral-400">
                          {m.Other > 0 ? fmt(m.Other) : '—'}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${m.total > 0 ? 'text-income-500' : 'text-neutral-500'}`}>
                          {m.total > 0 ? fmt(m.total) : '—'}
                        </td>
                        <td className="px-3 py-3 text-neutral-500 text-xs">
                          {!isEmpty && <ChevronLeft size={14} className="rotate-180 text-neutral-600" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary-400/20 bg-surface-raised">
                    <td className="px-5 py-3 text-neutral-500 text-xs uppercase tracking-wider font-semibold">Total {year}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: catColor('Salary') }}>
                      {fmt(monthlyData.reduce((s, m) => s + m.Salary, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold hidden md:table-cell" style={{ color: catColor('Bonus') }}>
                      {fmt(monthlyData.reduce((s, m) => s + m.Bonus, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold hidden lg:table-cell" style={{ color: catColor('Freelance') }}>
                      {fmt(monthlyData.reduce((s, m) => s + m['Freelance'], 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold hidden lg:table-cell text-neutral-400">
                      {fmt(monthlyData.reduce((s, m) => s + m.Other, 0))}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-income-500 text-base">{fmt(yearTotal)}</td>
                    <td className="px-3 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
