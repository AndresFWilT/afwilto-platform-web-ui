import type { NaryTree, NaryNodeDef } from '@/application/ports/ILCRSService'
import type { LayoutNaryNode, LayoutNaryResult } from './types'

const NODE_RADIUS = 16
const H_GAP = 24
const V_GAP = 60
const MARGIN = 28

function nodeMap(nodes: NaryNodeDef[]): Map<string, NaryNodeDef> {
  return new Map(nodes.map((n) => [n.label, n]))
}

function subtreeWidth(label: string, map: Map<string, NaryNodeDef>): number {
  const node = map.get(label)
  if (!node || node.children.length === 0) return NODE_RADIUS * 2
  const childrenWidth =
    node.children.reduce((sum, c) => sum + subtreeWidth(c.label, map), 0) +
    H_GAP * (node.children.length - 1)
  return Math.max(NODE_RADIUS * 2, childrenWidth)
}

function place(label: string, left: number, depth: number, map: Map<string, NaryNodeDef>): LayoutNaryNode {
  const y = MARGIN + depth * (NODE_RADIUS * 2 + V_GAP)
  const node = map.get(label)

  if (!node || node.children.length === 0) {
    return { label, x: left + subtreeWidth(label, map) / 2, y, children: [] }
  }

  let cursor = left
  const placedChildren: LayoutNaryNode['children'] = []
  for (const child of node.children) {
    const span = subtreeWidth(child.label, map)
    placedChildren.push({ node: place(child.label, cursor, depth + 1, map), weight: child.weight })
    cursor += span + H_GAP
  }

  const first = placedChildren[0].node.x
  const last = placedChildren[placedChildren.length - 1].node.x
  return { label, x: (first + last) / 2, y, children: placedChildren }
}

function maxDepth(label: string, map: Map<string, NaryNodeDef>, depth = 0): number {
  const node = map.get(label)
  if (!node || node.children.length === 0) return depth
  return Math.max(...node.children.map((c) => maxDepth(c.label, map, depth + 1)))
}

export function layoutNaryTree(tree: NaryTree): LayoutNaryResult {
  if (!tree.root || tree.nodes.length === 0) return { root: null, width: 0, height: 0 }
  const map = nodeMap(tree.nodes)
  const positioned = place(tree.root, MARGIN, 0, map)
  const totalWidth = subtreeWidth(tree.root, map) + MARGIN * 2
  const depth = maxDepth(tree.root, map)
  const totalHeight = MARGIN * 2 + (depth + 1) * (NODE_RADIUS * 2) + depth * V_GAP
  return { root: positioned, width: totalWidth, height: totalHeight }
}

export const NARY_LAYOUT = { NODE_RADIUS }
