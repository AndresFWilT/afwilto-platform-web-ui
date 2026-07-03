import { Text } from '@afwilto/design-system'

interface AdjacencyEditorProps {
  n: number
  matrix: number[][]
  onChange: (i: number, j: number, value: number) => void
}

export function AdjacencyEditor({ n, matrix, onChange }: AdjacencyEditorProps) {
  if (n === 0) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Text variant="small" color="muted">Add vertices to see the matrix</Text>
      </div>
    )
  }

  return (
    <div className="overflow-auto w-full">
      <table className="border-collapse text-center text-xs font-mono mx-auto">
        <thead>
          <tr>
            <th className="w-7 h-7" />
            {Array.from({ length: n }, (_, j) => (
              <th key={j} className="w-7 h-7 text-neutral-400 font-bold">{j + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => (
            <tr key={i}>
              <td className="w-7 h-7 text-neutral-400 font-bold">{i + 1}</td>
              {Array.from({ length: n }, (_, j) => {
                if (i === j) {
                  return (
                    <td key={j} className="w-7 h-7">
                      <div className="w-6 h-6 mx-auto rounded" style={{ backgroundColor: 'rgba(24,29,53,0.5)' }} />
                    </td>
                  )
                }
                if (j < i) {
                  return (
                    <td key={j} className="w-7 h-7">
                      <div
                        className="w-6 h-6 mx-auto rounded flex items-center justify-center text-neutral-600 text-xs"
                        style={{ backgroundColor: 'rgba(24,29,53,0.2)' }}
                      >
                        {matrix[i]?.[j] ?? 0}
                      </div>
                    </td>
                  )
                }
                const val = matrix[i]?.[j] ?? 0
                return (
                  <td key={j} className="w-7 h-7 p-0.5">
                    <button
                      onClick={() => onChange(i, j, val === 1 ? 0 : 1)}
                      className="w-6 h-6 mx-auto rounded border text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: val === 1 ? '#3A4DAE' : 'rgba(240,242,251,0.9)',
                        borderColor: val === 1 ? '#2A3A8C' : 'rgba(24,29,53,0.25)',
                        color: val === 1 ? 'white' : '#181D35',
                      }}
                      aria-label={`Edge ${i + 1}–${j + 1}: ${val === 1 ? 'remove' : 'add'}`}
                    >
                      {val}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
