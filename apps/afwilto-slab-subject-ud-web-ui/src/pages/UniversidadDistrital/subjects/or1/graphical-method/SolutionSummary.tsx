import { Card, Text, Alert, Badge } from '@afwilto/design-system'
import type { GraphicalSolution } from './types'

interface Props {
  solution: GraphicalSolution
}

export function SolutionSummary({ solution }: Props) {
  if (solution.status === 'INFEASIBLE') {
    return <Alert variant="error" title="Infeasible">No feasible region exists — the constraints are contradictory.</Alert>
  }
  if (solution.status === 'UNBOUNDED') {
    return <Alert variant="warning" title="Unbounded">The feasible region is unbounded in the optimization direction.</Alert>
  }

  const { optimalValue, optimalPoint, feasibleVertices, classification } = solution

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Text variant="h4" color="default">Optimal Solution</Text>
        {classification && (
          <Badge variant={classification === 'BOUNDED' ? 'success' : 'warning'} size="sm">
            {classification}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">Optimal Value (Z*)</Text>
          <Text variant="h3" weight="bold" style={{ color: 'var(--color-success-400)' }}>
            {optimalValue?.toFixed(4)}
          </Text>
        </div>
        {optimalPoint && (
          <div className="flex flex-col gap-1">
            <Text variant="caption" color="muted">Optimal Point</Text>
            <Text variant="h3" weight="bold" style={{ color: 'var(--color-primary-400)' }}>
              ({optimalPoint.x.toFixed(4)}, {optimalPoint.y.toFixed(4)})
            </Text>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">Feasible Vertices</Text>
          <Text variant="h3" weight="bold" color="default">{feasibleVertices.length}</Text>
        </div>
      </div>

      {feasibleVertices.length > 0 && (
        <div className="flex flex-col gap-2">
          <Text variant="small" color="muted" weight="medium">All feasible vertices</Text>
          <div className="flex flex-wrap gap-2">
            {feasibleVertices.map((v, i) => (
              <span key={i}
                className="font-mono text-xs px-2 py-1 rounded border border-surface-border text-neutral-300"
              >
                ({v.x.toFixed(2)}, {v.y.toFixed(2)})
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
