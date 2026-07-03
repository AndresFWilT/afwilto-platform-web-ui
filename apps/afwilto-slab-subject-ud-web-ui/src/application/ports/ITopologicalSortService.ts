// Inbound port — domain language only. No HTTP, no infrastructure.

export interface InDegreeInfo {
  vertex: number
  initialInDegree: number
}

export interface TopologicalSortResult {
  topologicalOrder: number[]
  inDegrees: InDegreeInfo[]
  hasCycle: boolean
}

export interface ITopologicalSortService {
  compute(vertexCount: number, adjacencyList: Record<number, number[]>): Promise<TopologicalSortResult>
}
