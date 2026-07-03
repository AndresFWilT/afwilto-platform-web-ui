import type { TrieNode, DictionaryEntry, TraversalResult } from '@/application/ports/ITrieService'

export interface LayoutTrieNode {
  character: string | null
  isTerminal: boolean
  translation: string | null
  x: number
  y: number
  children: LayoutTrieNode[]
}

export interface LayoutResult {
  root: LayoutTrieNode | null
  width: number
  height: number
}

export type { TrieNode, DictionaryEntry, TraversalResult }
