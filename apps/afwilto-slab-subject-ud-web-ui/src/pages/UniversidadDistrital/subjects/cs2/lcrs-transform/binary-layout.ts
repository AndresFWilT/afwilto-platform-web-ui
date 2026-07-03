import type { BinaryTree, BinaryNode } from '@/application/ports/ILCRSService'
import type { LayoutBinaryNode, LayoutBinaryResult } from './types'

const NODE_RADIUS = 16
const H_GAP = 28
const V_GAP = 60
const MARGIN = 28

function subtreeWidth(node: BinaryNode | null): number {
  if (!node) return 0
  const leftW = subtreeWidth(node.left)
  const rightW = subtreeWidth(node.right)
  if (leftW === 0 && rightW === 0) return NODE_RADIUS * 2
  const childrenWidth = leftW + (leftW > 0 && rightW > 0 ? H_GAP : 0) + rightW
  return Math.max(NODE_RADIUS * 2, childrenWidth)
}

function place(node: BinaryNode | null, left: number, depth: number): LayoutBinaryNode | null {
  if (!node) return null
  const y = MARGIN + depth * (NODE_RADIUS * 2 + V_GAP)
  const leftW = subtreeWidth(node.left)
  const rightW = subtreeWidth(node.right)

  if (!node.left && !node.right) {
    return { label: node.label, weight: node.weight, x: left + NODE_RADIUS, y, left: null, right: null }
  }

  let cursor = left
  const placedLeft = place(node.left, cursor, depth + 1)
  if (leftW > 0) cursor += leftW + (rightW > 0 ? H_GAP : 0)
  const placedRight = place(node.right, cursor, depth + 1)

  const leftX = placedLeft?.x ?? 0
  const rightX = placedRight?.x ?? 0
  const x = placedLeft && placedRight
    ? (leftX + rightX) / 2
    : placedLeft
    ? leftX
    : rightX

  return { label: node.label, weight: node.weight, x, y, left: placedLeft, right: placedRight }
}

function maxDepth(node: BinaryNode | null, depth = 0): number {
  if (!node) return depth - 1
  return Math.max(maxDepth(node.left, depth + 1), maxDepth(node.right, depth + 1))
}

export function layoutBinaryTree(tree: BinaryTree): LayoutBinaryResult {
  if (!tree.root) return { root: null, width: 0, height: 0 }
  const positioned = place(tree.root, MARGIN, 0)
  const totalWidth = subtreeWidth(tree.root) + MARGIN * 2
  const depth = maxDepth(tree.root)
  const totalHeight = MARGIN * 2 + (depth + 1) * (NODE_RADIUS * 2) + Math.max(0, depth) * V_GAP
  return { root: positioned, width: totalWidth, height: totalHeight }
}

export const BINARY_LAYOUT = { NODE_RADIUS }
