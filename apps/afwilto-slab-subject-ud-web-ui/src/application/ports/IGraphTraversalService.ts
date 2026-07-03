// Inbound port — domain language only. No HTTP, no infrastructure.

export interface SpanningTreeNode {
  vertex: number
  children: SpanningTreeNode[]
}

export interface TraversalEdge {
  from: number
  to: number
}

export interface TraversalResult {
  algorithm: 'BFS' | 'DFS'
  source: number
  traversalOrder: number[]
  spanningTree: SpanningTreeNode
  spanningTreeEdges: TraversalEdge[]
}

export interface IGraphTraversalService {
  bfs(vertexCount: number, adjacencyList: Record<number, number[]>, source: number): Promise<TraversalResult>
  dfs(vertexCount: number, adjacencyList: Record<number, number[]>, source: number): Promise<TraversalResult>
}
