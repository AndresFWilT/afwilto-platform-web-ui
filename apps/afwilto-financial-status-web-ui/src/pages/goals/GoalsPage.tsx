import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { PlusCircle, X, Target, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'
import { useGoals } from '../../context/GoalsContext'
import { useTransactions } from '../../context/TransactionsContext'
import { useAvgMonthlySurplus } from '../../hooks/useAvgMonthlySurplus'
import StatCard from '../../components/StatCard'
import { fmt, goalSaved, goalProgress, goalRemaining, goalComplete } from '../../types'
import { colors } from '../../tokens'

const PIE_COLORS = [colors.primary[400], colors.purple[500], colors.income[500], colors.warning[500], colors.expense[500], colors.purple[700]]

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-700 border border-border rounded-xl p-3 text-sm shadow-lg">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex justify-between gap-6" style={{ color: p.fill ?? p.color }}>
          <span>{p.name}</span><span className="font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-700 border border-border rounded-xl p-3 text-sm shadow-lg">
      <p style={{ color: payload[0].payload.fill }} className="font-semibold">{payload[0].name}</p>
      <p className="text-text-primary">{fmt(payload[0].value)}</p>
    </div>
  )
}

function progressColor(pct: number, complete: boolean): string {
  if (complete)  return colors.income[500]
  if (pct > 66)  return colors.primary[400]
  if (pct > 33)  return colors.purple[500]
  return colors.expense[500]
}

