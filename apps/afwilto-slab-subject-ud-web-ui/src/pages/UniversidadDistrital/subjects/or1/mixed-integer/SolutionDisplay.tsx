import { Card, Text, Alert } from '@afwilto/design-system'
import type { MIPResult } from './types'

interface Props {
  result: MIPResult
}

export function SolutionDisplay({ result }: Props) {
  if (result.status === 'INFEASIBLE') {
    return <Alert variant="error" title="Infeasible">No feasible solution exists — the constraints are contradictory or no integer point satisfies them.</Alert>
  }
  if (result.status === 'UNBOUNDED') {
    return <Alert variant="warning" title="Unbounded">The problem is unbounded — add upper-bound constraints.</Alert>
  }

  const assignments = result.assignments ?? {}

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">MIP Solution</Text>

      <div className="flex flex-col gap-1">
        <Text variant="caption" color="muted">Optimal Value (Z*)</Text>
        <Text variant="h2" weight="bold" style={{ color: 'var(--color-success-400)' }}>
          {result.optimalValue?.toFixed(6)}
        </Text>
      </div>

      <div className="flex flex-col gap-2">
        <Text variant="small" weight="medium" color="muted">Variable assignments</Text>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left py-2 px-3 text-neutral-400 font-medium">Variable</th>
                <th className="text-right py-2 px-3 text-neutral-400 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(assignments).map(([name, value]) => (
                <tr key={name} className="border-b border-surface-border/50 hover:bg-surface-overlay/30">
                  <td className="py-2 px-3 font-mono text-primary-400">{name}</td>
                  <td className="py-2 px-3 font-mono text-right text-neutral-200">
                    {Number.isInteger(value) ? value : value.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
