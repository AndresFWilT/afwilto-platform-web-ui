export interface VertexNode {
  id: string
  heuristic: number
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
  cost: number
}

export type VertexState =
  | 'unvisited'
  | 'in-frontier'
  | 'expanded'
  | 'current'
  | 'goal'
  | 'solution-path'
