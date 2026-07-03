import { Text } from '@afwilto/design-system'

interface Props {
  stack: string[]
  currentVertex: string | null
}

export function StackPanel({ stack, currentVertex }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="semibold" color="default">
        Stack — {stack.length} {stack.length === 1 ? 'item' : 'items'}
      </Text>

      {currentVertex && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-mono w-16 shrink-0">Popped:</span>
          <span className="px-2 py-0.5 rounded bg-warning-400/20 text-warning-300 font-mono text-xs font-bold">
            {currentVertex}
          </span>
        </div>
      )}

      {stack.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">Top → Bottom</Text>
          <div className="flex flex-wrap gap-1">
            {[...stack].reverse().map((id, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded font-mono text-xs ${
                  i === 0 ? 'bg-primary-500/30 text-primary-200 font-bold' : 'bg-surface-overlay text-neutral-300'
                }`}
              >
                {id}
              </span>
            ))}
          </div>
          <Text variant="caption" color="muted" className="mt-1">
            Next to pop: <span className="text-primary-300 font-mono font-bold">{stack[stack.length - 1]}</span>
          </Text>
        </div>
      ) : (
        <Text variant="caption" color="muted">Stack is empty</Text>
      )}
    </div>
  )
}
