import { useState, useCallback } from 'react'
import { Text, Button, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { GraphCanvas } from './GraphCanvas'
import { AdjacencyEditor } from './AdjacencyEditor'
import { ColoredResult } from './ColoredResult'
import type { UIVertex } from './types'
import type { ChromaticEstimate } from '@/application/ports/IChromaticGraphService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'chromatic-graph')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function ChromaticGraphPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <ChromaticVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer — composition root for state + API ────────────────────────

function ChromaticVisualizer() {
  const { chromaticGraphService } = useServices()

  const [vertices, setVertices]     = useState<UIVertex[]>([])
  const [matrix, setMatrix]         = useState<number[][]>([])
  const [startVertex, setStartVertex] = useState(0)
  const [symmetrize, setSymmetrize] = useState(false)
  const [result, setResult]         = useState<ChromaticEstimate | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const addVertex = useCallback((x: number, y: number) => {
    setVertices(prev => {
      const id = prev.length
      return [...prev, { id, x, y }]
    })
    setMatrix(prev => {
      const newN = prev.length + 1
      const expanded = prev.map(row => [...row, 0])
      expanded.push(Array(newN).fill(0))
      return expanded
    })
    setResult(null)
  }, [])

  function updateEdge(i: number, j: number, value: number) {
    setMatrix(prev => {
      const next = prev.map(row => [...row])
      next[i][j] = value
      next[j][i] = value
      return next
    })
    setResult(null)
  }

  function reset() {
    setVertices([])
    setMatrix([])
    setResult(null)
    setError(null)
    setStartVertex(0)
  }

  async function runEstimate() {
    setLoading(true)
    setError(null)
    try {
      const res = await chromaticGraphService.estimate({
        adjacencyMatrix: matrix,
        startVertex,
        symmetrize,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const n = vertices.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Chromatic Number Estimator</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Controls bar */}
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-4">
          {/* Start vertex */}
          <div className="flex flex-col gap-1.5">
            <Text variant="caption" color="muted" className="uppercase tracking-widest">Start vertex</Text>
            <select
              value={startVertex}
              onChange={e => setStartVertex(Number(e.target.value))}
              disabled={n === 0 || loading}
              className="bg-brand-800 border border-surface-border text-neutral-100 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:border-primary-400 disabled:opacity-50"
            >
              {Array.from({ length: n }, (_, i) => (
                <option key={i} value={i}>{i + 1}</option>
              ))}
              {n === 0 && <option value={0}>–</option>}
            </select>
          </div>

          {/* Symmetrize toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={symmetrize}
              onChange={e => setSymmetrize(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 accent-primary-500"
            />
            <Text variant="small" color="muted">Symmetrize</Text>
          </label>

          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" size="sm" onClick={reset} disabled={loading || n === 0}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={runEstimate}
              disabled={loading || n === 0}
              loading={loading}
            >
              Estimate χ
            </Button>
          </div>
        </div>
      </Card>

      {/* Graph canvas — full width */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Graph — click to add vertices
          </Text>
          <Text variant="caption" color="muted">
            {n} {n === 1 ? 'vertex' : 'vertices'} · {matrix.flat().filter(Boolean).length / 2} edges
          </Text>
        </div>
        <Card
          padding="none"
          className="relative overflow-hidden w-full"
          style={{ height: '360px', backgroundColor: 'var(--color-brand-50)' }}
        >
          {/* Empty-state overlay — HTML so it always centers in the VISIBLE card area */}
          {vertices.length === 0 && !loading && (
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <span style={{ color: '#3A4DAE', fontFamily: 'monospace', fontSize: 13 }}>
                Click to place vertices
              </span>
            </div>
          )}

          {/* Loading overlay — absolute on the Card, not inside the scroll layer */}
          {loading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-50) 75%, transparent)' }}
            >
              <Spinner size="lg" />
            </div>
          )}

          {/* Scroll window — SVG is {CANVAS_W}×500 so both scrollbars always appear */}
          <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: 'thin' }}>
            <GraphCanvas
              vertices={vertices}
              matrix={matrix}
              onAddVertex={result ? undefined : addVertex}
            />
          </div>
        </Card>
      </div>

      {/* Adjacency matrix — full width, below canvas */}
      {n > 0 && (
        <div className="flex flex-col gap-2">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Adjacency matrix — click to toggle edges
          </Text>
          <Card padding="md" className="w-full overflow-x-auto">
            <AdjacencyEditor n={n} matrix={matrix} onChange={updateEdge} />
          </Card>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className="h-px bg-surface-border" />
          <Text variant="h4" color="default">Result</Text>
          <ColoredResult vertices={vertices} matrix={matrix} result={result} />
        </div>
      )}
    </div>
  )
}
