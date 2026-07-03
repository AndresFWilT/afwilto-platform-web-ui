import { Text } from '@afwilto/design-system'
import type { MLFQProcessDto, MLFQQueueLevel } from './types'
import { QUEUE_COLORS, QUEUE_LABELS } from './types'

interface Props {
  rrQueue: MLFQProcessDto[]
  sjfQueue: MLFQProcessDto[]
  fcfsQueue: MLFQProcessDto[]
  currentTime: number
}

export function ThreeQueueVisualizer({ rrQueue, sjfQueue, fcfsQueue, currentTime }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Text variant="small" weight="semibold" color="default">Queue State</Text>
        <Text variant="caption" color="muted" className="font-mono">t = {currentTime}</Text>
      </div>
      <QueueStrip level="RoundRobin"           processes={rrQueue} />
      <QueueStrip level="ShortestJobFirst"     processes={sjfQueue} />
      <QueueStrip level="FirstComeFirstServed" processes={fcfsQueue} />
    </div>
  )
}

function QueueStrip({ level, processes }: { level: MLFQQueueLevel; processes: MLFQProcessDto[] }) {
  const color = QUEUE_COLORS[level]
  return (
    <div className="flex flex-col gap-1">
      <Text variant="caption" color="muted" className="font-mono" style={{ color }}>
        {QUEUE_LABELS[level]}
      </Text>
      <div className="flex items-center gap-1 min-h-[44px] overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        {processes.length === 0 ? (
          <span className="text-neutral-600 text-xs italic">empty</span>
        ) : (
          <>
            <span className="text-neutral-600 text-xs mr-0.5 shrink-0">→</span>
            {processes.map((p, i) => (
              <ProcessBlock key={`${p.pid}-${i}`} process={p} color={color} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function ProcessBlock({ process, color }: { process: MLFQProcessDto; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded shrink-0"
      style={{ width: 52, height: 40, backgroundColor: `${color}22`, border: `1.5px solid ${color}` }}
    >
      <span className="font-mono font-bold text-xs" style={{ color }}>P{process.pid}</span>
      <span className="font-mono text-xs text-neutral-400">{process.remainingTime}</span>
      {process.agingCounter > 0 && (
        <span className="font-mono text-xs" style={{ color: '#f59e0b', fontSize: '9px' }}>
          ⏳{process.agingCounter}
        </span>
      )}
    </div>
  )
}
