// Inbound port for the B-Tree feature. Domain language only — no HTTP/infrastructure.

export interface BTreeNode {
  keys: string[]
  children: BTreeNode[]
}

export interface BTree {
  order: number
  root: BTreeNode
}

export interface BTreePathStep {
  nodeKeys: string[]
  childIndex: number
}

export type BTreeOperationType = 'INSERT' | 'DELETE' | 'FIND'

export interface BTreeOperationResult {
  tree: BTree
  operation: {
    type: BTreeOperationType
    key: string
    affectedPath: BTreePathStep[]
  }
}

export interface IBTreeService {
  insert(tree: BTree, key: string): Promise<BTreeOperationResult>
  delete(tree: BTree, key: string): Promise<BTreeOperationResult>
  find(tree: BTree, key: string): Promise<BTreeOperationResult>
}
