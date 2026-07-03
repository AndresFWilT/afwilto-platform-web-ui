import type { HuffmanNode } from '@/application/ports/IHuffmanService'

export interface LayoutHuffmanNode {
  frequency: number
  symbol: string | null
  x: number
  y: number
  left: LayoutHuffmanNode | null
  right: LayoutHuffmanNode | null
}

export interface LayoutResult {
  root: LayoutHuffmanNode | null
  width: number
  height: number
}

export type { HuffmanNode }

// Deterministic 8-color palette assigned to leaf symbols alphabetically.
export const SYMBOL_PALETTE = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#06b6d4', '#84cc16',
]
