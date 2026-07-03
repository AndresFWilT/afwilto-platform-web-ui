import { Text } from '@afwilto/design-system'

interface AdjacencyListInputProps {
  n: number
  adjacencyList: Record<number, number[]>
  onChange: (vertex: number, neighbors: number[]) => void
}

function parseNeighbors(raw: string, n: number): number[] {
  return raw
    .split(',')
    .map(s => parseInt(s.trim(), 10) - 1) // convert 1-indexed display to 0-indexed
    .filter(v => !isNaN(v) && v >= 0 && v < n)
}

function displayNeighbors(neighbors: number[]): string {
  return neighbors.map(v => v + 1).join(', ') // 0-indexed → 1-indexed display
}

export function AdjacencyListInput({ n, adjacencyList, onChange }: AdjacencyListInputProps) {
  if (n === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Text variant="small" color="muted" className="w-16 shrink-0 text-right font-mono">
            {i + 1} →
          </Text>
          {/*
            Uncontrolled input: the user can type freely (including commas mid-word).
            key={n + '-' + i} forces a remount — resetting defaultValue — whenever
            the vertex count changes. onChange fires on every keystroke so the parent
            state stays in sync with the parsed result.
          */}
          <input
            key={`${n}-${i}`}
            type="text"
            defaultValue={displayNeighbors(adjacencyList[i] ?? [])}
            onChange={e => onChange(i, parseNeighbors(e.target.value, n))}
            placeholder="e.g. 2, 3"
            className="flex-1 h-8 rounded border border-surface-border bg-brand-800 px-3 text-sm font-mono text-neutral-100 placeholder-neutral-600 focus:border-primary-400 focus:outline-none"
          />
        </div>
      ))}
      <Text variant="caption" color="muted" className="mt-1">
        Enter neighbor vertex numbers (1-indexed) separated by commas.
        Leave empty for no outgoing edges.
      </Text>
    </div>
  )
}
