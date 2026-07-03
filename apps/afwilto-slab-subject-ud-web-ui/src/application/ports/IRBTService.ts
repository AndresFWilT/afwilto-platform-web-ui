// Inbound port — defines what the domain exposes to the frontend application.
// No infrastructure knowledge belongs here.

export interface NodeSnapshot {
  key: number
  color: 'red' | 'black'
  left?: NodeSnapshot
  right?: NodeSnapshot
}

export interface SnapshotResponse {
  root: NodeSnapshot | null
  size: number
}

export interface SearchResponse {
  key: number
  found: boolean
}

export interface TraversalResponse {
  order: string
  keys: number[]
}

export interface ExtremesResponse {
  min: number
  max: number
}

export type TraversalOrder = 'inorder' | 'preorder' | 'postorder'

export interface IRBTService {
  insert(key: number): Promise<void>
  delete(key: number): Promise<void>
  search(key: number): Promise<SearchResponse>
  traversal(order: TraversalOrder): Promise<TraversalResponse>
  getTree(): Promise<SnapshotResponse>
  getExtremes(): Promise<ExtremesResponse>
}
