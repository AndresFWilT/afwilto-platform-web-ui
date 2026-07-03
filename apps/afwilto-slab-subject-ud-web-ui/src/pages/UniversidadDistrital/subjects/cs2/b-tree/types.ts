import type { BTreeNode } from '@/application/ports/IBTreeService'

// A node positioned in SVG coordinate space by the layout calculator.
export interface LayoutNode {
  keys: string[]
  x: number       // center x in SVG units
  y: number       // top y in SVG units
  width: number   // rendered box width
  node: BTreeNode // original node reference (for key-membership checks)
  children: LayoutNode[]
}

export interface LayoutResult {
  root: LayoutNode | null
  width: number   // total SVG width needed
  height: number  // total SVG height needed
}
