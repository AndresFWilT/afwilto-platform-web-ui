import { useState } from 'react'
import { Text, Card, Alert, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { MethodSelector } from './MethodSelector'
import { MethodInputForm } from './MethodInputForm'
import { StepBreakdown } from './StepBreakdown'
import type { HashMethod, HashFunctionResult } from '@/application/ports/IHashFunctionService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'hash-functions')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function HashFunctionsPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <HashFunctionsVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer ───────────────────────────────────────────────────────────

function HashFunctionsVisualizer() {
  const { hashFunctionService } = useServices()

  const [method, setMethod]       = useState<HashMethod>('DIVISION')
  const [key_, setKey]            = useState(0)
  const [prime, setPrime]         = useState(7)
  const [bitWidth, setBitWidth]   = useState(4)
  const [base, setBase]           = useState(11)
  const [arraySize, setArraySize] = useState(100)
  const [result, setResult]       = useState<HashFunctionResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function handleMethodChange(m: HashMethod) {
    setMethod(m)
    setResult(null)
    setError(null)
  }

  async function handleCompute() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await hashFunctionService.compute({
        method,
        key:       key_,
        prime:     method === 'DIVISION'       ? prime     : undefined,
        bitWidth:  method === 'MID_SQUARE' || method === 'FOLDING' ? bitWidth : undefined,
        base:      method === 'TRANSFORMATION' ? base      : undefined,
        arraySize: method === 'TRANSFORMATION' ? arraySize : undefined,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Hash Functions</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Method description */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([
          { method: 'DIVISION',       label: 'Division',       formula: 'h(k) = k % p',         desc: 'Key mod prime. Simple and fast.' },
          { method: 'MID_SQUARE',     label: 'Mid-Square',     formula: 'h(k) = mid(k²)',        desc: 'Square → binary → middle bits.' },
          { method: 'FOLDING',        label: 'Folding (XOR)',  formula: 'h(k) = XOR(chunks)',    desc: 'Binary → equal chunks → XOR.' },
          { method: 'TRANSFORMATION', label: 'Transformation', formula: 'h(k) = concat(b) % n',  desc: 'Base convert → binary concat → mod.' },
        ] as const).map(card => (
          <div
            key={card.method}
            onClick={() => handleMethodChange(card.method as HashMethod)}
            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              method === card.method
                ? 'border-primary-500 bg-primary-900/20'
                : 'border-surface-border bg-surface-raised hover:border-neutral-500'
            }`}
          >
            <Text variant="small" weight="semibold" color="default">{card.label}</Text>
            <Text variant="caption" color="muted" className="font-mono mt-0.5 block">{card.formula}</Text>
            <Text variant="caption" color="muted" className="mt-1">{card.desc}</Text>
          </div>
        ))}
      </div>

      {/* Controls */}
      <Card padding="md">
        <div className="flex flex-col gap-4">
          <MethodSelector value={method} onChange={handleMethodChange} disabled={loading} />
          <MethodInputForm
            method={method}
            key_={key_}          prime={prime}
            bitWidth={bitWidth}  base={base}
            arraySize={arraySize}
            onKeyChange={setKey}               onPrimeChange={setPrime}
            onBitWidthChange={setBitWidth}     onBaseChange={setBase}
            onArraySizeChange={setArraySize}
            onCompute={handleCompute}
            loading={loading}
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Step breakdown — the educational centerpiece */}
      {result && (
        <div className="flex flex-col gap-3">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Step-by-step computation
          </Text>
          <Card padding="md">
            <StepBreakdown result={result} />
          </Card>
        </div>
      )}
    </div>
  )
}
