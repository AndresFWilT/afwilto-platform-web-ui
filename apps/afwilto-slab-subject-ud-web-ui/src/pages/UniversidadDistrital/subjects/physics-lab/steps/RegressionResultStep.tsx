import { useEffect, useState, useCallback } from 'react'
import { Card, Text, Button, Spinner, Alert, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import { RegressionTable } from '../components/RegressionTable'
import type { RegressionResult, DataPoint } from '@/application/ports/IPhysicsLabService'

interface RegressionResultStepProps {
  dataPoints: DataPoint[]
  linearizationExponent: number
  significantFigures: number
  onBack: () => void
  onRestart: () => void
}

export function RegressionResultStep({
  dataPoints,
  linearizationExponent,
  significantFigures,
  onBack,
  onRestart,
}: RegressionResultStepProps) {
  const { physicsLabService } = useServices()
  const [result, setResult]   = useState<RegressionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const compute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await physicsLabService.computeRegression(
        dataPoints, linearizationExponent, significantFigures
      )
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regression failed')
    } finally {
      setLoading(false)
    }
  }, [dataPoints, linearizationExponent, significantFigures, physicsLabService])

  useEffect(() => { compute() }, [compute])

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Text variant="h4" color="default">Step 7 — Regression Results</Text>
        {result && <Badge variant="success" size="sm">Complete</Badge>}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      )}

      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          {error}
          <Button variant="ghost" size="sm" onClick={compute} className="mt-2">Retry</Button>
        </Alert>
      )}

      {result && <RegressionTable result={result} />}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="ghost" onClick={onRestart}>Start new experiment</Button>
      </div>
    </Card>
  )
}
