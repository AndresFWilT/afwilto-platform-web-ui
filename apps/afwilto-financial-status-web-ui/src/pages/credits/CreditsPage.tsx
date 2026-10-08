import { useMemo, useState } from 'react'
import { Button, Input } from '@afwilto/design-system'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, X, CreditCard, Landmark, ChevronRight, CheckCircle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCredits } from '../../context/CreditsContext'
import StatCard from '../../components/StatCard'
import {
  type CreditType,
  creditMonthlyPayment, creditRemainingBalance, creditTotalInterest,
  creditIsActive, creditProgress, creditAnnualRate,
  fmt, fmtPct,
} from '../../types'
import { colors } from '../../tokens'

const PIE_COLORS = [colors.primary[400], colors.info[500], colors.expense[500], colors.warning[500], colors.income[500]]

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-3 text-sm shadow-lg">
      <p style={{ color: payload[0].payload.fill }} className="font-semibold">{payload[0].name}</p>
      <p className="text-neutral-100">{fmt(payload[0].value)}</p>
    </div>
  )
}

const TYPE_LABELS: Record<CreditType, string> = { credit_card: 'CC', loan: 'Loan' }

function progressColor(pct: number, done: boolean) {
  if (done)    return colors.income[500]
  if (pct > 66) return colors.primary[400]
  if (pct > 33) return colors.info[500]
  return colors.expense[500]
}

const today = new Date().toISOString().slice(0, 10)

