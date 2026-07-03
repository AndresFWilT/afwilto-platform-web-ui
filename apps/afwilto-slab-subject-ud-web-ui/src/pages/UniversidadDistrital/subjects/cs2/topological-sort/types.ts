import type { InDegreeInfo } from '@/application/ports/ITopologicalSortService'

// Compute layer assignment: each layer is a set of vertices at the same
// dependency depth. Layer 0 = sources (in-degree 0), layer k+1 = vertices
// that become sources after removing all vertices in layers 0..k.
export function computeLayerLayout(
  n: number,
  adjacencyList: Record<number, number[]>,
  inDegrees: InDegreeInfo[]
): number[][] {
  const inDeg = new Array<number>(n).fill(0)
  for (const { vertex, initialInDegree } of inDegrees) {
    inDeg[vertex] = initialInDegree
  }

  const inDegCopy = [...inDeg]
  const layers: number[][] = []
  let current = inDeg
    .map((d, v) => (d === 0 ? v : -1))
    .filter(v => v >= 0)
    .sort((a, b) => a - b)

  while (current.length > 0) {
    layers.push([...current])
    const next: number[] = []
    for (const u of current) {
      for (const v of adjacencyList[u] ?? []) {
        inDegCopy[v]--
        if (inDegCopy[v] === 0) next.push(v)
      }
    }
    current = next.sort((a, b) => a - b)
  }

  return layers
}
