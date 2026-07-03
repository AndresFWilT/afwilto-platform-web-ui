import { Card, Text } from '@afwilto/design-system'
import type { DictionaryEntry, TraversalResult } from '@/application/ports/ITrieService'

interface TrieWordListProps {
  searchResults: DictionaryEntry[] | null
  searchPrefix: string | null
  traversalResult: TraversalResult | null
}

export function TrieWordList({ searchResults, searchPrefix, traversalResult }: TrieWordListProps) {
  if (!searchResults && !traversalResult) return null

  return (
    <Card padding="md" className="flex flex-col gap-4">
      {searchResults !== null && (
        <div className="flex flex-col gap-2">
          <Text variant="h4" color="default">
            {searchPrefix
              ? `Words with prefix "${searchPrefix}" (${searchResults.length})`
              : `All words (${searchResults.length})`}
          </Text>
          {searchResults.length === 0 ? (
            <Text variant="caption" color="muted">No matches found.</Text>
          ) : (
            <div className="overflow-auto max-h-48">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="py-1 pr-4 text-left">
                      <Text variant="caption" color="muted">Word</Text>
                    </th>
                    <th className="py-1 text-left">
                      <Text variant="caption" color="muted">Translation</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((entry) => (
                    <tr key={entry.word} className="border-b border-surface-border/40">
                      <td className="py-1 pr-4">
                        <Text variant="mono" color="default">{entry.word}</Text>
                      </td>
                      <td className="py-1">
                        <Text variant="body" color="muted">{entry.translation}</Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {traversalResult !== null && (
        <div className="flex flex-col gap-2">
          <Text variant="h4" color="default">
            {traversalResult.order.charAt(0) + traversalResult.order.slice(1).toLowerCase()} Traversal
          </Text>
          {traversalResult.sequence.length === 0 ? (
            <Text variant="caption" color="muted">Empty trie.</Text>
          ) : (
            <div className="flex flex-wrap gap-1">
              {traversalResult.sequence.map((ch, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-7 h-7 rounded bg-surface-overlay border border-surface-border"
                >
                  <Text variant="mono" color="default">{ch}</Text>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
