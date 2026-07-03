export interface UnweightedVertexNode {
  id: string
  x: number
  y: number
}

export interface UnweightedEdge {
  from: string
  to: string
}

export type DFSVertexState = 'unvisited' | 'in-stack' | 'visited' | 'current' | 'goal' | 'path'
