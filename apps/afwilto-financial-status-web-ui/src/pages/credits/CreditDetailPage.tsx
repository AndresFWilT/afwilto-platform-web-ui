import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Landmark, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, ReferenceLine } from 'recharts'
import { useCredits } from '../../context/CreditsContext'
import StatCard from '../../components/StatCard'
import {
  type CreditType,
  creditMonthlyPayment, creditRemainingBalance, creditTotalInterest,
  creditIsActive, creditProgress, creditAnnualRate, creditAmortizationTable,
  fmt, fmtPct,
} from '../../types'
import { colors } from '../../tokens'

const TYPE_LABELS: Record<CreditType, string> = { credit_card: 'TC — Tarjeta de Crédito', loan: 'Crédito / Préstamo' }

function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-700 border border-border rounded-xl p-3 text-sm shadow-lg min-w-[160px]">
      <p className="text-text-secondary mb-2">{label}</p>
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
  const p = payload[0]
  const i = payload[1]
  return (
    <div className="bg-dark-700 border border-border rounded-xl p-3 text-sm shadow-lg min-w-[160px]">
      <p className="text-text-secondary mb-2 font-medium">Cuota #{label}</p>
      <p className="flex justify-between gap-4 text-primary-400"><span>Principal</span><span className="font-semibold">{fmt(p?.value ?? 0)}</span></p>
      <p className="flex justify-between gap-4 text-expense-400"><span>Interest</span><span className="font-semibold">{fmt(i?.value ?? 0)}</span></p>
      <p className="flex justify-between gap-4 text-text-secondary border-t border-border pt-1 mt-1"><span>Payment</span><span className="font-semibold">{fmt((p?.value ?? 0) + (i?.value ?? 0))}</span></p>
    </div>
  )
}

