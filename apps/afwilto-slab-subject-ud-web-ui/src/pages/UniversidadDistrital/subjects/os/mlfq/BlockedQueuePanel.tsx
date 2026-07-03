import { Text, Button } from '@afwilto/design-system'
import type { MLFQProcessDto } from './types'

interface Props {
  blockedQueue: MLFQProcessDto[]
  onUnblock: (pid: number) => void
  loading: boolean
}

export function BlockedQueuePanel({ blockedQueue, onUnblock, loading }: Props) {
  if (blockedQueue.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" weight="semibold" color="default">
        Blocked Processes
      </Text>
      <div className="flex flex-col gap-1.5">
        {blockedQueue.map(p => (
          <div key={p.pid} className="flex items-center justify-between px-3 py-2 rounded"
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold text-red-400">P{p.pid} {p.name}</span>
              <span className="font-mono text-xs text-neutral-500">
                remaining: {p.remainingTime} · blocked from: {p.blockedFrom ?? '?'}
              </span>
            </div>
            <Button variant="secondary" size="sm" loading={loading} onClick={() => onUnblock(p.pid)}>
              Unblock
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
