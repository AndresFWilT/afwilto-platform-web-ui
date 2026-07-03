import { useState, useCallback, useMemo } from 'react'
import { Text, Card, Alert, Spinner, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { ShannonFanoEncodingResult } from '@/application/ports/IEncodingService'
import { EncodingInput } from '../shared/EncodingInput'
import { CompressionStatsCard } from '../shared/CompressionStatsCard'
import { CodeTableView, PALETTE } from '../shared/CodeTableView'
import { EncodedOutputView } from '../shared/EncodedOutputView'
import { ShannonFanoTable } from './ShannonFanoTable'

export function ShannonFanoView() {
  const { encodingService } = useServices()

  const [result, setResult]       = useState<ShannonFanoEncodingResult | null>(null)
  const [inputText, setInputText] = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  const handleEncode = useCallback(async (text: string) => {
    setLoading(true)
    setError(null)
    try {
      const r = await encodingService.encodeShannonFano(text)
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
        <Text variant="h3" color="default">Shannon-Fano Coding</Text>
        <Badge variant="primary" size="sm">Live</Badge>
      </div>
      <Text variant="caption" color="muted">
        Top-down frequency partitioning. Symbols are split into two groups with the most equal frequency sums, recursively. Correctly implements both halves — fixing the legacy bug where the lower half received no codes.
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
          <ShannonFanoTable entries={result.entries} totals={result.totals} colorMap={colorMap} />

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
