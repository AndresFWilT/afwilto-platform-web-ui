import type { Trie, TrieNode } from '@/application/ports/ITrieService'
import type { LayoutTrieNode, LayoutResult } from './types'

const NODE_RADIUS = 16
const H_GAP = 20
const V_GAP = 56
const MARGIN = 28

function subtreeWidth(node: TrieNode): number {
  if (node.children.length === 0) return NODE_RADIUS * 2
  const childrenWidth =
    node.children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
    H_GAP * (node.children.length - 1)
  return Math.max(NODE_RADIUS * 2, childrenWidth)
}

function place(node: TrieNode, left: number, depth: number): LayoutTrieNode {
  const y = MARGIN + depth * (NODE_RADIUS * 2 + V_GAP)

  if (node.children.length === 0) {
    const span = subtreeWidth(node)
    return {
      character: node.character,
      isTerminal: node.isTerminal,
      translation: node.translation,
      x: left + span / 2,
      y,
      children: [],
    }
  }

  let cursor = left
  const placedChildren: LayoutTrieNode[] = []
  for (const child of node.children) {
    const span = subtreeWidth(child)
    placedChildren.push(place(child, cursor, depth + 1))
    cursor += span + H_GAP
  }

  const first = placedChildren[0].x
  const last = placedChildren[placedChildren.length - 1].x
  return {
    character: node.character,
    isTerminal: node.isTerminal,
    translation: node.translation,
    x: (first + last) / 2,
    y,
    children: placedChildren,
  }
}

function maxDepth(node: TrieNode, depth = 0): number {
  if (node.children.length === 0) return depth
  return Math.max(...node.children.map((c) => maxDepth(c, depth + 1)))
}

// layoutTrie turns a Trie into a positioned tree the visualizer renders directly.
// Pure, no DOM, works at any depth.
export function layoutTrie(trie: Trie): LayoutResult {
  const root = trie.root
  if (!root || root.children.length === 0) {
    return { root: null, width: 0, height: 0 }
  }

  const positioned = place(root, MARGIN, 0)
  const totalWidth = subtreeWidth(root) + MARGIN * 2
  const depth = maxDepth(root)
  const totalHeight = MARGIN * 2 + (depth + 1) * (NODE_RADIUS * 2) + depth * V_GAP

  return { root: positioned, width: totalWidth, height: totalHeight }
}

export const LAYOUT = { NODE_RADIUS }
