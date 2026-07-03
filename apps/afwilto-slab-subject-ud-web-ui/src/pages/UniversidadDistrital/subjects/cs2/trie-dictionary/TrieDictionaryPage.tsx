import { useState, useCallback } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { TrieWordInput } from './TrieWordInput'
import { TrieOperations } from './TrieOperations'
import { TrieVisualizer } from './TrieVisualizer'
import { TrieWordList } from './TrieWordList'
import type { Trie, DictionaryEntry, TraversalResult, TraversalOrder } from '@/application/ports/ITrieService'

const PROJECT = CS2_PROJECTS.find((p) => p.slug === 'trie-dictionary')!

const emptyTrie = (): Trie => ({ root: { character: null, isTerminal: false, translation: null, children: [] } })

export function TrieDictionaryPage() {
  const { trieService } = useServices()

  const [trie, setTrie] = useState<Trie>(emptyTrie())
  const [affectedPath, setAffectedPath] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<DictionaryEntry[] | null>(null)
  const [searchPrefix, setSearchPrefix] = useState<string | null>(null)
  const [traversalResult, setTraversalResult] = useState<TraversalResult | null>(null)

  const handleInsert = useCallback(async (word: string, translation: string) => {
    setLoading(true)
    setError(null)
    setNotice(null)
    setSearchResults(null)
    setTraversalResult(null)
    try {
      const result = await trieService.insert(trie, word, translation)
      setTrie(result.trie)
      setAffectedPath(result.operation.affectedPath)
      setNotice(`Word "${word}" inserted.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Insert failed')
    } finally {
      setLoading(false)
    }
  }, [trie, trieService])

  const handleDelete = useCallback(async (word: string) => {
    setLoading(true)
    setError(null)
    setNotice(null)
    setSearchResults(null)
    setTraversalResult(null)
    try {
      const result = await trieService.delete(trie, word)
      setTrie(result.trie)
      setAffectedPath(result.operation.affectedPath)
      setNotice(`Word "${word}" deleted.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }, [trie, trieService])

  const handleSearch = useCallback(async (prefix: string) => {
    setLoading(true)
    setError(null)
    setNotice(null)
    setTraversalResult(null)
    try {
      const result = await trieService.searchPrefix(trie, prefix)
      setSearchResults(result.matches)
      setSearchPrefix(prefix)
      setAffectedPath([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [trie, trieService])

  const handleTraverse = useCallback(async (order: TraversalOrder) => {
    setLoading(true)
    setError(null)
    setNotice(null)
    setSearchResults(null)
    try {
      const result = await trieService.traverse(trie, order)
      setTraversalResult(result)
      setAffectedPath([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Traversal failed')
    } finally {
      setLoading(false)
    }
  }, [trie, trieService])

  return (
    <CS2ProjectPage project={PROJECT}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">Trie Dictionary</Text>
          <Badge variant="primary" size="sm">Live</Badge>
        </div>
        <Text variant="caption" color="muted">
          Prefix tree where each node holds a single character. Terminal nodes (green) mark complete words and store translations.
        </Text>

        <TrieWordInput
          disabled={loading}
          onInsert={handleInsert}
          onDelete={handleDelete}
        />

        <TrieOperations
          disabled={loading}
          onSearch={handleSearch}
          onTraverse={handleTraverse}
        />

        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {notice && !error && (
          <Alert variant="success" title="Done" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <Card
          padding="md"
          className="relative"
          style={{ backgroundColor: 'var(--color-brand-50)' }}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
              <Spinner size="md" />
            </div>
          )}
          <TrieVisualizer trie={trie} affectedPath={affectedPath} />
        </Card>

        <TrieWordList
          searchResults={searchResults}
          searchPrefix={searchPrefix}
          traversalResult={traversalResult}
        />
      </div>
    </CS2ProjectPage>
  )
}