export default function CreditsPage() {
  const { credits, addCredit } = useCredits()
  const navigate = useNavigate()

  const activeCredits = useMemo(() => credits.filter(creditIsActive), [credits])
  const totalMonthly  = useMemo(() => activeCredits.reduce((s, c) => s + creditMonthlyPayment(c), 0), [activeCredits])
  const totalDebt     = useMemo(() => credits.reduce((s, c) => s + creditRemainingBalance(c), 0), [credits])
  const totalInterest = useMemo(() => credits.reduce((s, c) => s + creditTotalInterest(c), 0), [credits])

  const pieData = useMemo(() =>
    activeCredits.map(c => ({ name: c.name.split('—')[0].trim(), value: creditRemainingBalance(c) }))
  , [activeCredits])

  // ── Add form ─────────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'credit_card' as CreditType,
    name: '',
    description: '',
    principal: '',
    monthlyRatePct: '',   // user enters "1.8", stored as 0.018
    installments: '',
    paidInstallments: '0',
    startDate: today,
  })

  const preview = useMemo(() => {
    const p = Number(form.principal)
    const r = Number(form.monthlyRatePct) / 100
    const n = Number(form.installments)
    if (p <= 0 || n <= 0) return null
    const c = { principal: p, monthlyRate: r, installments: n, paidInstallments: 0, id: '', type: form.type, name: '', startDate: form.startDate, createdAt: '' }
    return {
      monthly: creditMonthlyPayment(c),
      totalInterest: creditTotalInterest(c),
      annualRate: creditAnnualRate(c),
    }
  }, [form.principal, form.monthlyRatePct, form.installments, form.type, form.startDate])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(form.principal)
    const n = Number(form.installments)
    const paid = Number(form.paidInstallments)
    if (!form.name.trim() || p <= 0 || n <= 0) return
    addCredit({
      type: form.type,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      principal: p,
      monthlyRate: Number(form.monthlyRatePct) / 100,
      installments: n,
      paidInstallments: Math.min(paid, n),
      startDate: form.startDate,
    })
    setForm({ type: 'credit_card', name: '', description: '', principal: '', monthlyRatePct: '', installments: '', paidInstallments: '0', startDate: today })
    setShowForm(false)
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Credits</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Credit cards & loans tracker</p>
        </div>
        <Button variant="info" size="sm" className="w-fit" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={16} /> : <PlusCircle size={16} />}
          {showForm ? 'Cancel' : 'Add Credit'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-surface-raised border border-info-500/20 rounded-xl p-5">
          <h2 className="text-neutral-100 font-semibold mb-4">New Credit / TC Purchase</h2>

          {/* Type toggle */}
          <div className="flex gap-2 mb-4">
            {(['credit_card', 'loan'] as CreditType[]).map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  form.type === t
                    ? 'bg-info-500/15 text-info-400 border-info-500/30'
                    : 'bg-surface-raised text-neutral-400 border-surface-border'
                }`}>
                {t === 'credit_card' ? <CreditCard size={14} /> : <Landmark size={14} />}
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 lg:col-span-2">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Name *</label>
              <Input type="text" placeholder='e.g. "Visa Gold — Bancolombia"' value={form.name} onChange={f('name')} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Description <span className="text-neutral-600">(optional)</span></label>
              <Input type="text" placeholder='e.g. "iPhone 15 Pro"' value={form.description} onChange={f('description')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Principal *</label>
              <Input type="number" min="1" step="0.01" placeholder="1,200.00" value={form.principal} onChange={f('principal')} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Monthly rate (%) *</label>
              <Input type="number" min="0" step="0.01" placeholder="1.80" value={form.monthlyRatePct} onChange={f('monthlyRatePct')} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Installments *</label>
              <Input type="number" min="1" step="1" placeholder="12" value={form.installments} onChange={f('installments')} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">Paid so far</label>
              <Input type="number" min="0" step="1" placeholder="0" value={form.paidInstallments} onChange={f('paidInstallments')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-neutral-500 text-xs uppercase tracking-wider">First payment date *</label>
              <Input type="date" value={form.startDate} onChange={f('startDate')} required />
            </div>
          </div>

          {/* Live preview */}
          {preview && (
            <div className="mt-4 grid grid-cols-3 gap-3 bg-surface-raised rounded-lg p-4 border border-info-500/10">
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Monthly payment</p>
                <p className="text-info-400 font-bold text-lg">{fmt(preview.monthly)}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Total interest</p>
                <p className="text-expense-400 font-semibold">{fmt(preview.totalInterest)}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Annual rate (EA)</p>
                <p className="text-warning-400 font-semibold">{fmtPct(preview.annualRate, 1)}</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="info" type="submit">
              Save Credit
              </Button>
          </div>
        </form>
      )}

      {/* Aggregate stats */}
      {credits.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Monthly Commitment" value={fmt(totalMonthly)}  sub="Active credits" variant="accent" />
          <StatCard label="Remaining Debt"     value={fmt(totalDebt)}    sub="All credits"    variant="expense" />
          <StatCard label="Total Interest"     value={fmt(totalInterest)}sub="Full term cost"  variant="expense" />
          <StatCard label="Active Credits"     value={String(activeCredits.length)} sub={`of ${credits.length} total`} variant="primary" />
        </div>
      )}

      {/* Charts + list */}
      {credits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Debt distribution pie */}
          <div className="lg:col-span-2 bg-surface-raised rounded-xl border border-surface-border p-5">
            <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider mb-4">Debt Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: colors.text.secondary }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-neutral-500 text-sm text-center py-12">All credits paid!</p>}
          </div>

          {/* Credits list */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-neutral-100 font-semibold text-sm uppercase tracking-wider">Credits</h2>
            {credits.map(c => {
              const monthly  = creditMonthlyPayment(c)
              const debt     = creditRemainingBalance(c)
              const pct      = creditProgress(c)
              const done     = !creditIsActive(c)
              const color    = progressColor(pct, done)

              return (
                <button key={c.id} onClick={() => navigate(`/finance/credits/${c.id}`)}
                  className="w-full bg-surface-raised rounded-xl border border-surface-border p-4 text-left hover:border-info-500/40 hover:bg-surface-overlay/50 transition-all group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {c.type === 'credit_card' ? <CreditCard size={13} className="text-info-400 shrink-0" /> : <Landmark size={13} className="text-primary-400 shrink-0" />}
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          c.type === 'credit_card' ? 'bg-info-500/15 text-info-400' : 'bg-primary-400/15 text-primary-400'
                        }`}>{TYPE_LABELS[c.type]}</span>
                      </div>
                      <p className="text-neutral-100 font-semibold text-sm truncate group-hover:text-info-400 transition-colors">{c.name}</p>
                      {c.description && <p className="text-neutral-500 text-xs">{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {done && <CheckCircle size={13} className="text-income-500" />}
                      <ChevronRight size={15} className="text-neutral-500 group-hover:text-info-400 transition-colors" />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="h-1.5 bg-brand-700 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-neutral-500">{c.paidInstallments}/{c.installments} installments</span>
                    {!done && <span className="text-info-400 font-semibold">{fmt(monthly)}/mo</span>}
                    <span className="text-neutral-400 ml-auto">{fmt(debt)} remaining</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {credits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
          <CreditCard size={48} className="mb-4 opacity-20" />
          <p className="text-base font-medium text-neutral-400">No credits yet</p>
          <p className="text-sm mt-1">Add a credit card purchase or loan to start tracking.</p>
        </div>
      )}
    </div>
  )
}
