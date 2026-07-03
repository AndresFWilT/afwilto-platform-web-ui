import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'
import type { SetupConfig } from '../types'

interface SetupStepProps {
  onNext: (config: SetupConfig) => void
}

export function SetupStep({ onNext }: SetupStepProps) {
  const [n, setN]   = useState('3')
  const [m, setM]   = useState('4')
  const [ee, setEe] = useState('0.01')
  const [cs, setCs] = useState('3')

  const nv = parseInt(n), mv = parseInt(m)
  const eev = parseFloat(ee), csv = parseInt(cs)
  const valid = nv >= 1 && mv >= 2 && eev >= 0 && csv >= 1

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <Text variant="h4" color="default">Step 1 — Experiment Setup</Text>
        <Text variant="caption" color="muted">Configure the dimensions and precision of your measurements.</Text>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FormField id="n" label="N — data points" type="number" min={1} value={n}
          onChange={e => setN(e.target.value)} />
        <FormField id="m" label="M — repetitions" type="number" min={2} value={m}
          onChange={e => setM(e.target.value)} />
        <FormField id="ee" label="Scale error (EE)" type="number" step="any" min={0} value={ee}
          onChange={e => setEe(e.target.value)} />
        <FormField id="cs" label="Significant figures" type="number" min={1} max={10} value={cs}
          onChange={e => setCs(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" disabled={!valid}
          onClick={() => valid && onNext({ n: nv, m: mv, scaleError: eev, significantFigures: csv })}>
          Next →
        </Button>
      </div>
    </Card>
  )
}
