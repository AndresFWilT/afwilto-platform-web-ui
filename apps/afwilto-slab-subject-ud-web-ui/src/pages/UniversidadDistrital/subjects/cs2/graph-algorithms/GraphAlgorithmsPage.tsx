import { useState } from 'react'
import { Text, Button, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { AdjacencyMatrixInput } from './AdjacencyMatrixInput'
import { GraphVisualizer } from './GraphVisualizer'
import { ShortestPathResultView } from './ShortestPathResultView'
import { MSTResultView } from './MSTResultView'
import type { AlgorithmMode } from './types'
import type { ShortestPathResult, MSTResult, GraphEdge } from '@/application/ports/IGraphAlgoService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'graph-algorithms')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function GraphAlgorithmsPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <GraphAlgorithmsVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer ───────────────────────────────────────────────────────────

function buildEmptyMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n).fill(0))
}

function extractEdges(matrix: number[][], n: number): GraphEdge[] {
  const edges: GraphEdge[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w = matrix[i]?.[j] ?? 0
      if (w > 0) edges.push({ from: i, to: j, weight: w })
    }
  }
  return edges
}

function GraphAlgorithmsVisualizer() {
  const { graphAlgoService } = useServices()

  const [vertexCount, setVertexCount] = useState(0)
  const [matrix, setMatrix]           = useState<number[][]>([])
  const [mode, setMode]               = useState<AlgorithmMode>('shortest-path')
  const [source, setSource]           = useState(0)
  const [spResult, setSpResult]       = useState<ShortestPathResult | null>(null)
  const [mstResult, setMstResult]     = useState<MSTResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleVertexCountChange(raw: string) {
    const n = parseInt(raw, 10)
    if (isNaN(n) || n < 0) return
    const clamped = Math.min(n, 20)
    setVertexCount(clamped)
    setMatrix(buildEmptyMatrix(clamped))
    setSpResult(null)
    setMstResult(null)
    setError(null)
    setSource(0)
  }

  function handleEdgeChange(i: number, j: number, weight: number) {
    setMatrix(prev => {
      const next = prev.map(row => [...row])
      next[i][j] = weight
      next[j][i] = weight
      return next
    })
    setSpResult(null)
    setMstResult(null)
  }

  function handleReset() {
    setVertexCount(0)
    setMatrix([])
    setSpResult(null)
    setMstResult(null)
    setError(null)
    setSource(0)
  }

  async function handleCompute() {
    setLoading(true)
    setError(null)
    setSpResult(null)
    setMstResult(null)
    const edges = extractEdges(matrix, vertexCount)
    try {
      if (mode === 'shortest-path') {
        const res = await graphAlgoService.computeShortestPath(vertexCount, edges, source)
        setSpResult(res)
      } else {
        const res = await graphAlgoService.computeMST(vertexCount, edges)
        setMstResult(res)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const hasResult = spResult !== null || mstResult !== null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Graph Algorithms</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Setup + algorithm controls */}
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-6">
          {/* Vertex count */}
          <div className="flex flex-col gap-1.5">
            <Text variant="caption" color="muted" className="uppercase tracking-widest">Vertices (1–20)</Text>
            <input
              type="number"
              min={1}
              max={20}
              value={vertexCount === 0 ? '' : vertexCount}
              placeholder="e.g. 5"
              onChange={e => handleVertexCountChange(e.target.value)}
              className="h-9 w-24 rounded border border-surface-border bg-brand-800 px-3 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
            />
          </div>

          {/* Mode selector */}
          <div className="flex flex-col gap-1.5">
            <Text variant="caption" color="muted" className="uppercase tracking-widest">Algorithm</Text>
            <div className="flex rounded border border-surface-border overflow-hidden">
              {(['shortest-path', 'mst'] as AlgorithmMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setSpResult(null); setMstResult(null) }}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === m
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-overlay text-neutral-400 hover:text-neutral-100'
                  }`}
                >
                  {m === 'shortest-path' ? 'Shortest Path' : 'MST (Prim)'}
                </button>
              ))}
            </div>
          </div>

          {/* Source selector — SP only */}
          {mode === 'shortest-path' && vertexCount > 0 && (
            <div className="flex flex-col gap-1.5">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Source vertex</Text>
              <select
                value={source}
                onChange={e => setSource(Number(e.target.value))}
                disabled={loading}
                className="h-9 rounded border border-surface-border bg-brand-800 px-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none disabled:opacity-50"
              >
                {Array.from({ length: vertexCount }, (_, i) => (
                  <option key={i} value={i}>{i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" size="sm" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompute}
              disabled={loading || vertexCount === 0}
              loading={loading}
            >
              Compute
            </Button>
          </div>
        </div>
      </Card>

      {/* Graph visualization */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
          Graph visualization
        </Text>
        <Card
          padding="none"
          className="relative overflow-hidden w-full"
          style={{ height: '340px', backgroundColor: 'var(--color-brand-50)' }}
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
            <div style={{ minWidth: '600px', height: '100%' }}>
              <GraphVisualizer
                n={vertexCount}
                matrix={matrix}
                mode={mode}
                spResult={spResult}
                mstResult={mstResult}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Adjacency matrix */}
      {vertexCount > 0 && (
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Adjacency matrix (weights)
          </Text>
          <Card padding="md" className="w-full overflow-x-auto">
            <AdjacencyMatrixInput
              n={vertexCount}
              matrix={matrix}
              onChange={handleEdgeChange}
            />
          </Card>
        </div>
      )}

      {/* Result */}
      {hasResult && (
        <div className="flex flex-col gap-3">
          <div className="h-px bg-surface-border" />
          {spResult && <ShortestPathResultView result={spResult} />}
          {mstResult && <MSTResultView result={mstResult} />}
        </div>
      )}
    </div>
  )
}
