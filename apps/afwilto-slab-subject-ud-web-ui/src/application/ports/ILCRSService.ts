export interface NaryChild {
  label: string
  weight: number
}

export interface NaryNodeDef {
  label: string
  children: NaryChild[]
}

export interface NaryTree {
  root: string
  nodes: NaryNodeDef[]
}

export interface BinaryNode {
  label: string
  weight: number
  left: BinaryNode | null
  right: BinaryNode | null
}

export interface BinaryTree {
  root: BinaryNode | null
}

export interface TransformResult {
  naryTree: NaryTree
  binaryTree: BinaryTree
}

export interface ShortestPathInfo {
  leaf: string
  totalWeight: number
  path: string[]
  pathWeights: number[]
}

export interface ShortestPathResult extends TransformResult {
  shortestPath: ShortestPathInfo
}

export type BinaryTraversalOrder = 'PREORDER' | 'INORDER' | 'POSTORDER' | 'BFS'

export interface TraversalStep {
  label: string
  weight: number
}

export interface BinaryTraversalResult {
  order: BinaryTraversalOrder
  sequence: TraversalStep[]
}

export interface ILCRSService {
  transform(naryTree: NaryTree): Promise<TransformResult>
  shortestPath(naryTree: NaryTree): Promise<ShortestPathResult>
  traverse(binaryTree: BinaryTree, order: BinaryTraversalOrder): Promise<BinaryTraversalResult>
}