export default function GoalsPage() {
  const { goals, addGoal } = useGoals()
  const { transactions } = useTransactions()
  const navigate = useNavigate()

  const avgMonthlySurplus = useAvgMonthlySurplus(transactions)

  // Aggregate stats
  const totalSaved  = useMemo(() => goals.reduce((s, g) => s + goalSaved(g), 0), [goals])
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.targetAmount, 0), [goals])
  const overallPct  = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  // Total monthly needed for goals with deadline
  const totalMonthlyNeeded = useMemo(() => {
    const today = new Date()
    return goals.reduce((sum, g) => {
      if (goalComplete(g) || !g.targetDate) return sum
      const target = new Date(g.targetDate)
      const months = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
      if (months <= 0) return sum
      return sum + goalRemaining(g) / months
    }, 0)
  }, [goals])

  const surplusAfterGoals = avgMonthlySurplus - totalMonthlyNeeded

  // Bar chart: target vs saved per goal
  const barData = useMemo(() => goals.map(g => ({
    name: g.name.length > 14 ? g.name.slice(0, 14) + '…' : g.name,
    Saved: goalSaved(g),
    Remaining: goalRemaining(g),
  })), [goals])

  // Pie: savings distribution
  const pieData = useMemo(() =>
    goals.filter(g => goalSaved(g) > 0).map(g => ({ name: g.name, value: goalSaved(g) }))
  , [goals])

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', targetAmount: '', initialAmount: '', targetDate: '' })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || Number(form.targetAmount) <= 0) return
    addGoal({
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      targetDate: form.targetDate || undefined,
      initialAmount: Number(form.initialAmount) || 0,
    })
    setForm({ name: '', targetAmount: '', initialAmount: '', targetDate: '' })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Metas</h1>
          <p className="text-text-muted text-sm mt-0.5">Savings goals overview</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-primary-400 hover:bg-primary-300 text-dark-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors w-fit"
        >
          {showForm ? <X size={16} /> : <PlusCircle size={16} />}
          {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-dark-700 border border-primary-400/20 rounded-xl p-5 glow-primary">
          <h2 className="text-text-primary font-semibold mb-4">New Savings Goal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs uppercase tracking-wider">Goal name *</label>
              <input type="text" placeholder="e.g. Emergency fund" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                className="bg-dark-800 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400 placeholder:text-text-disabled" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs uppercase tracking-wider">Target amount *</label>
              <input type="number" min="1" step="0.01" placeholder="10,000" value={form.targetAmount}
                onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} required
                className="bg-dark-800 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400 placeholder:text-text-disabled" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs uppercase tracking-wider">Already saved <span className="text-text-disabled">(optional)</span></label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.initialAmount}
                onChange={e => setForm(f => ({ ...f, initialAmount: e.target.value }))}
                className="bg-dark-800 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400 placeholder:text-text-disabled" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs uppercase tracking-wider">Target date <span className="text-text-disabled">(optional)</span></label>
              <input type="date" value={form.targetDate}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="bg-dark-800 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="bg-primary-400 hover:bg-primary-300 text-dark-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted">
          <Target size={48} className="mb-4 opacity-20" />
          <p className="text-base font-medium text-text-secondary">No goals yet</p>
          <p className="text-sm mt-1">Add your first savings goal to get started.</p>
        </div>
      )}

      {goals.length > 0 && (<>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Saved"   value={fmt(totalSaved)}  sub={`of ${fmt(totalTarget)}`} variant="income" />
          <StatCard label="Overall"       value={`${overallPct.toFixed(1)}%`} sub="Completion" variant="primary" glow />
          <StatCard label="Monthly Surplus" value={fmt(avgMonthlySurplus)} sub="Last 6 months avg" variant={avgMonthlySurplus >= 0 ? 'income' : 'expense'} />
          <StatCard label="After Goals"   value={fmt(surplusAfterGoals)} sub="Surplus remaining" variant={surplusAfterGoals >= 0 ? 'purple' : 'expense'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Bar: goal comparison */}
          <div className="lg:col-span-3 bg-dark-700 rounded-xl border border-border p-5">
            <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-5">Goal Progress Comparison</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={colors.dark[500]} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: colors.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: colors.text.secondary }} />
                <Bar dataKey="Saved"     fill={colors.primary[400]} radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="Remaining" fill={colors.dark[500]}    radius={[4,4,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie: savings distribution */}
          <div className="lg:col-span-2 bg-dark-700 rounded-xl border border-border p-5">
            <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-5">Savings Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: colors.text.secondary }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-sm text-center py-10">No savings yet</p>
            )}
          </div>
        </div>

        {/* Monthly impact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Avg Monthly Surplus"      value={fmt(avgMonthlySurplus)}   sub="Last 6 months" variant={avgMonthlySurplus >= 0 ? 'income' : 'expense'} />
          <StatCard label="Monthly Needed (goals)"   value={fmt(totalMonthlyNeeded)}  sub="Goals with deadline" variant="purple" />
          <StatCard label="Surplus After Goals"      value={fmt(surplusAfterGoals)}   sub="Remaining budget" variant={surplusAfterGoals >= 0 ? 'primary' : 'expense'} glow />
        </div>

        {/* Goals grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const saved   = goalSaved(goal)
            const pct     = goalProgress(goal)
            const done    = goalComplete(goal)
            const color   = progressColor(pct, done)

            // Quick feasibility for overview
            const today = new Date()
            let warning = false
            if (!done && goal.targetDate) {
              const target = new Date(goal.targetDate)
              const months = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
              if (months > 0) {
                const needed = goalRemaining(goal) / months
                warning = needed > avgMonthlySurplus && avgMonthlySurplus > 0
              }
            }

            return (
              <button
                key={goal.id}
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="bg-dark-700 rounded-xl border border-border p-5 text-left hover:border-primary-400/40 hover:bg-dark-600/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-text-primary font-semibold truncate group-hover:text-primary-400 transition-colors">{goal.name}</h3>
                    {goal.targetDate && <p className="text-text-muted text-xs mt-0.5">Target: {goal.targetDate}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {warning && <AlertTriangle size={13} className="text-warning-500" />}
                    {done    && <CheckCircle   size={13} className="text-income-500" />}
                    <ChevronRight size={15} className="text-text-muted group-hover:text-primary-400 transition-colors" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-dark-500 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span style={{ color }} className="font-semibold">{fmt(saved)}</span>
                  <span className="text-text-muted text-xs">{pct.toFixed(0)}% of {fmt(goal.targetAmount)}</span>
                </div>

                {done && (
                  <div className="mt-3 flex items-center gap-1.5 text-income-500 text-xs font-medium">
                    <CheckCircle size={12} /> Goal achieved!
                  </div>
                )}
              </button>
            )
          })}
        </div>

      </>)}
    </div>
  )
}
