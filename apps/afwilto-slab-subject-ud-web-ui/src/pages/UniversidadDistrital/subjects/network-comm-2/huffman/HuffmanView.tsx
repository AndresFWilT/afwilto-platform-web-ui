import { useState, useCallback, useMemo } from 'react'
import { Text, Card, Alert, Spinner, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { HuffmanEncodingResult } from '@/application/ports/IEncodingService'
import { EncodingInput } from '../shared/EncodingInput'
import { CompressionStatsCard } from '../shared/CompressionStatsCard'
import { CodeTableView, PALETTE } from '../shared/CodeTableView'
import { EncodedOutputView } from '../shared/EncodedOutputView'
import { HuffmanTreeVisualizer } from './HuffmanTreeVisualizer'

export function HuffmanView() {
  const { encodingService } = useServices()

  const [result, setResult]     = useState<HuffmanEncodingResult | null>(null)
  const [inputText, setInputText] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleEncode = useCallback(async (text: string) => {
    setLoading(true)
    setError(null)
    try {
      const r = await encodingService.encodeHuffman(text)
      setResult(r)
      setInputText(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encoding failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [encodingService])

  const colorMap = useMemo((): Map<string, string> => {
    if (!result) return new Map()
    return new Map(
      result.codeTable.map((e, i) => [e.symbol, PALETTE[i % PALETTE.length]])
    )
  }, [result])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Huffman Coding</Text>
        <Badge variant="primary" size="sm">Live</Badge>
      </div>
      <Text variant="caption" color="muted">
        Builds an optimal prefix-free tree using a min-heap. Lower frequency symbols get longer codes. Edge labels show the assigned bit: 0 (left) / 1 (right).
      </Text>

      <EncodingInput disabled={loading} onEncode={handleEncode} />

      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card padding="md" className="flex items-center justify-center" style={{ height: 64 }}>
          <Spinner size="md" />
        </Card>
      )}

      {result && (
        <>
          <Card
            padding="md"
            className="relative"
            style={{ backgroundColor: 'var(--color-surface-overlay)' }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: 'rgba(24,29,53,0.6)' }}>
                <Spinner size="md" />
              </div>
            )}
            <HuffmanTreeVisualizer root={result.tree} colorMap={colorMap} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CompressionStatsCard stats={result.encoding} />
            <CodeTableView entries={result.codeTable} colorMap={colorMap} />
          </div>

          <EncodedOutputView
            inputText={inputText}
            codeTable={result.codeTable}
            stats={result.encoding}
            colorMap={colorMap}
          />
        </>
      )}
    </div>
  )
}
