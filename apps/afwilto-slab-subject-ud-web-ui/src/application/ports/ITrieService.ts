export interface TrieNode {
  character: string | null
  isTerminal: boolean
  translation: string | null
  children: TrieNode[]
}

export interface Trie {
  root: TrieNode
}

export interface DictionaryEntry {
  word: string
  translation: string
}

export type TrieOperationType = 'INSERT' | 'DELETE'

export interface TrieOperationResult {
  trie: Trie
  operation: {
    type: TrieOperationType
    word: string
    translation?: string
    affectedPath: string[]
  }
}

export interface TrieSearchResult {
  prefix: string
  matches: DictionaryEntry[]
}

export type TraversalOrder = 'PREORDER' | 'INORDER' | 'POSTORDER'

export interface TraversalResult {
  order: TraversalOrder
  sequence: string[]
}

export interface ITrieService {
  insert(trie: Trie, word: string, translation: string): Promise<TrieOperationResult>
  delete(trie: Trie, word: string): Promise<TrieOperationResult>
  searchPrefix(trie: Trie, prefix: string): Promise<TrieSearchResult>
  traverse(trie: Trie, order: TraversalOrder): Promise<TraversalResult>
}
