import { Text } from '@afwilto/design-system'
import type { ExecutionStep } from './types'
import { processColor } from './types'

interface Props {
  steps: ExecutionStep[]
}

export function ExecutionLog({ steps }: Props) {
  if (steps.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" weight="semibold" color="default">Execution Log</Text>
      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {steps.map((step, i) => (
          <LogEntry key={i} step={step} index={i} />
        ))}
      </div>
    </div>
  )
}

function LogEntry({ step, index }: { step: ExecutionStep; index: number }) {
  if (step.action === 'IDLE') {
    return (
      <div className="flex items-center gap-2 text-xs font-mono py-0.5">
        <span className="text-neutral-600 w-5 text-right">{index + 1}.</span>
        <span className="text-neutral-500">t={step.time} — CPU idle</span>
      </div>
    )
  }

  if (step.action === 'BLOCKED') {
    const color = processColor(step.pid)
    return (
      <div className="flex items-start gap-2 text-xs font-mono py-0.5">
        <span className="text-neutral-600 w-5 text-right shrink-0">{index + 1}.</span>
        <span>
          <span className="text-neutral-400">t={step.time}:</span>{' '}
          <span className="font-bold" style={{ color }}>P{step.pid}</span>{' '}
          <span className="text-red-400">🔒 blocked ({step.remainingAfter} remaining)</span>
        </span>
      </div>
    )
  }

  if (step.action === 'UNBLOCKED') {
    const color = processColor(step.pid)
    return (
      <div className="flex items-start gap-2 text-xs font-mono py-0.5">
        <span className="text-neutral-600 w-5 text-right shrink-0">{index + 1}.</span>
        <span>
          <span className="text-neutral-400">t={step.time}:</span>{' '}
          <span className="font-bold" style={{ color }}>P{step.pid}</span>{' '}
          <span className="text-green-400">🔓 unblocked → back to ready queue</span>
        </span>
      </div>
    )
  }

  const color = processColor(step.pid)
  const actionText = step.action === 'COMPLETED'
    ? `→ COMPLETED`
    : `→ requeued (${step.remainingAfter} remaining)`

  return (
    <div className="flex items-start gap-2 text-xs font-mono py-0.5">
      <span className="text-neutral-600 w-5 text-right shrink-0">{index + 1}.</span>
      <span>
        <span className="text-neutral-400">t={step.time}:</span>{' '}
        <span className="font-bold" style={{ color }}>P{step.pid}</span>{' '}
        <span className="text-neutral-400">runs {step.timeUsed}u</span>{' '}
        <span style={{ color: step.action === 'COMPLETED' ? '#22c55e' : '#f59e0b' }}>{actionText}</span>
      </span>
    </div>
  )
}
