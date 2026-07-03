interface MeasurementMatrixProps {
  n: number
  m: number
  values: number[][]
  onChange: (values: number[][]) => void
  disabled?: boolean
}

export function MeasurementMatrix({ n, m, values, onChange, disabled }: MeasurementMatrixProps) {
  const handleChange = (row: number, col: number, raw: string) => {
    const next = values.map(r => [...r])
    next[row][col] = parseFloat(raw) || 0
    onChange(next)
  }

  return (
    <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
      <div style={{ minWidth: `${m * 80 + 60}px` }}>
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-neutral-500 w-10">#</th>
              {Array.from({ length: m }, (_, j) => (
                <th key={j} className="px-2 py-1.5 text-center text-xs font-semibold text-neutral-400">
                  m{j + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i} className="border-t border-surface-border/40">
                <td className="px-2 py-1 text-xs font-mono text-neutral-500">x{i + 1}</td>
                {Array.from({ length: m }, (_, j) => (
                  <td key={j} className="px-1 py-1">
                    <input
                      type="number"
                      step="any"
                      disabled={disabled}
                      value={values[i]?.[j] ?? 0}
                      onChange={e => handleChange(i, j, e.target.value)}
                      className="w-full text-center font-mono text-sm rounded px-2 py-1 outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--color-surface-overlay)',
                        border: '1px solid var(--color-surface-border)',
                        color: 'var(--color-neutral-100)',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function emptyMatrix(n: number, m: number): number[][] {
  return Array.from({ length: n }, () => Array(m).fill(0))
}
