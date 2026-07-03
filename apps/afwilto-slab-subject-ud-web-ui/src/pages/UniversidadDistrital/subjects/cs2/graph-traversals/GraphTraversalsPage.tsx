import { useState } from 'react'
import { Text, Button, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { AdjacencyListInput } from './AdjacencyListInput'
import { GraphCanvas } from './GraphCanvas'
import { SpanningTreeView } from './SpanningTreeView'
import { TraversalOrderView } from './TraversalOrderView'
import type { Algorithm } from './types'
import type { TraversalResult } from '@/application/ports/IGraphTraversalService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'graph-traversals')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function GraphTraversalsPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <GraphTraversalsVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer ───────────────────────────────────────────────────────────

function buildEmptyAdjList(n: number): Record<number, number[]> {
  return Object.fromEntries(Array.from({ length: n }, (_, i) => [i, []]))
}

function GraphTraversalsVisualizer() {
  const { graphTraversalService } = useServices()

  const [vertexCount, setVertexCount]       = useState(0)
  const [adjacencyList, setAdjacencyList]   = useState<Record<number, number[]>>({})
  const [algorithm, setAlgorithm]           = useState<Algorithm>('BFS')
  const [source, setSource]                 = useState(0)
  const [result, setResult]                 = useState<TraversalResult | null>(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  function handleVertexCountChange(raw: string) {
    const n = parseInt(raw, 10)
    if (isNaN(n) || n < 0) return
    const clamped = Math.min(n, 20)
    setVertexCount(clamped)
    setAdjacencyList(buildEmptyAdjList(clamped))
    setResult(null)
    setError(null)
    setSource(0)
  }

  function handleNeighborChange(vertex: number, neighbors: number[]) {
    setAdjacencyList(prev => ({ ...prev, [vertex]: neighbors }))
    setResult(null)
  }

  function handleReset() {
    setVertexCount(0)
    setAdjacencyList({})
    setResult(null)
    setError(null)
    setSource(0)
  }

  async function handleRun() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const fn = algorithm === 'BFS' ? graphTraversalService.bfs : graphTraversalService.dfs
      const res = await fn.call(graphTraversalService, vertexCount, adjacencyList, source)
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
        <Text variant="h3" color="default">Graph Traversals</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Controls */}
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

          {/* Algorithm selector */}
          <div className="flex flex-col gap-1.5">
            <Text variant="caption" color="muted" className="uppercase tracking-widest">Algorithm</Text>
            <div className="flex rounded border border-surface-border overflow-hidden">
              {(['BFS', 'DFS'] as Algorithm[]).map(alg => (
                <button
                  key={alg}
                  onClick={() => { setAlgorithm(alg); setResult(null) }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    algorithm === alg
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-overlay text-neutral-400 hover:text-neutral-100'
                  }`}
                >
                  {alg}
                </button>
              ))}
            </div>
          </div>

          {/* Source selector */}
          {vertexCount > 0 && (
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
              onClick={handleRun}
              disabled={loading || vertexCount === 0}
              loading={loading}
            >
              Run {algorithm}
            </Button>
          </div>
        </div>
      </Card>

      {/* Adjacency list */}
      {vertexCount > 0 && (
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Adjacency list (directed edges)
          </Text>
          <Card padding="md">
            <AdjacencyListInput
              n={vertexCount}
              adjacencyList={adjacencyList}
              onChange={handleNeighborChange}
            />
          </Card>
        </div>
      )}

      {/* Dual visualization: graph + spanning tree side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Graph canvas */}
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Directed graph
            {result && <span className="ml-2 normal-case text-primary-400">— tree edges highlighted</span>}
          </Text>
          <Card
            padding="none"
            className="relative overflow-hidden w-full"
            style={{ height: '300px', backgroundColor: 'var(--color-brand-50)' }}
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
                <GraphCanvas
                  n={vertexCount}
                  adjacencyList={adjacencyList}
                  spanningTreeEdges={result?.spanningTreeEdges}
                  algorithm={result?.algorithm}
                  source={source}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Spanning tree */}
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Spanning tree
          </Text>
          <Card
            padding="sm"
            className="relative overflow-hidden w-full"
            style={{ height: '300px', backgroundColor: 'var(--color-brand-50)' }}
          >
            {!result ? (
              <div className="flex h-full items-center justify-center">
                <span style={{ color: 'rgba(58,77,174,0.5)', fontFamily: 'monospace', fontSize: 13 }}>
                  Run BFS or DFS to see the spanning tree
                </span>
              </div>
            ) : (
              <SpanningTreeView root={result.spanningTree} algorithm={result.algorithm} />
            )}
          </Card>
        </div>
      </div>

      {/* Traversal order */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className="h-px bg-surface-border" />
          <Card padding="md">
            <TraversalOrderView result={result} />
          </Card>
        </div>
      )}
    </div>
  )
}
