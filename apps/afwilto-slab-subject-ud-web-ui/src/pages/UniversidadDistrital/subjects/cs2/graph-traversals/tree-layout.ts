import type { SpanningTreeNode } from '@/application/ports/IGraphTraversalService'

export interface LayoutNode {
  vertex: number
  x: number
  y: number
  children: LayoutNode[]
}

const NODE_H_SPACING = 52  // horizontal space per leaf node
const LEVEL_HEIGHT   = 64  // vertical space per level

export function computeTreeLayout(root: SpanningTreeNode): {
  tree: LayoutNode
  totalWidth: number
  totalHeight: number
} {
  let leafCount = 0

  function layout(node: SpanningTreeNode, depth: number): LayoutNode {
    if (node.children.length === 0) {
      const x = leafCount * NODE_H_SPACING + NODE_H_SPACING / 2
      leafCount++
      return { vertex: node.vertex, x, y: depth * LEVEL_HEIGHT, children: [] }
    }
    const childLayouts = node.children.map(c => layout(c, depth + 1))
    const firstChild = childLayouts[0]
    const lastChild  = childLayouts[childLayouts.length - 1]
    const x = (firstChild.x + lastChild.x) / 2
    return { vertex: node.vertex, x, y: depth * LEVEL_HEIGHT, children: childLayouts }
  }

  const tree = layout(root, 0)
  const totalWidth  = Math.max(leafCount * NODE_H_SPACING, NODE_H_SPACING)
  const totalHeight = treeDepth(root) * LEVEL_HEIGHT + 40

  return { tree, totalWidth, totalHeight }
}

function treeDepth(node: SpanningTreeNode): number {
  if (node.children.length === 0) return 1
  return 1 + Math.max(...node.children.map(treeDepth))
}
