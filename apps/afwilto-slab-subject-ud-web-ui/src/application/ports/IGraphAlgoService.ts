// Inbound port — domain language only. No HTTP, no infrastructure.

export interface GraphEdge {
  from: number
  to: number
  weight: number
}

export interface ShortestPathResult {
  source: number
  distances: Record<string, number>
  parents: Record<string, number>
  shortestPathTree: GraphEdge[]
}

export interface MSTResult {
  edges: GraphEdge[]
  totalWeight: number
}

export interface IGraphAlgoService {
  computeShortestPath(vertexCount: number, edges: GraphEdge[], source: number): Promise<ShortestPathResult>
  computeMST(vertexCount: number, edges: GraphEdge[]): Promise<MSTResult>
  computeKruskalMST(vertexCount: number, edges: GraphEdge[]): Promise<MSTResult>
}
