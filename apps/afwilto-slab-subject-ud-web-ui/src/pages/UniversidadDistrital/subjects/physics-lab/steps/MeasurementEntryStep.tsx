import { useState } from 'react'
import { Card, Text, Button } from '@afwilto/design-system'
import { MeasurementMatrix, emptyMatrix } from '../components/MeasurementMatrix'
import type { SetupConfig } from '../types'

interface MeasurementEntryStepProps {
  setup: SetupConfig
  initial: number[][] | null
  onBack: () => void
  onNext: (measurements: number[][]) => void
}

export function MeasurementEntryStep({ setup, initial, onBack, onNext }: MeasurementEntryStepProps) {
  const [values, setValues] = useState<number[][]>(
    initial ?? emptyMatrix(setup.n, setup.m)
  )

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <Text variant="h4" color="default">Step 2 — Enter Measurements</Text>
        <Text variant="caption" color="muted">
          Fill in the {setup.n} × {setup.m} measurement matrix (N data points × M repetitions each).
        </Text>
      </div>

      <MeasurementMatrix n={setup.n} m={setup.m} values={values} onChange={setValues} />

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button variant="primary" onClick={() => onNext(values)}>Next →</Button>
      </div>
    </Card>
  )
}
