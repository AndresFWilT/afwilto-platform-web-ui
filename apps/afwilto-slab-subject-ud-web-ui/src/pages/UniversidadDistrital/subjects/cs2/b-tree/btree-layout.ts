import type { BTree, BTreeNode } from '@/application/ports/IBTreeService'
import type { LayoutNode, LayoutResult } from './types'

// Layout constants (SVG units). Replaces the legacy magic-number switch on depth.
const KEY_WIDTH = 34       // width per key cell
const NODE_PADDING = 10    // horizontal padding inside a node box
const NODE_HEIGHT = 38
const H_GAP = 24           // horizontal gap between sibling subtrees
const V_GAP = 56           // vertical gap between levels
const MARGIN = 24

function nodeWidth(node: BTreeNode): number {
  const cells = Math.max(node.keys.length, 1)
  return cells * KEY_WIDTH + NODE_PADDING * 2
}

// First pass: compute the total horizontal span of each subtree.
function subtreeWidth(node: BTreeNode): number {
  const own = nodeWidth(node)
  if (node.children.length === 0) return own
  const childrenWidth =
    node.children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
    H_GAP * (node.children.length - 1)
  return Math.max(own, childrenWidth)
}

// Second pass: assign x (centered over children's span) and y (by depth).
function place(node: BTreeNode, left: number, depth: number): LayoutNode {
  const y = MARGIN + depth * (NODE_HEIGHT + V_GAP)
  const width = nodeWidth(node)

  if (node.children.length === 0) {
    const span = subtreeWidth(node)
    return {
      keys: node.keys,
      x: left + span / 2,
      y,
      width,
      node,
      children: [],
    }
  }

  let cursor = left
  const placedChildren: LayoutNode[] = []
  for (const child of node.children) {
    const span = subtreeWidth(child)
    placedChildren.push(place(child, cursor, depth + 1))
    cursor += span + H_GAP
  }

  // Center the parent over the midpoints of its first and last child.
  const first = placedChildren[0].x
  const last = placedChildren[placedChildren.length - 1].x
  return {
    keys: node.keys,
    x: (first + last) / 2,
    y,
    width,
    node,
    children: placedChildren,
  }
}

function maxDepth(node: BTreeNode, depth = 0): number {
  if (node.children.length === 0) return depth
  return Math.max(...node.children.map((c) => maxDepth(c, depth + 1)))
}

// layoutBTree turns a tree into a positioned tree the visualizer renders directly.
// Pure, no DOM, no magic per-depth offsets — works at any depth.
export function layoutBTree(tree: BTree): LayoutResult {
  const root = tree.root
  if (!root || (root.keys.length === 0 && root.children.length === 0)) {
    return { root: null, width: 0, height: 0 }
  }

  const positioned = place(root, MARGIN, 0)
  const totalWidth = subtreeWidth(root) + MARGIN * 2
  const totalHeight = MARGIN * 2 + (maxDepth(root) + 1) * NODE_HEIGHT + maxDepth(root) * V_GAP

  return { root: positioned, width: totalWidth, height: totalHeight }
}

export const LAYOUT = {
  KEY_WIDTH,
  NODE_PADDING,
  NODE_HEIGHT,
}
