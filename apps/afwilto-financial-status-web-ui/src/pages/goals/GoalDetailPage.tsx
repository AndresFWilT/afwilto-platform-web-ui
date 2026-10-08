import { useMemo, useState } from 'react'
import { Button, Input } from '@afwilto/design-system'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ComposedChart, Area, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  ArrowLeft, PlusCircle, X, Pencil, Trash2, Check,
  CheckCircle, AlertTriangle, TrendingUp,
} from 'lucide-react'
import { useGoals } from '../../context/GoalsContext'
import { useTransactions } from '../../context/TransactionsContext'
import { useAvgMonthlySurplus } from '../../hooks/useAvgMonthlySurplus'
import StatCard from '../../components/StatCard'
import { fmt, goalSaved, goalProgress, goalRemaining, goalComplete, MONTHS } from '../../types'
import { colors } from '../../tokens'

// ── Helpers ──────────────────────────────────────────────────────────────────

function monthsDiff(from: Date, to: Date) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

// ── Custom tooltips ───────────────────────────────────────────────────────────

function CumulativeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-3 text-sm shadow-lg min-w-[160px]">
      <p className="text-neutral-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.stroke ?? p.fill }}>
          <span>{p.name}</span><span className="font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-3 text-sm shadow-lg">
      <p className="text-neutral-400 mb-1">{label}</p>
      <p className="text-primary-400 font-semibold">{fmt(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { goals, updateGoal, deleteGoal, addContribution, updateContribution, deleteContribution } = useGoals()
  const { transactions } = useTransactions()

  const goal = goals.find(g => g.id === id)
  const avgMonthlySurplus = useAvgMonthlySurplus(transactions)

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-neutral-400 text-lg">Goal not found.</p>
        <button onClick={() => navigate('/finance/goals')} className="text-primary-400 text-sm flex items-center gap-1 hover:underline">
          <ArrowLeft size={14} /> Back to Goals
        </button>
      </div>
    )
  }

  const saved     = goalSaved(goal)
  const pct       = goalProgress(goal)
  const remaining = goalRemaining(goal)
  const done      = goalComplete(goal)

  // Impact analysis
  const today = new Date()
  let monthsLeft: number | null = null
  let monthlyNeeded: number | null = null
  let isFeasible: boolean | null = null
  let projectedMonths: number | null = null

  if (!done) {
    if (goal.targetDate) {
      monthsLeft    = monthsDiff(today, new Date(goal.targetDate))
      monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : null
      isFeasible    = monthlyNeeded !== null && avgMonthlySurplus > 0 && monthlyNeeded <= avgMonthlySurplus
    } else {
      projectedMonths = avgMonthlySurplus > 0 ? remaining / avgMonthlySurplus : null
    }
  }

  // ── Chart: cumulative savings + required trajectory ───────────────────────
  const cumulativeData = useMemo(() => {
    if (!goal.contributions.length) return []

    const start   = new Date(goal.createdAt)
    const endFar  = goal.targetDate ? new Date(goal.targetDate) : new Date()
    const endDate = endFar > today ? endFar : today

    // Build month array from start to endDate
    const months: string[] = []
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cursor <= endDate) {
      months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
      cursor.setMonth(cursor.getMonth() + 1)
    }

    const totalMonths = goal.targetDate ? Math.max(monthsDiff(start, new Date(goal.targetDate)), 1) : 0

    let cumulative = 0
    return months.map((prefix, i) => {
      const monthContrib = goal.contributions
        .filter(c => c.date.startsWith(prefix))
        .reduce((s, c) => s + c.amount, 0)
      cumulative += monthContrib

      const required = goal.targetDate && totalMonths > 0
        ? Math.min((goal.targetAmount / totalMonths) * (i + 1), goal.targetAmount)
        : undefined

      return { month: monthLabel(prefix), Saved: cumulative, Required: required }
    })
  }, [goal])

  // ── Chart: monthly contributions bar ─────────────────────────────────────
  const monthlyBarData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of goal.contributions) {
      const key = c.date.slice(0, 7)
      map[key] = (map[key] ?? 0) + c.amount
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, amount]) => ({ month: monthLabel(ym), amount }))
  }, [goal.contributions])

  // ── Edit goal form ────────────────────────────────────────────────────────
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalForm, setGoalForm] = useState({
    name: goal.name,
    targetAmount: String(goal.targetAmount),
    targetDate: goal.targetDate ?? '',
  })

  const handleGoalSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalForm.name.trim() || Number(goalForm.targetAmount) <= 0) return
    updateGoal(goal.id, {
      name: goalForm.name.trim(),
      targetAmount: Number(goalForm.targetAmount),
      targetDate: goalForm.targetDate || undefined,
    })
    setEditingGoal(false)
  }

  // ── Add contribution form ─────────────────────────────────────────────────
  const [showContrib, setShowContrib] = useState(false)
  const [contribForm, setContribForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const handleAddContrib = (e: React.FormEvent) => {
    e.preventDefault()
    if (Number(contribForm.amount) <= 0) return
    addContribution(goal.id, {
      amount: Number(contribForm.amount),
      date: contribForm.date,
      note: contribForm.note || undefined,
    })
    setContribForm({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' })
    setShowContrib(false)
  }

  // ── Inline edit contribution ──────────────────────────────────────────────
  const [editingCId, setEditingCId] = useState<string | null>(null)
  const [editCForm, setEditCForm] = useState({ amount: '', date: '', note: '' })

  const startEdit = (c: { id: string; amount: number; date: string; note?: string }) => {
    setEditingCId(c.id)
    setEditCForm({ amount: String(c.amount), date: c.date, note: c.note ?? '' })
  }

  const saveEdit = () => {
    if (!editingCId || Number(editCForm.amount) <= 0) return
    updateContribution(goal.id, editingCId, {
      amount: Number(editCForm.amount),
      date: editCForm.date,
      note: editCForm.note || undefined,
    })
    setEditingCId(null)
  }

  const sortedContribs = [...goal.contributions].sort((a, b) => b.date.localeCompare(a.date))

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Breadcrumb + header */}
      <div>
        <button onClick={() => navigate('/finance/goals')} className="flex items-center gap-1.5 text-neutral-500 hover:text-primary-400 text-sm transition-colors mb-3">
          <ArrowLeft size={14} /> Goals
        </button>

        {!editingGoal ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-neutral-100">{goal.name}</h1>
              <p className="text-neutral-500 text-sm mt-0.5">
                Created {goal.createdAt}
                {goal.targetDate && <> · Target date: <span className="text-neutral-400">{goal.targetDate}</span></>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setGoalForm({ name: goal.name, targetAmount: String(goal.targetAmount), targetDate: goal.targetDate ?? '' }); setEditingGoal(true) }}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-primary-400 border border-surface-border hover:border-primary-400/40 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => { deleteGoal(goal.id); navigate('/finance/goals') }}
                className="flex items-center gap-1.5 text-neutral-500 hover:text-expense-500 border border-surface-border hover:border-expense-500/40 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGoalSave} className="bg-surface-raised border border-primary-400/20 rounded-xl p-5">
            <h2 className="text-neutral-100 font-semibold mb-4">Edit Goal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-neutral-500 text-xs uppercase tracking-wider">Name *</label>
                <Input inputSize="sm" type="text" value={goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full bg-brand-800 border border-surface-border text-neutral-100 rounded-md px-4 py-2 text-base transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-neutral-500 text-xs uppercase tracking-wider">Target amount *</label>
                <Input inputSize="sm" type="number" min="1" step="0.01" value={goalForm.targetAmount} onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))} required
                  className="w-full bg-brand-800 border border-surface-border text-neutral-100 rounded-md px-4 py-2 text-base transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-neutral-500 text-xs uppercase tracking-wider">Target date <span className="text-neutral-600">(optional)</span></label>
                <Input type="date" value={goalForm.targetDate} onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setEditingGoal(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-100 border border-surface-border rounded-lg transition-colors">
                Cancel
              </button>
              <Button type="submit">
                Save Changes
                </Button>
            </div>
          </form>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-100 font-semibold text-lg">{fmt(saved)}</span>
          <span className="text-neutral-500">of {fmt(goal.targetAmount)}</span>
        </div>
        <div className="h-3 bg-brand-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              backgroundColor: done ? colors.income[500] : pct > 66 ? colors.primary[400] : pct > 33 ? colors.info[500] : colors.expense[500],
            }} />
        </div>
        <p className="text-neutral-500 text-xs mt-2">{pct.toFixed(1)}% complete · {fmt(remaining)} remaining</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Saved"    value={fmt(saved)}     sub={`${pct.toFixed(1)}% done`}  variant="income" />
        <StatCard label="Remaining"      value={fmt(remaining)} sub="To reach goal"               variant={done ? 'income' : 'expense'} />
        {!done && goal.targetDate && monthlyNeeded !== null && (
          <StatCard label="Monthly Needed" value={fmt(monthlyNeeded)} sub={`${monthsLeft ?? 0} months left`} variant={isFeasible ? 'primary' : 'expense'} />
        )}
        {!done && !goal.targetDate && projectedMonths !== null && (
          <StatCard label="Est. Completion" value={`${Math.ceil(projectedMonths)} mo`} sub="At current surplus" variant="accent" />
        )}
        {done && (
          <StatCard label="Status" value="Complete!" sub="Goal achieved" variant="income" />
        )}
        <StatCard label="Contributions" value={String(goal.contributions.length)} sub="Total payments" variant="accent" />
      </div>

      {/* Feasibility alert */}
      {!done && goal.targetDate && monthlyNeeded !== null && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 text-sm ${
          isFeasible
            ? 'bg-income-500/8 border-income-500/20 text-income-400'
            : 'bg-expense-500/8 border-expense-500/20 text-expense-400'
        }`}>
          {isFeasible
            ? <><CheckCircle size={16} className="shrink-0" /> On track — you need <strong>{fmt(monthlyNeeded)}/month</strong> which is within your avg surplus of <strong>{fmt(avgMonthlySurplus)}</strong>.</>
            : <><AlertTriangle size={16} className="shrink-0" /> You need <strong>{fmt(monthlyNeeded)}/month</strong> but your avg surplus is only <strong>{fmt(avgMonthlySurplus)}</strong>. Consider adjusting the target date or saving amount.</>
          }
        </div>
      )}

      {!done && !goal.targetDate && avgMonthlySurplus > 0 && projectedMonths !== null && (
        <div className="rounded-xl border border-primary-400/20 bg-primary-400/5 p-4 flex items-center gap-3 text-sm text-primary-400">
          <TrendingUp size={16} className="shrink-0" />
          At your current surplus of <strong>{fmt(avgMonthlySurplus)}/month</strong>, you'll reach this goal in approximately <strong>{Math.ceil(projectedMonths)} months</strong>.
        </div>
      )}

      {/* Charts */}
      {cumulativeData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Cumulative area chart */}
          <div className="lg:col-span-3 bg-surface-raised rounded-xl border border-surface-border p-5">
            <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider mb-5">Cumulative Savings</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={cumulativeData}>
                <defs>
                  <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={colors.primary[400]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary[400]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: colors.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: colors.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={42} />
                <Tooltip content={<CumulativeTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: colors.text.secondary }} />
                <ReferenceLine y={goal.targetAmount} stroke={colors.income[500]} strokeDasharray="4 4" label={{ value: 'Target', fill: colors.income[500], fontSize: 10 }} />
                <Area type="monotone" dataKey="Saved" stroke={colors.primary[400]} fill="url(#savedGradient)" strokeWidth={2} dot={false} />
                {goal.targetDate && (
                  <Line type="monotone" dataKey="Required" stroke={colors.info[400]} strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Required pace" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly contributions bar */}
          <div className="lg:col-span-2 bg-surface-raised rounded-xl border border-surface-border p-5">
            <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider mb-5">Monthly Contributions</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: colors.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={42} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="amount" name="Contribution" fill={colors.primary[400]} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Contribution history */}
      <div className="bg-surface-raised rounded-xl border border-surface-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">Contribution History</h2>
          {!done && (
            <button
              onClick={() => setShowContrib(v => !v)}
              className="flex items-center gap-1.5 bg-primary-400/10 hover:bg-primary-400/20 text-primary-400 border border-primary-400/20 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {showContrib ? <X size={14} /> : <PlusCircle size={14} />}
              {showContrib ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {/* Add contribution form */}
        {showContrib && (
          <form onSubmit={handleAddContrib} className="mb-4 bg-surface-raised rounded-lg border border-primary-400/15 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-neutral-500 text-xs uppercase tracking-wider">Amount *</label>
                <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={contribForm.amount}
                  onChange={e => setContribForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-neutral-500 text-xs uppercase tracking-wider">Date *</label>
                <Input type="date" value={contribForm.date}
                  onChange={e => setContribForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-neutral-500 text-xs uppercase tracking-wider">Note <span className="text-neutral-600">(optional)</span></label>
                <Input type="text" placeholder="e.g. Monthly deposit" value={contribForm.note}
                  onChange={e => setContribForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="submit">
                Save Contribution
                </Button>
            </div>
          </form>
        )}

        {/* Table */}
        {sortedContribs.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-8">No contributions yet. Add your first one!</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-surface-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-raised text-neutral-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Note</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {sortedContribs.map((c, i) => (
                  <tr key={c.id} className={`border-t border-surface-border ${i % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-raised/60'} hover:bg-surface-overlay/40 transition-colors`}>
                    {editingCId === c.id ? (
                      // ── Inline edit row ──────────────────────────────────
                      <>
                        <td className="px-3 py-2">
                          <Input inputSize="sm" type="date" value={editCForm.date}
                            onChange={e => setEditCForm(f => ({ ...f, date: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <Input inputSize="sm" type="number" min="0.01" step="0.01" value={editCForm.amount}
                            onChange={e => setEditCForm(f => ({ ...f, amount: e.target.value }))} className="text-right" />
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <Input inputSize="sm" type="text" placeholder="Note..." value={editCForm.note}
                            onChange={e => setEditCForm(f => ({ ...f, note: e.target.value }))} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={saveEdit} className="text-income-500 hover:text-income-400 p-1 transition-colors" title="Save">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingCId(null)} className="text-neutral-500 hover:text-neutral-400 p-1 transition-colors" title="Cancel">
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // ── Display row ──────────────────────────────────────
                      <>
                        <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">{c.date}</td>
                        <td className="px-4 py-3 text-right text-primary-400 font-semibold whitespace-nowrap">+ {fmt(c.amount)}</td>
                        <td className="px-4 py-3 text-neutral-500 text-xs hidden sm:table-cell">{c.note ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(c)} className="text-neutral-500 hover:text-primary-400 p-1 transition-colors" title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteContribution(goal.id, c.id)} className="text-neutral-500 hover:text-expense-500 p-1 transition-colors" title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary-400/20 bg-surface-raised">
                  <td className="px-4 py-3 text-neutral-500 text-xs uppercase tracking-wider">Total</td>
                  <td className="px-4 py-3 text-right text-primary-400 font-bold">{fmt(saved)}</td>
                  <td className="hidden sm:table-cell" />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
