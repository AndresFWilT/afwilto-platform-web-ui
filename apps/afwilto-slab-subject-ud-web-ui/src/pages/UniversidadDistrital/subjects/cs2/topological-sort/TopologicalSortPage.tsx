import { useState } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { DAGBuilder } from './DAGBuilder'
import { InDegreeTable } from './InDegreeTable'
import { TopologicalOrderView } from './TopologicalOrderView'
import { DAGVisualizer } from './DAGVisualizer'
import type { TopologicalSortResult } from '@/application/ports/ITopologicalSortService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'topological-sort')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function TopologicalSortPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <TopologicalSortVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer ───────────────────────────────────────────────────────────

function buildEmptyAdjList(n: number): Record<number, number[]> {
  return Object.fromEntries(Array.from({ length: n }, (_, i) => [i, []]))
}

function TopologicalSortVisualizer() {
  const { topologicalSortService } = useServices()

  const [vertexCount, setVertexCount]     = useState(0)
  const [adjacencyList, setAdjacencyList] = useState<Record<number, number[]>>({})
  const [result, setResult]               = useState<TopologicalSortResult | null>(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  function handleVertexCountChange(n: number) {
    const clamped = Math.min(Math.max(n, 0), 30)
    setVertexCount(clamped)
    setAdjacencyList(buildEmptyAdjList(clamped))
    setResult(null)
    setError(null)
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
  }

  async function handleCompute() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await topologicalSortService.compute(vertexCount, adjacencyList)
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
        <Text variant="h3" color="default">Topological Sort</Text>
        <Badge variant="primary" size="sm">Kahn&apos;s Algorithm</Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* DAG builder */}
      <Card padding="md">
        <DAGBuilder
          n={vertexCount}
          adjacencyList={adjacencyList}
          onVertexCountChange={handleVertexCountChange}
          onNeighborChange={handleNeighborChange}
          onCompute={handleCompute}
          onReset={handleReset}
          loading={loading}
        />
      </Card>

      {/* Layer visualization — the educational centerpiece */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
          DAG — layer layout
          {result && <span className="ml-2 normal-case text-green-400">— sources highlighted in green</span>}
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
            <div style={{ minWidth: '400px', height: '100%' }}>
              <DAGVisualizer
                n={vertexCount}
                adjacencyList={adjacencyList}
                inDegrees={result?.inDegrees}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* In-degree table */}
          <div className="flex flex-col gap-2">
            <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
              Initial in-degrees
            </Text>
            <Card padding="md">
              <InDegreeTable inDegrees={result.inDegrees} />
            </Card>
          </div>

          {/* Topological order */}
          <div className="flex flex-col gap-2">
            <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
              Topological order
            </Text>
            <Card padding="md">
              <TopologicalOrderView result={result} />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
