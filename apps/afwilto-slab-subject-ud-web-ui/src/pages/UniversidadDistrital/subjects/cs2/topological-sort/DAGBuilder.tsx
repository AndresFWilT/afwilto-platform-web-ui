import { Text, Button } from '@afwilto/design-system'

interface DAGBuilderProps {
  n: number
  adjacencyList: Record<number, number[]>
  onVertexCountChange: (n: number) => void
  onNeighborChange: (vertex: number, neighbors: number[]) => void
  onCompute: () => void
  onReset: () => void
  loading: boolean
}

function parseNeighbors(raw: string, n: number): number[] {
  return raw
    .split(',')
    .map(s => parseInt(s.trim(), 10) - 1) // 1-indexed → 0-indexed
    .filter(v => !isNaN(v) && v >= 0 && v < n)
}

function displayNeighbors(neighbors: number[]): string {
  return neighbors.map(v => v + 1).join(', ')
}

export function DAGBuilder({
  n, adjacencyList, onVertexCountChange, onNeighborChange, onCompute, onReset, loading
}: DAGBuilderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Vertex count + buttons */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Vertices (1–30)</Text>
          <input
            type="number" min={1} max={30}
            value={n === 0 ? '' : n}
            placeholder="e.g. 6"
            onChange={e => onVertexCountChange(parseInt(e.target.value, 10) || 0)}
            className="h-9 w-24 rounded border border-surface-border bg-brand-800 px-3 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={onReset} disabled={loading}>Reset</Button>
          <Button
            variant="primary" size="sm" onClick={onCompute}
            disabled={loading || n === 0} loading={loading}
          >
            Compute Sort
          </Button>
        </div>
      </div>

      {/* Per-vertex adjacency inputs */}
      {n > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Text variant="small" color="muted" className="w-16 shrink-0 text-right font-mono">
                {i + 1} →
              </Text>
              {/*
                Uncontrolled input: key forces a remount (resetting defaultValue)
                when vertex count changes. onChange keeps parent state in sync.
              */}
              <input
                key={`${n}-${i}`}
                type="text"
                defaultValue={displayNeighbors(adjacencyList[i] ?? [])}
                onChange={e => onNeighborChange(i, parseNeighbors(e.target.value, n))}
                placeholder="e.g. 3, 5"
                className="flex-1 h-8 rounded border border-surface-border bg-brand-800 px-3 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:border-primary-400 focus:outline-none"
              />
            </div>
          ))}
          <Text variant="caption" color="muted" className="mt-1">
            Enter neighbor vertex numbers (1-indexed) for each vertex's outgoing edges.
          </Text>
        </div>
      )}
    </div>
  )
}
