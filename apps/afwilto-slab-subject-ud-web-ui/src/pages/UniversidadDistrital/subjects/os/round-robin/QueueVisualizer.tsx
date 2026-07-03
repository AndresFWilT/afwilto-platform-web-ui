import { Text } from '@afwilto/design-system'
import type { ProcessDto } from './types'
import { processColor } from './types'

interface Props {
  queue: ProcessDto[]
  blockedQueue: ProcessDto[]
  currentTime: number
  onBlock?: (pid: number) => void
}

export function QueueVisualizer({ queue, blockedQueue, currentTime, onBlock }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Ready queue */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Text variant="small" weight="semibold" color="default">Ready Queue</Text>
          <Text variant="caption" color="muted" className="font-mono">t = {currentTime}</Text>
        </div>
        <div className="flex items-center gap-1 min-h-[56px] overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
          {queue.length === 0 ? (
            <Text variant="caption" color="muted" className="italic">Queue is empty</Text>
          ) : (
            <>
              <span className="text-neutral-500 text-xs mr-1 shrink-0">front →</span>
              {queue.map((p, i) => (
                <ProcessBlock
                  key={`${p.pid}-${i}`}
                  process={p}
                  onBlock={onBlock}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Blocked queue (shown only when non-empty) */}
      {blockedQueue.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Text variant="small" weight="semibold" color="default" className="text-red-400">
            Blocked
          </Text>
          <div className="flex items-center gap-1 min-h-[52px] overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            {blockedQueue.map((p, i) => (
              <div
                key={`blocked-${p.pid}-${i}`}
                className="flex flex-col items-center justify-center rounded-md shrink-0 opacity-50"
                style={{
                  width: 52,
                  height: 48,
                  backgroundColor: `${processColor(p.pid)}22`,
                  border: `2px dashed ${processColor(p.pid)}`,
                }}
              >
                <span className="text-xs">🔒</span>
                <span className="font-mono font-bold text-xs" style={{ color: processColor(p.pid) }}>
                  P{p.pid}
                </span>
                <span className="font-mono text-xs text-neutral-400">{p.remainingTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProcessBlock({ process, onBlock }: { process: ProcessDto; onBlock?: (pid: number) => void }) {
  const color = processColor(process.pid)
  return (
    <div className="relative shrink-0 group">
      <div
        className="flex flex-col items-center justify-center rounded-md transition-all duration-300"
        style={{ width: 52, height: 48, backgroundColor: `${color}22`, border: `2px solid ${color}` }}
      >
        <span className="font-mono font-bold text-sm" style={{ color }}>P{process.pid}</span>
        <span className="font-mono text-xs text-neutral-400">{process.remainingTime}</span>
      </div>
      {onBlock && (
        <button
          onClick={() => onBlock(process.pid)}
          title={`Block P${process.pid}`}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface-overlay border border-surface-border text-red-400 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/30"
        >
          ⊗
        </button>
      )}
    </div>
  )
}
