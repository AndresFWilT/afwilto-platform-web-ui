import { useState, useCallback } from 'react'
import { Card, Text, Button, FormField, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { PointStatistics, PropagatedValue, PropagationOperation } from '@/application/ports/IPhysicsLabService'

interface ErrorPropagationStepProps {
  analysisPoints: PointStatistics[]
  onBack: () => void
  onSkip: () => void
  onNext: (results: PropagatedValue[]) => void
}

const OPERATIONS: { value: PropagationOperation; label: string; formula: string }[] = [
  { value: 'ADD',      label: 'Add (x + y)',      formula: 'δ = δx + δy' },
  { value: 'SUBTRACT', label: 'Subtract (x − y)', formula: 'δ = δx + δy' },
  { value: 'MULTIPLY', label: 'Multiply (x × y)', formula: 'δ = |x|δy + |y|δx' },
  { value: 'DIVIDE',   label: 'Divide (x ÷ y)',   formula: 'δ = (|x|δy + |y|δx) / y²' },
]

export function ErrorPropagationStep({ analysisPoints, onBack, onSkip, onNext }: ErrorPropagationStepProps) {
  const { physicsLabService } = useServices()

  const xValues  = analysisPoints.map(p => p.mean)
  const xErrors  = analysisPoints.map(p => p.absoluteError)

  const [yRaw, setYRaw]       = useState<string[]>(Array(analysisPoints.length).fill('0'))
  const [yError, setYError]   = useState('0.01')
  const [op, setOp]           = useState<PropagationOperation>('ADD')
  const [results, setResults] = useState<PropagatedValue[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handlePropagate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const yVals = yRaw.map(v => parseFloat(v) || 0)
      const yErr  = parseFloat(yError) || 0
      const avgXError = xErrors.reduce((a, b) => a + b, 0) / xErrors.length
      const r = await physicsLabService.propagateError(xValues, yVals, avgXError, yErr, op)
      setResults(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Propagation failed')
    } finally {
      setLoading(false)
    }
  }, [yRaw, yError, op, xValues, xErrors, physicsLabService])

  const selectedOp = OPERATIONS.find(o => o.value === op)!

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <Text variant="h4" color="default">Step 5 — Error Propagation <span className="text-neutral-500 text-sm font-normal">(optional)</span></Text>
        <Text variant="caption" color="muted">
          Combine x±δx (means from step 4) with y±δy through an arithmetic operation.
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {OPERATIONS.map(o => (
            <button key={o.value} onClick={() => setOp(o.value)}
              className="px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: op === o.value ? 'var(--color-primary-600)' : 'var(--color-surface-overlay)',
                border: `1px solid ${op === o.value ? 'var(--color-primary-400)' : 'var(--color-surface-border)'}`,
                color: op === o.value ? 'white' : 'var(--color-neutral-300)',
              }}>
              {o.label}
            </button>
          ))}
        </div>
        <Text variant="caption" color="muted">Formula: <span className="font-mono text-primary-400">{selectedOp.formula}</span></Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Text variant="caption" color="muted">Y values</Text>
          {analysisPoints.map((_p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-500 w-8">y{i+1}</span>
              <input type="number" step="any" value={yRaw[i]}
                onChange={e => { const n = [...yRaw]; n[i] = e.target.value; setYRaw(n) }}
                className="flex-1 px-2 py-1 text-sm font-mono rounded"
                style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-neutral-100)' }} />
            </div>
          ))}
        </div>
        <FormField id="yError" label="Y scale error (δy)" type="number" step="any" min={0}
          value={yError} onChange={e => setYError(e.target.value)} />
      </div>

      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

      {results && (
        <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-2 px-3 text-left text-xs text-neutral-500">Point</th>
                <th className="py-2 px-3 text-left text-xs text-neutral-500">Value</th>
                <th className="py-2 px-3 text-left text-xs text-neutral-500">Uncertainty (δ)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-surface-border/40">
                  <td className="py-1.5 px-3 font-mono text-neutral-400">#{i+1}</td>
                  <td className="py-1.5 px-3 font-mono text-neutral-100 font-semibold">{r.value}</td>
                  <td className="py-1.5 px-3 font-mono text-amber-400">±{r.uncertainty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <div className="flex gap-2">
          <Button variant="primary" loading={loading} onClick={handlePropagate}>Compute</Button>
          {results && (
            <Button variant="primary" onClick={() => results && onNext(results)}>Next →</Button>
          )}
          <Button variant="ghost" onClick={onSkip}>Skip →</Button>
        </div>
      </div>
    </Card>
  )
}
