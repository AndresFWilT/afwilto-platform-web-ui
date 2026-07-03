import { useState, useCallback } from 'react'
import { Text, Card, Alert, Spinner, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { TruthTableResult } from '@/application/ports/ITruthTableService'
import { CS3_PROJECTS } from '../data'
import { CS3ProjectPage } from '../CS3ProjectPage'
import { FormulaInput } from './FormulaInput'
import { TruthTableView } from './TruthTableView'

const PROJECT = CS3_PROJECTS.find(p => p.slug === 'truth-table')!

export function TruthTablePage() {
  const { truthTableService } = useServices()

  const [result, setResult]   = useState<TruthTableResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = useCallback(async (formula: string) => {
    setLoading(true)
    setError(null)
    try {
      const r = await truthTableService.generate(formula)
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [truthTableService])

  return (
    <CS3ProjectPage project={PROJECT}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">Truth Table Generator</Text>
          <Badge variant="primary" size="sm">Live</Badge>
        </div>
        <Text variant="caption" color="muted">
          Build a propositional formula using the buttons below. The table displays all 2ⁿ truth
          assignments and classifies the formula as tautology, contradiction, or contingency.
        </Text>

        <FormulaInput disabled={loading} onGenerate={handleGenerate} />

        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
        )}

        {loading && (
          <Card padding="md" className="flex items-center justify-center" style={{ height: 64 }}>
            <Spinner size="md" />
          </Card>
        )}

        {result && <TruthTableView result={result} />}
      </div>
    </CS3ProjectPage>
  )
}
