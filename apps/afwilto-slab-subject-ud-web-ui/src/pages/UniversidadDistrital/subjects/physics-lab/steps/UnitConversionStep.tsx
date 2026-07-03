import { useState, useEffect, useCallback } from 'react'
import { Card, Text, Button, Spinner, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { UnitGroup } from '@/application/ports/IPhysicsLabService'

interface UnitConversionStepProps {
  measurements: number[][]
  onBack: () => void
  onSkip: () => void
  onNext: (converted: number[][]) => void
}

const UNIT_COMPATIBLE: Record<string, string[]> = {
  km: ['m', 'cm'], m: ['km', 'cm'], cm: ['km', 'm'],
  h: ['min', 's', 'ms'], min: ['h', 's', 'ms'],
  s: ['h', 'min', 'ms'], ms: ['h', 'min', 's'],
}

export function UnitConversionStep({ measurements, onBack, onSkip, onNext }: UnitConversionStepProps) {
  const { physicsLabService } = useServices()
  const [units, setUnits]     = useState<UnitGroup[]>([])
  const [fromUnit, setFrom]   = useState('')
  const [toUnit, setTo]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    physicsLabService.getAvailableUnits().then(setUnits).catch(() => {})
  }, [physicsLabService])

  const allUnits = units.flatMap(g => g.units)
  const toOptions = fromUnit ? (UNIT_COMPATIBLE[fromUnit] ?? []) : []

  const handleConvert = useCallback(async () => {
    if (!fromUnit || !toUnit) return
    setLoading(true)
    setError(null)
    try {
      const converted = await physicsLabService.convertUnits(measurements, fromUnit, toUnit)
      onNext(converted)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setLoading(false)
    }
  }, [fromUnit, toUnit, measurements, physicsLabService, onNext])

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <Text variant="h4" color="default">Step 3 — Unit Conversion <span className="text-neutral-500 text-sm font-normal">(optional)</span></Text>
        <Text variant="caption" color="muted">Convert all measurement values between units. Skip if no conversion is needed.</Text>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase tracking-wider">From</label>
          <select value={fromUnit} onChange={e => { setFrom(e.target.value); setTo('') }}
            className="px-3 py-2 rounded-lg text-sm font-mono"
            style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-neutral-100)' }}>
            <option value="">Select unit…</option>
            {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase tracking-wider">To</label>
          <select value={toUnit} onChange={e => setTo(e.target.value)} disabled={!fromUnit}
            className="px-3 py-2 rounded-lg text-sm font-mono"
            style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-neutral-100)' }}>
            <option value="">Select unit…</option>
            {toOptions.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <Button variant="primary" disabled={!fromUnit || !toUnit || loading} onClick={handleConvert}>
          {loading ? <Spinner size="sm" /> : 'Convert'}
        </Button>
      </div>

      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="ghost" onClick={onSkip}>Skip (no conversion) →</Button>
      </div>
    </Card>
  )
}
