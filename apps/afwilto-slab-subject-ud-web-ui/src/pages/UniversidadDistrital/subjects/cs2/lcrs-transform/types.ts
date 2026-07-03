export interface LayoutNaryNode {
  label: string
  x: number
  y: number
  children: LayoutNaryEdge[]
}

export interface LayoutNaryEdge {
  node: LayoutNaryNode
  weight: number
}

export interface LayoutNaryResult {
  root: LayoutNaryNode | null
  width: number
  height: number
}

export interface LayoutBinaryNode {
  label: string
  weight: number
  x: number
  y: number
  left: LayoutBinaryNode | null
  right: LayoutBinaryNode | null
}

export interface LayoutBinaryResult {
  root: LayoutBinaryNode | null
  width: number
  height: number
}
