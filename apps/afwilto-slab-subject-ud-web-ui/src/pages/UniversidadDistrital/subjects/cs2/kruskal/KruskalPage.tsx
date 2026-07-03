import { useState } from 'react'
import { Text, Button, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { EdgeWeightInput } from './EdgeWeightInput'
import { KruskalGraphView } from './KruskalGraphView'
import { SortedEdgeList } from './SortedEdgeList'
import type { GraphEdge, MSTResult } from '@/application/ports/IGraphAlgoService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'kruskal')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function KruskalPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <KruskalVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer ───────────────────────────────────────────────────────────

function KruskalVisualizer() {
  const { graphAlgoService } = useServices()

  const [vertexCount, setVertexCount] = useState(0)
  const [edges, setEdges]             = useState<GraphEdge[]>([])
  const [result, setResult]           = useState<MSTResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleVertexCountChange(raw: string) {
    const n = parseInt(raw, 10)
    if (isNaN(n) || n < 0) return
    const clamped = Math.min(n, 30)
    setVertexCount(clamped)
    setEdges([])
    setResult(null)
    setError(null)
  }

  function handleEdgesChange(next: GraphEdge[]) {
    setEdges(next)
    setResult(null)
  }

  function handleReset() {
    setVertexCount(0)
    setEdges([])
    setResult(null)
    setError(null)
  }

  async function handleCompute() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await graphAlgoService.computeKruskalMST(vertexCount, edges)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Kruskal&apos;s MST</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Controls */}
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-1.5">
            <Text variant="caption" color="muted" className="uppercase tracking-widest">Vertices (1–30)</Text>
            <input
              type="number"
              min={1}
              max={30}
              value={vertexCount === 0 ? '' : vertexCount}
              placeholder="e.g. 5"
              onChange={e => handleVertexCountChange(e.target.value)}
              className="h-9 w-24 rounded border border-surface-border bg-brand-800 px-3 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" size="sm" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompute}
              disabled={loading || vertexCount === 0 || edges.length === 0}
              loading={loading}
            >
              Compute MST
            </Button>
          </div>
        </div>
      </Card>

      {/* Edge input */}
      {vertexCount > 0 && (
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Edge list
          </Text>
          <Card padding="md">
            <EdgeWeightInput
              edges={edges}
              vertexCount={vertexCount}
              onChange={handleEdgesChange}
            />
          </Card>
        </div>
      )}

      {/* Dual visualization: graph + sorted edge list */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Graph canvas */}
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Graph
            {result && <span className="ml-2 normal-case text-green-400">— MST edges highlighted</span>}
          </Text>
          <Card
            padding="none"
            className="relative overflow-hidden w-full"
            style={{ height: '320px', backgroundColor: 'var(--color-brand-50)' }}
          >
            {loading && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-50) 75%, transparent)' }}
              >
                <Spinner size="lg" />
              </div>
            )}
            <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: 'thin' }}>
              <div style={{ minWidth: '280px', height: '100%' }}>
                <KruskalGraphView vertexCount={vertexCount} edges={edges} result={result} />
              </div>
            </div>
          </Card>
        </div>

        {/* Sorted edge list — the educational centerpiece */}
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Greedy edge selection
          </Text>
          <Card padding="md" className="h-full">
            {!result ? (
              <div className="flex h-48 items-center justify-center">
                <Text variant="small" color="muted">
                  Compute MST to see Kruskal&apos;s greedy edge selection
                </Text>
              </div>
            ) : (
              <SortedEdgeList edges={edges} result={result} />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
