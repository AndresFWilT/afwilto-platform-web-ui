import type { HuffmanNode } from '@/application/ports/IEncodingService'

export interface LayoutNode {
  x: number
  y: number
  node: HuffmanNode
  left?: LayoutNode
  right?: LayoutNode
  edgeLabelFromParent?: '0' | '1'
}

export interface TreeLayout {
  root: LayoutNode
  width: number
  height: number
  nodeR: number
}

const NODE_R    = 20
const LEAF_GAP  = 64
const LEVEL_H   = 80
const PADDING   = 32

export function computeLayout(root: HuffmanNode): TreeLayout {
  let leafIndex = 0

  function assign(node: HuffmanNode, depth: number, label?: '0' | '1'): LayoutNode {
    if (!node.left && !node.right) {
      const x = leafIndex++ * LEAF_GAP
      return { x, y: depth * LEVEL_H, node, edgeLabelFromParent: label }
    }
    const leftLayout  = node.left  ? assign(node.left,  depth + 1, '0') : undefined
    const rightLayout = node.right ? assign(node.right, depth + 1, '1') : undefined
    const x =
      leftLayout && rightLayout
        ? (leftLayout.x + rightLayout.x) / 2
        : (leftLayout?.x ?? rightLayout?.x ?? 0)
    return { x, y: depth * LEVEL_H, node, left: leftLayout, right: rightLayout, edgeLabelFromParent: label }
  }

  const layout = assign(root, 0)

  // Normalize: shift all nodes so min-x = PADDING
  let minX = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  function walk(n: LayoutNode): void {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    maxY = Math.max(maxY, n.y)
    if (n.left)  walk(n.left)
    if (n.right) walk(n.right)
  }
  walk(layout)

  function shift(n: LayoutNode): void {
    n.x = n.x - minX + PADDING
    n.y = n.y + PADDING
    if (n.left)  shift(n.left)
    if (n.right) shift(n.right)
  }
  shift(layout)

  return {
    root:   layout,
    width:  maxX - minX + PADDING * 2,
    height: maxY + PADDING * 2 + NODE_R * 2,
    nodeR:  NODE_R,
  }
}
