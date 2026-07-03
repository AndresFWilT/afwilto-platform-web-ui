import { useEffect, useState, useCallback } from 'react'
import { Card, Text, Button, Spinner, Alert, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import { StatisticsTable } from '../components/StatisticsTable'
import type { SetupConfig } from '../types'
import type { ErrorAnalysisResult } from '@/application/ports/IPhysicsLabService'

interface DeviationsStepProps {
  setup: SetupConfig
  measurements: number[][]
  onBack: () => void
  onNext: (result: ErrorAnalysisResult) => void
}

export function DeviationsStep({ setup, measurements, onBack, onNext }: DeviationsStepProps) {
  const { physicsLabService } = useServices()
  const [result, setResult]   = useState<ErrorAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const analyze = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await physicsLabService.analyzeMeasurements(
        measurements, setup.scaleError, setup.significantFigures
      )
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [measurements, setup, physicsLabService])

  useEffect(() => { analyze() }, [analyze])

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Text variant="h4" color="default">Step 4 — Deviations &amp; Errors</Text>
        {result && <Badge variant="success" size="sm">Computed</Badge>}
      </div>
      <Text variant="caption" color="muted">
        Mean, standard deviation (σ), accidental error (σ/√M), and absolute error (EE + accidental).
      </Text>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      )}

      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          {error}
          <Button variant="ghost" size="sm" onClick={analyze} className="mt-2">Retry</Button>
        </Alert>
      )}

      {result && <StatisticsTable points={result.points} />}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="primary" disabled={!result} onClick={() => result && onNext(result)}>
          Next →
        </Button>
      </div>
    </Card>
  )
}
