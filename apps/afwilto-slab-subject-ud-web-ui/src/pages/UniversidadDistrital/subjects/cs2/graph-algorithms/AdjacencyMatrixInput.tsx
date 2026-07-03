import { Text } from '@afwilto/design-system'

interface AdjacencyMatrixInputProps {
  n: number
  matrix: number[][]
  onChange: (i: number, j: number, weight: number) => void
}

export function AdjacencyMatrixInput({ n, matrix, onChange }: AdjacencyMatrixInputProps) {
  if (n === 0) return null

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="border-collapse text-sm font-mono">
        <thead>
          <tr>
            <th className="w-8" />
            {Array.from({ length: n }, (_, j) => (
              <th key={j} className="w-14 pb-1 text-center font-normal">
                <Text variant="caption" color="muted">{j + 1}</Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => (
            <tr key={i}>
              <td className="pr-2 text-right">
                <Text variant="caption" color="muted">{i + 1}</Text>
              </td>
              {Array.from({ length: n }, (_, j) => {
                const isDiag  = i === j
                const isUpper = j > i

                if (isDiag) {
                  return (
                    <td key={j} className="p-0.5">
                      <div className="flex h-8 w-12 items-center justify-center rounded border border-surface-border bg-surface-overlay">
                        <Text variant="caption" color="muted">0</Text>
                      </div>
                    </td>
                  )
                }

                if (!isUpper) {
                  const val = matrix[j]?.[i] ?? 0
                  return (
                    <td key={j} className="p-0.5">
                      <div className="flex h-8 w-12 items-center justify-center rounded border border-surface-border bg-surface-overlay">
                        <Text variant="caption" color="muted">{val > 0 ? val : '—'}</Text>
                      </div>
                    </td>
                  )
                }

                const val = matrix[i]?.[j] ?? 0
                return (
                  <td key={j} className="p-0.5">
                    <input
                      type="number"
                      min={1}
                      value={val > 0 ? val : ''}
                      placeholder="—"
                      onChange={e => {
                        const w = parseInt(e.target.value, 10)
                        onChange(i, j, isNaN(w) || w <= 0 ? 0 : w)
                      }}
                      className="h-8 w-12 rounded border border-surface-border bg-brand-800 text-center text-xs text-neutral-100 focus:border-primary-400 focus:outline-none"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Text variant="caption" color="muted" className="mt-2 block">
        Fill the upper triangle — leave empty or 0 for no edge. Lower triangle mirrors automatically.
      </Text>
    </div>
  )
}
