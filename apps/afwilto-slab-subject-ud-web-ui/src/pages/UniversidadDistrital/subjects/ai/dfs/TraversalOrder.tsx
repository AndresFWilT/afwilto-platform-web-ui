import { Text } from '@afwilto/design-system'

interface Props {
  traversalOrder: string[]
  pathToGoal: string[] | null
}

export function TraversalOrder({ traversalOrder, pathToGoal }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="semibold" color="default">
        Traversal Order — {traversalOrder.length} visited
      </Text>

      {traversalOrder.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {traversalOrder.map((id, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded bg-success-500/20 text-success-300 font-mono text-xs">
                {id}
              </span>
              {i < traversalOrder.length - 1 && (
                <span className="text-neutral-600 text-xs">→</span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <Text variant="caption" color="muted">No vertices visited yet</Text>
      )}

      {pathToGoal && pathToGoal.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-border">
          <Text variant="small" weight="semibold" color="default">Path to Goal</Text>
          <div className="flex flex-wrap items-center gap-1">
            {pathToGoal.map((id, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-300 font-mono text-sm font-bold">
                  {id}
                </span>
                {i < pathToGoal.length - 1 && (
                  <span className="text-neutral-500">→</span>
                )}
              </span>
            ))}
          </div>
          <Text variant="caption" color="muted">Length: {pathToGoal.length} vertices</Text>
        </div>
      )}
    </div>
  )
}
