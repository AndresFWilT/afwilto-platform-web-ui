import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'
import type { PointStatistics } from '@/application/ports/IPhysicsLabService'

interface RegressionInputStepProps {
  analysisPoints: PointStatistics[]
  initialDataPoints: { x: number; y: number }[]
  initialExponent: number
  onBack: () => void
  onNext: (dataPoints: { x: number; y: number }[], exponent: number) => void
}

export function RegressionInputStep({
  analysisPoints,
  initialDataPoints,
  initialExponent,
  onBack,
  onNext,
}: RegressionInputStepProps) {
  const defaultPoints = analysisPoints.map((p, i) => ({
    x: initialDataPoints[i]?.x ?? p.mean,
    y: initialDataPoints[i]?.y ?? 0,
  }))
  const [points, setPoints]     = useState(defaultPoints)
  const [exponent, setExponent] = useState(String(initialExponent || 1))

  const setX = (i: number, v: string) => {
    const next = [...points]
    next[i] = { ...next[i], x: parseFloat(v) || 0 }
    setPoints(next)
  }
  const setY = (i: number, v: string) => {
    const next = [...points]
    next[i] = { ...next[i], y: parseFloat(v) || 0 }
    setPoints(next)
  }

  const exp = parseInt(exponent) || 1

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <Text variant="h4" color="default">Step 6 — Regression Input</Text>
        <Text variant="caption" color="muted">
          xi values are pre-filled from the means computed in Step 4. Enter yi values and the linearization exponent.
        </Text>
      </div>

      <div className="w-40">
        <FormField id="exponent" label="Linearization exponent (p)" type="number" min={1} max={10}
          value={exponent} onChange={e => setExponent(e.target.value)} />
        {exp !== 1 && (
          <Text variant="caption" color="muted">xi = x<sup>{exp}</sup></Text>
        )}
      </div>

      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: '320px' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-2 px-3 text-left text-xs text-neutral-500 w-10">#</th>
                <th className="py-2 px-3 text-left text-xs text-neutral-500">xi (mean)</th>
                <th className="py-2 px-3 text-left text-xs text-neutral-500">yi</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} className="border-b border-surface-border/40">
                  <td className="py-1.5 px-3 font-mono text-neutral-500">{i + 1}</td>
                  <td className="py-1.5 px-3">
                    <input type="number" step="any" value={p.x}
                      onChange={e => setX(i, e.target.value)}
                      className="w-full px-2 py-1 text-sm font-mono rounded"
                      style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-neutral-100)' }} />
                  </td>
                  <td className="py-1.5 px-3">
                    <input type="number" step="any" value={p.y}
                      onChange={e => setY(i, e.target.value)}
                      className="w-full px-2 py-1 text-sm font-mono rounded"
                      style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-neutral-100)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="primary" onClick={() => onNext(points, exp)}>Compute Regression →</Button>
      </div>
    </Card>
  )
}
