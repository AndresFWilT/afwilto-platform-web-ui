import { useState, useCallback, useMemo } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { HuffmanInput } from './HuffmanInput'
import { HuffmanTreeVisualizer } from './HuffmanTreeVisualizer'
import { HuffmanCodeTable } from './HuffmanCodeTable'
import { HuffmanStats } from './HuffmanStats'
import { HuffmanEncodedOutput } from './HuffmanEncodedOutput'
import { SYMBOL_PALETTE } from './types'
import type { HuffmanEncodingResult } from '@/application/ports/IHuffmanService'

const PROJECT = CS2_PROJECTS.find((p) => p.slug === 'huffman-coding')!

export function HuffmanCodingPage() {
  const { huffmanService } = useServices()

  const [result, setResult] = useState<HuffmanEncodingResult | null>(null)
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEncode = useCallback(async (text: string) => {
    setLoading(true)
    setError(null)
    try {
      const r = await huffmanService.encode(text)
      setResult(r)
      setInputText(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encoding failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [huffmanService])

  // Assign a deterministic color to each symbol (alphabetically sorted).
  const colorMap = useMemo((): Map<string, string> => {
    if (!result) return new Map()
    const symbols = result.codeTable.map((e) => e.symbol).sort()
    return new Map(symbols.map((sym, i) => [sym, SYMBOL_PALETTE[i % SYMBOL_PALETTE.length]]))
  }, [result])

  return (
    <CS2ProjectPage project={PROJECT}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">Huffman Coding</Text>
          <Badge variant="primary" size="sm">Live</Badge>
        </div>
        <Text variant="caption" color="muted">
          Enter any text to build its Huffman tree, generate the prefix-free code table,
          and see how much compression is achieved. Symbols are color-coded throughout.
        </Text>

        <HuffmanInput disabled={loading} onEncode={handleEncode} />

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
            <HuffmanStats stats={result.encoding} />

            <Card
              padding="md"
              className="relative"
              style={{ backgroundColor: 'var(--color-brand-50)' }}
            >
              <div className="mb-2">
                <Text variant="caption" color="muted">
                  Leaves show symbol + frequency. Internal nodes show merged frequency. Edge labels are the bit assigned (0 = left, 1 = right).
                </Text>
              </div>
              <HuffmanTreeVisualizer root={result.tree} colorMap={colorMap} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <HuffmanCodeTable entries={result.codeTable} colorMap={colorMap} />
              <HuffmanEncodedOutput
                text={inputText}
                codeTable={result.codeTable}
                colorMap={colorMap}
              />
            </div>
          </>
        )}
      </div>
    </CS2ProjectPage>
  )
}