export default function CreditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { credits, updateCredit, deleteCredit, setPaidInstallments } = useCredits()

  const credit = credits.find(c => c.id === id)

  if (!credit) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <p className="text-text-secondary">Credit not found.</p>
      <button onClick={() => navigate('/finance/credits')} className="text-purple-400 text-sm flex items-center gap-1 hover:underline"><ArrowLeft size={14} /> Back to Créditos</button>
    </div>
  )

  const monthly   = creditMonthlyPayment(credit)
  const debt      = creditRemainingBalance(credit)
  const interest  = creditTotalInterest(credit)
  const pct       = creditProgress(credit)
  const active    = creditIsActive(credit)
  const annualEA  = creditAnnualRate(credit)
  const rows      = useMemo(() => creditAmortizationTable(credit), [credit])

  // ── Chart: balance over time ──────────────────────────────────────────────
  const balanceData = useMemo(() =>
    rows.map(r => ({
      label: `#${r.installment}`,
      Balance: r.balance,
      Principal: r.principalPortion,
      Interest: r.interestPortion,
    }))
  , [rows])

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: credit.name,
    description: credit.description ?? '',
    principal: String(credit.principal),
    monthlyRatePct: String((credit.monthlyRate * 100).toFixed(2)),
    installments: String(credit.installments),
    startDate: credit.startDate,
  })

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateCredit(credit.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      principal: Number(editForm.principal),
      monthlyRate: Number(editForm.monthlyRatePct) / 100,
      installments: Number(editForm.installments),
      startDate: editForm.startDate,
    })
    setEditing(false)
  }

  const ef = (k: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditForm(p => ({ ...p, [k]: e.target.value }))

  const inputCls = "bg-dark-800 border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 placeholder:text-text-disabled w-full"

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div>
        <button onClick={() => navigate('/finance/credits')} className="flex items-center gap-1.5 text-text-muted hover:text-purple-400 text-sm transition-colors mb-3">
          <ArrowLeft size={14} /> Créditos
        </button>

        {!editing ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {credit.type === 'credit_card' ? <CreditCard size={16} className="text-purple-400" /> : <Landmark size={16} className="text-primary-400" />}
                <span className="text-text-muted text-xs uppercase tracking-wider">{TYPE_LABELS[credit.type]}</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary">{credit.name}</h1>
              {credit.description && <p className="text-text-muted text-sm mt-0.5">{credit.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-text-muted hover:text-purple-400 border border-border hover:border-purple-500/40 px-3 py-1.5 rounded-lg text-sm transition-colors">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => { deleteCredit(credit.id); navigate('/finance/credits') }} className="flex items-center gap-1.5 text-text-muted hover:text-expense-500 border border-border hover:border-expense-500/40 px-3 py-1.5 rounded-lg text-sm transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEditSave} className="bg-dark-700 border border-purple-500/20 rounded-xl p-5">
            <h2 className="text-text-primary font-semibold mb-4">Edit Credit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
                <label className="text-text-muted text-xs uppercase tracking-wider">Name *</label>
                <input type="text" value={editForm.name} onChange={ef('name')} required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-muted text-xs uppercase tracking-wider">Description</label>
                <input type="text" value={editForm.description} onChange={ef('description')} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-muted text-xs uppercase tracking-wider">Principal *</label>
                <input type="number" min="1" step="0.01" value={editForm.principal} onChange={ef('principal')} required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-muted text-xs uppercase tracking-wider">Monthly rate (%)</label>
                <input type="number" min="0" step="0.01" value={editForm.monthlyRatePct} onChange={ef('monthlyRatePct')} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-muted text-xs uppercase tracking-wider">Installments</label>
                <input type="number" min="1" step="1" value={editForm.installments} onChange={ef('installments')} required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-text-muted text-xs uppercase tracking-wider">First payment date</label>
                <input type="date" value={editForm.startDate} onChange={ef('startDate')} className={inputCls} />
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg">Cancel</button>
              <button type="submit" className="bg-purple-500 hover:bg-purple-400 text-white font-semibold px-4 py-2 rounded-lg text-sm">Save</button>
            </div>
          </form>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-dark-700 rounded-xl border border-border p-5">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-text-primary font-semibold">{credit.paidInstallments} of {credit.installments} cuotas paid</span>
          <span className="text-text-muted">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-dark-500 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: active ? colors.purple[500] : colors.income[500] }} />
        </div>
        {!active && (
          <p className="text-income-500 text-xs mt-2 flex items-center gap-1"><CheckCircle size={12} /> Credit fully paid!</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Payment" value={fmt(monthly)}   sub={`${credit.installments} cuotas`}         variant="purple" glow />
        <StatCard label="Remaining Debt"  value={fmt(debt)}      sub={`${credit.installments - credit.paidInstallments} left`} variant={active ? 'expense' : 'income'} />
        <StatCard label="Total Interest"  value={fmt(interest)}  sub={`${fmtPct(credit.monthlyRate)}/mo · ${fmtPct(annualEA, 1)} EA`} variant="expense" />
        <StatCard label="Principal"       value={fmt(credit.principal)} sub="Original amount"               variant="primary" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bar: principal vs interest per installment */}
        <div className="bg-dark-700 rounded-xl border border-border p-5">
          <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Payment Breakdown per Installment</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={balanceData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.dark[500]} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.text.secondary, fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(rows.length / 8)} />
              <YAxis tick={{ fill: colors.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={40} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Principal" fill={colors.primary[400]} stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="Interest"  fill={colors.expense[500]} stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area: remaining balance over time */}
        <div className="bg-dark-700 rounded-xl border border-border p-5">
          <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-4">Remaining Balance Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={balanceData}>
              <defs>
                <linearGradient id="balGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={colors.purple[500]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.purple[500]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.dark[500]} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.text.secondary, fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(rows.length / 8)} />
              <YAxis tick={{ fill: colors.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} width={44} />
              <Tooltip content={<AreaTooltip />} />
              <ReferenceLine y={0} stroke={colors.income[500]} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="Balance" stroke={colors.purple[500]} fill="url(#balGradient)" strokeWidth={2} dot={false} name="Remaining balance" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Amortization table */}
      <div className="bg-dark-700 rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wider">Amortization Table</h2>
          {active && (
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Paid cuotas:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPaidInstallments(credit.id, credit.paidInstallments - 1)}
                  disabled={credit.paidInstallments === 0}
                  className="w-7 h-7 flex items-center justify-center bg-dark-600 hover:bg-dark-500 text-text-secondary rounded-lg text-sm disabled:opacity-30 transition-colors">−</button>
                <span className="text-text-primary font-semibold text-sm w-8 text-center">{credit.paidInstallments}</span>
                <button onClick={() => setPaidInstallments(credit.id, credit.paidInstallments + 1)}
                  disabled={credit.paidInstallments === credit.installments}
                  className="w-7 h-7 flex items-center justify-center bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm disabled:opacity-30 transition-colors">+</button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-dark-800 text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-3 py-3">#</th>
                <th className="text-left px-3 py-3">Date</th>
                <th className="text-right px-3 py-3 hidden md:table-cell">Principal</th>
                <th className="text-right px-3 py-3 hidden md:table-cell">Interest</th>
                <th className="text-right px-3 py-3">Payment</th>
                <th className="text-right px-3 py-3">Balance</th>
                <th className="px-3 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isNext = r.installment === credit.paidInstallments + 1
                return (
                  <tr key={r.installment}
                    onClick={() => active && setPaidInstallments(credit.id, r.isPaid ? r.installment - 1 : r.installment)}
                    className={`border-t border-border transition-colors cursor-pointer ${
                      r.isPaid  ? 'bg-income-500/5 hover:bg-income-500/8'
                      : isNext  ? 'bg-purple-500/8 hover:bg-purple-500/12'
                      :           'bg-dark-700 hover:bg-dark-600/40'
                    }`}>
                    <td className={`px-3 py-2.5 font-medium text-xs ${r.isPaid ? 'text-income-500' : isNext ? 'text-purple-400' : 'text-text-muted'}`}>
                      {r.installment}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary text-xs whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 text-right text-text-secondary hidden md:table-cell">{fmt(r.principalPortion)}</td>
                    <td className="px-3 py-2.5 text-right text-expense-400/80 hidden md:table-cell">{fmt(r.interestPortion)}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${r.isPaid ? 'text-income-500' : isNext ? 'text-purple-400' : 'text-text-primary'}`}>
                      {fmt(r.payment)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">{fmt(r.balance)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {r.isPaid
                        ? <CheckCircle size={13} className="text-income-500 mx-auto" />
                        : isNext
                          ? <span className="text-purple-400 text-[10px] font-medium">NEXT</span>
                          : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-purple-500/20 bg-dark-800 sticky bottom-0">
                <td colSpan={2} className="px-3 py-3 text-text-muted text-xs uppercase tracking-wider">Total</td>
                <td className="px-3 py-3 text-right text-primary-400 hidden md:table-cell">{fmt(credit.principal)}</td>
                <td className="px-3 py-3 text-right text-expense-400 hidden md:table-cell">{fmt(interest)}</td>
                <td className="px-3 py-3 text-right text-text-primary font-bold">{fmt(monthly * credit.installments)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-text-muted text-xs mt-3">Click a row to toggle paid status.</p>
      </div>
    </div>
  )
}
