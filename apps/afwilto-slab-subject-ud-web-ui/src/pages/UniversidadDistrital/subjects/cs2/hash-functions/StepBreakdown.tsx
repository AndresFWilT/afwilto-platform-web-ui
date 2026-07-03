import { Text, Badge } from '@afwilto/design-system'
import type { HashFunctionResult } from '@/application/ports/IHashFunctionService'

interface StepBreakdownProps {
  result: HashFunctionResult
}

function StepRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-surface-border last:border-0">
      <Text variant="small" color="muted" className="w-44 shrink-0 font-mono uppercase tracking-wide text-xs">
        {label}
      </Text>
      <div className="flex-1 font-mono text-sm text-neutral-100 break-all">{value}</div>
    </div>
  )
}

function renderDivisionSteps(steps: HashFunctionResult['steps']) {
  return (
    <>
      <StepRow label="key"         value={String(steps.key)} />
      <StepRow label="prime"       value={String(steps.prime)} />
      <StepRow label="computation" value={<span className="text-green-400">{String(steps.computation)}</span>} />
    </>
  )
}

function renderMidSquareSteps(steps: HashFunctionResult['steps']) {
  return (
    <>
      <StepRow label="key"            value={String(steps.key)} />
      <StepRow label="squared"        value={<>{String(steps.key)}² = <span className="text-yellow-400">{String(steps.squared)}</span></>} />
      <StepRow label="binary"         value={<span className="tracking-wider">{String(steps.binary)}</span>} />
      <StepRow label="extracted bits" value={
        <span>
          positions [{String(steps.midStart)}:{String(steps.midEnd)}] →{' '}
          <span className="rounded bg-primary-600/30 px-1 text-primary-300">{String(steps.extractedBits)}</span>
        </span>
      } />
      <StepRow label="computation"    value={<span className="text-green-400">{String(steps.computation)}</span>} />
    </>
  )
}

function renderFoldingSteps(steps: HashFunctionResult['steps']) {
  const chunks   = steps.chunks   as string[]
  const xorSteps = steps.xorSteps as string[]

  return (
    <>
      <StepRow label="key"         value={String(steps.key)} />
      <StepRow label="binary"      value={<span className="tracking-wider">{String(steps.binary)}</span>} />
      <StepRow label="chunks"      value={
        <div className="flex flex-wrap gap-2">
          {chunks.map((c, i) => (
            <span key={i} className="rounded bg-brand-700 px-2 py-0.5 font-mono text-neutral-200">{c}</span>
          ))}
        </div>
      } />
      {xorSteps.length > 0 && (
        <StepRow label="XOR steps" value={
          <div className="flex flex-col gap-1">
            {xorSteps.map((s, i) => <span key={i} className="text-yellow-400">{s}</span>)}
          </div>
        } />
      )}
      <StepRow label="result bits"  value={<span className="text-primary-300">{String(steps.resultBits)}</span>} />
      <StepRow label="computation"  value={<span className="text-green-400">{String(steps.computation)}</span>} />
    </>
  )
}

function renderTransformationSteps(steps: HashFunctionResult['steps']) {
  const digitBinaries = steps.digitBinaries as string[]

  return (
    <>
      <StepRow label="key"               value={String(steps.key)} />
      <StepRow label={`base ${steps.base} repr`} value={<span className="text-yellow-400">{String(steps.baseRepresentation)}</span>} />
      <StepRow label="digit → binary"    value={
        <div className="flex flex-wrap gap-2">
          {digitBinaries.map((b, i) => (
            <span key={i} className="rounded bg-brand-700 px-2 py-0.5 font-mono text-neutral-200">{b}</span>
          ))}
        </div>
      } />
      <StepRow label="binary concat"     value={<span className="tracking-wider text-primary-300">{String(steps.binaryConcat)}</span>} />
      <StepRow label="decimal before %"  value={String(steps.decimalBeforeMod)} />
      <StepRow label="computation"       value={<span className="text-green-400">{String(steps.computation)}</span>} />
    </>
  )
}

export function StepBreakdown({ result }: StepBreakdownProps) {
  const renderers: Record<string, (steps: HashFunctionResult['steps']) => React.ReactNode> = {
    DIVISION:       renderDivisionSteps,
    MID_SQUARE:     renderMidSquareSteps,
    FOLDING:        renderFoldingSteps,
    TRANSFORMATION: renderTransformationSteps,
  }

  const renderer = renderers[result.method]

  return (
    <div className="flex flex-col gap-4">
      {/* Result badge */}
      <div className="flex items-center gap-3">
        <Badge variant="success" size="md">Hash index: {result.hashIndex}</Badge>
        <Text variant="small" color="muted">{result.method.replace('_', '-')}</Text>
      </div>

      {/* Step-by-step breakdown */}
      <div className="rounded-lg border border-surface-border">
        {renderer ? renderer(result.steps) : (
          <div className="p-4">
            <Text variant="small" color="muted">No step breakdown available for this method.</Text>
          </div>
        )}
      </div>
    </div>
  )
}
