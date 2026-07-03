import { Card, Text } from '@afwilto/design-system'
import type { TruthTableResult } from '@/application/ports/ITruthTableService'
import { ClassificationBadge } from './ClassificationBadge'

const API_TO_UNICODE: Record<string, string> = {
  '^': '∧', 'v': '∨', '-': '¬', '=>': '→', '<=>': '↔',
}

function renderFormulaUnicode(formula: string): string {
  return formula
    .replace(/<=>/g, '↔')
    .replace(/=>/g, '→')
    .replace(/\^/g, '∧')
    .replace(/v/g, '∨')
    .replace(/-/g, '¬')
}

interface TruthTableViewProps {
  result: TruthTableResult
}

export function TruthTableView({ result }: TruthTableViewProps) {
  const { variables, rows, classification } = result

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Text variant="h4" color="default">Truth Table</Text>
          <span className="font-mono text-sm text-primary-400">
            {renderFormulaUnicode(result.formula)}
          </span>
        </div>
        <ClassificationBadge classification={classification} />
      </div>

      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full border-collapse text-sm" style={{ minWidth: `${variables.length * 60 + 80}px` }}>
          <thead>
            <tr className="border-b border-surface-border">
              {variables.map(v => (
                <th key={v} className="py-2 px-3 text-center text-xs font-semibold text-neutral-400 uppercase font-mono w-16">
                  {v}
                </th>
              ))}
              <th className="py-2 px-3 text-center text-xs font-semibold uppercase tracking-wider"
                style={{ color: classification === 'tautology' ? 'var(--color-success-400)' :
                                 classification === 'contradiction' ? 'var(--color-error-400)' : 'var(--color-neutral-400)' }}>
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-surface-border/30"
                style={row.result ? { backgroundColor: 'rgba(52,211,153,0.05)' } : { backgroundColor: 'rgba(248,113,113,0.05)' }}>
                {variables.map(v => (
                  <td key={v} className="py-1.5 px-3 text-center font-mono font-semibold text-sm"
                    style={{ color: row.assignments[v] ? 'var(--color-neutral-200)' : 'var(--color-neutral-500)' }}>
                    {row.assignments[v] ? 'T' : 'F'}
                  </td>
                ))}
                <td className="py-1.5 px-3 text-center font-mono font-bold text-sm"
                  style={{ color: row.result ? 'var(--color-success-400)' : 'var(--color-error-400)' }}>
                  {row.result ? 'T' : 'F'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Text variant="caption" color="muted">
        {rows.length} rows ({variables.length} variable{variables.length !== 1 ? 's' : ''}, 2^{variables.length} = {rows.length} combinations).
      </Text>
    </Card>
  )
}

export { API_TO_UNICODE }
