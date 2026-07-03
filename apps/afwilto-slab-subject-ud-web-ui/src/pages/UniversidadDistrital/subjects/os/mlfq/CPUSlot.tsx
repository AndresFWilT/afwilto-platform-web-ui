import { Text } from '@afwilto/design-system'
import type { MLFQExecutionStep } from './types'
import { QUEUE_COLORS, QUEUE_LABELS } from './types'

interface Props {
  lastStep: MLFQExecutionStep | null
}

export function CPUSlot({ lastStep }: Props) {
  if (!lastStep || lastStep.action === 'IDLE') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}>
        <span className="text-neutral-600 font-mono text-sm">CPU — idle</span>
      </div>
    )
  }

  const color = QUEUE_COLORS[lastStep.queueLevel]

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg"
      style={{ backgroundColor: `${color}18`, border: `1.5px solid ${color}66` }}>
      <div className="flex flex-col items-center justify-center rounded-md shrink-0"
        style={{ width: 48, height: 48, backgroundColor: `${color}33`, border: `2px solid ${color}` }}>
        <span className="font-mono font-bold text-sm" style={{ color }}>P{lastStep.pid}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <Text variant="small" weight="semibold" color="default">
          CPU executing P{lastStep.pid}
        </Text>
        <Text variant="caption" color="muted">
          {QUEUE_LABELS[lastStep.queueLevel]} · used {lastStep.timeUsed}u · remaining {lastStep.remainingAfter}
        </Text>
        <span className="text-xs font-mono" style={{ color: actionColor(lastStep.action) }}>
          {lastStep.action}
        </span>
      </div>
    </div>
  )
}

function actionColor(action: string): string {
  switch (action) {
    case 'COMPLETED':  return '#22c55e'
    case 'REQUEUED':   return '#3b82f6'
    case 'PREEMPTED':  return '#f59e0b'
    case 'CONTINUING': return '#94a3b8'
    default: return '#64748b'
  }
}
