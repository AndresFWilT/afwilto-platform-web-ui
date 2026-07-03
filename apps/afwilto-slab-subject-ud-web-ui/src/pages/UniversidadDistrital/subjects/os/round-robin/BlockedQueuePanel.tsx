import { Text, Button } from '@afwilto/design-system'
import type { ProcessDto } from './types'
import { processColor } from './types'

interface Props {
  blockedQueue: ProcessDto[]
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
        {blockedQueue.map(p => {
          const color = processColor(p.pid)
          return (
            <div
              key={p.pid}
              className="flex items-center justify-between px-3 py-2 rounded"
              style={{
                backgroundColor: `${color}11`,
                border: `1px dashed ${color}66`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔒</span>
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-bold" style={{ color }}>
                    P{p.pid}
                  </span>
                  <span className="font-mono text-xs text-neutral-500">
                    remaining: {p.remainingTime}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={loading}
                onClick={() => onUnblock(p.pid)}
              >
                Unblock
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
