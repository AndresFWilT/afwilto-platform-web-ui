import { Text, Button } from '@afwilto/design-system'
import type { GraphEdge } from '@/application/ports/IGraphAlgoService'

interface EdgeWeightInputProps {
  edges: GraphEdge[]
  vertexCount: number
  onChange: (edges: GraphEdge[]) => void
}

export function EdgeWeightInput({ edges, vertexCount, onChange }: EdgeWeightInputProps) {
  function addEdge() {
    onChange([...edges, { from: 0, to: 0, weight: 1 }])
  }

  function removeEdge(i: number) {
    onChange(edges.filter((_, idx) => idx !== i))
  }

  function updateEdge(i: number, field: keyof GraphEdge, raw: string) {
    const val = parseInt(raw, 10)
    if (isNaN(val)) return
    const updated = edges.map((e, idx) => {
      if (idx !== i) return e
      const base = field === 'from' || field === 'to'
        ? Math.max(0, Math.min(val - 1, vertexCount - 1)) // 1-indexed → 0-indexed, clamped
        : Math.max(1, val) // weight: min 1
      return { ...e, [field]: base }
    })
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-3">
      {edges.length === 0 ? (
        <Text variant="small" color="muted">No edges added yet. Click "Add Edge" to start.</Text>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-2 pl-3 text-left">
                  <Text variant="caption" color="muted" className="uppercase tracking-widest">From</Text>
                </th>
                <th className="py-2 pl-3 text-left">
                  <Text variant="caption" color="muted" className="uppercase tracking-widest">To</Text>
                </th>
                <th className="py-2 pl-3 text-left">
                  <Text variant="caption" color="muted" className="uppercase tracking-widest">Weight</Text>
                </th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody>
              {edges.map((e, i) => (
                <tr key={i} className="border-b border-surface-border last:border-0">
                  <td className="py-1.5 pl-3">
                    <input
                      type="number"
                      min={1}
                      max={vertexCount}
                      value={e.from + 1}
                      onChange={ev => updateEdge(i, 'from', ev.target.value)}
                      className="h-8 w-16 rounded border border-surface-border bg-brand-800 px-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-3">
                    <input
                      type="number"
                      min={1}
                      max={vertexCount}
                      value={e.to + 1}
                      onChange={ev => updateEdge(i, 'to', ev.target.value)}
                      className="h-8 w-16 rounded border border-surface-border bg-brand-800 px-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-3">
                    <input
                      type="number"
                      min={1}
                      value={e.weight}
                      onChange={ev => updateEdge(i, 'weight', ev.target.value)}
                      className="h-8 w-20 rounded border border-surface-border bg-brand-800 px-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-3">
                    <button
                      onClick={() => removeEdge(i)}
                      className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <Button variant="secondary" size="sm" onClick={addEdge}>
          + Add Edge
        </Button>
      </div>
      <Text variant="caption" color="muted">
        Vertex numbers are 1-indexed. Weights must be positive integers.
      </Text>
    </div>
  )
}
