import type { HuffmanNode } from '@/application/ports/IHuffmanService'
import type { LayoutHuffmanNode, LayoutResult } from './types'

const NODE_RADIUS = 20
const H_GAP = 16
const V_GAP = 64
const MARGIN = 28

function subtreeWidth(node: HuffmanNode | null): number {
  if (!node) return 0
  if (!node.left && !node.right) return NODE_RADIUS * 2
  const leftW = subtreeWidth(node.left)
  const rightW = subtreeWidth(node.right)
  return Math.max(NODE_RADIUS * 2, leftW + H_GAP + rightW)
}

function place(node: HuffmanNode | null, left: number, depth: number): LayoutHuffmanNode | null {
  if (!node) return null
  const y = MARGIN + depth * (NODE_RADIUS * 2 + V_GAP)

  if (!node.left && !node.right) {
    return { frequency: node.frequency, symbol: node.symbol, x: left + NODE_RADIUS, y, left: null, right: null }
  }

  const leftW = subtreeWidth(node.left)
  const rightW = subtreeWidth(node.right)
  const placedLeft = place(node.left, left, depth + 1)
  const placedRight = place(node.right, left + leftW + H_GAP, depth + 1)

  const lx = placedLeft?.x ?? (left + leftW / 2)
  const rx = placedRight?.x ?? (left + leftW + H_GAP + rightW / 2)

  return {
    frequency: node.frequency,
    symbol: node.symbol,
    x: (lx + rx) / 2,
    y,
    left: placedLeft,
    right: placedRight,
  }
}

function maxDepth(node: HuffmanNode | null, depth = 0): number {
  if (!node) return depth - 1
  if (!node.left && !node.right) return depth
  return Math.max(maxDepth(node.left, depth + 1), maxDepth(node.right, depth + 1))
}

// layoutHuffmanTree turns a HuffmanNode tree into a positioned tree the visualizer renders directly.
export function layoutHuffmanTree(root: HuffmanNode | null): LayoutResult {
  if (!root) return { root: null, width: 0, height: 0 }
  const positioned = place(root, MARGIN, 0)
  const totalWidth = subtreeWidth(root) + MARGIN * 2
  const depth = maxDepth(root)
  const totalHeight = MARGIN * 2 + (depth + 1) * (NODE_RADIUS * 2) + Math.max(0, depth) * V_GAP
  return { root: positioned, width: totalWidth, height: totalHeight }
}

export const LAYOUT = { NODE_RADIUS }
