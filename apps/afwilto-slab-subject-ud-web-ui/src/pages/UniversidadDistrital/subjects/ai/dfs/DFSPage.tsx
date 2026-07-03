import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import { GraphEditor } from './GraphEditor'
import { GraphCanvas } from './GraphCanvas'
import { StackPanel } from './StackPanel'
import { TraversalOrder } from './TraversalOrder'
import type { UnweightedVertexNode, UnweightedEdge, DFSVertexState } from './types'
import type { DFSResult } from '@/application/ports/IDFSService'

type Mode = 'idle' | 'solved' | 'step'

const DEFAULT_VERTICES: UnweightedVertexNode[] = [
  { id: 'A', x: 100, y: 180 },
  { id: 'B', x: 280, y: 80  },
  { id: 'C', x: 280, y: 280 },
  { id: 'D', x: 460, y: 80  },
  { id: 'E', x: 460, y: 280 },
  { id: 'F', x: 640, y: 180 },
]
const DEFAULT_EDGES: UnweightedEdge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'C', to: 'E' },
  { from: 'D', to: 'F' },
  { from: 'E', to: 'F' },
]

export function DFSPage() {
  const { dfsService } = useServices()

  const [vertices, setVertices] = useState<UnweightedVertexNode[]>(DEFAULT_VERTICES)
  const [edges, setEdges] = useState<UnweightedEdge[]>(DEFAULT_EDGES)
  const [start, setStart] = useState('A')
  const [goal, setGoal] = useState('F')

  const [mode, setMode] = useState<Mode>('idle')
  const [result, setResult] = useState<DFSResult | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(800)

  const stepIndexRef = useRef(stepIndex)
  useEffect(() => { stepIndexRef.current = stepIndex }, [stepIndex])
  const resultRef = useRef(result)
  useEffect(() => { resultRef.current = result }, [result])

  // ── Auto-play ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoPlay || mode !== 'step' || !result) return
    const id = setInterval(() => {
      const r = resultRef.current
      const idx = stepIndexRef.current
      if (!r || idx >= r.steps.length - 1) { setAutoPlay(false); return }
      setStepIndex(i => i + 1)
    }, autoPlaySpeed)
    return () => clearInterval(id)
  }, [autoPlay, autoPlaySpeed, mode, result])

  // ── Vertex state computation ─────────────────────────────────────────────────
  const vertexStates: Record<string, DFSVertexState> = {}
  const pathToGoal: string[] = []

  if (result && mode !== 'idle') {
    const effectiveIndex = mode === 'solved' ? result.steps.length - 1 : stepIndex
    const currentStep = result.steps[effectiveIndex]

    if (currentStep) {
      for (const id of currentStep.visitedSet) vertexStates[id] = 'visited'
      for (const id of currentStep.stackState) {
        if (!(id in vertexStates)) vertexStates[id] = 'in-stack'
      }
      vertexStates[currentStep.vertexId] = currentStep.action === 'GOAL_FOUND' ? 'goal' : 'current'
    }

    const showPath = mode === 'solved' || (mode === 'step' && currentStep?.action === 'GOAL_FOUND')
    if (showPath && result.pathToGoal) {
      for (const id of result.pathToGoal) pathToGoal.push(id)
    }
  }

  // ── Graph edit handlers ──────────────────────────────────────────────────────
  function handleAddVertex(id: string) {
    if (vertices.find(v => v.id === id)) return
    const col = vertices.length % 4
    const row = Math.floor(vertices.length / 4)
    setVertices(vs => [...vs, { id, x: 80 + col * 180, y: 80 + row * 120 }])
    resetResult()
  }

  function handleRemoveVertex(id: string) {
    setVertices(vs => vs.filter(v => v.id !== id))
    setEdges(es => es.filter(e => e.from !== id && e.to !== id))
    resetResult()
  }

  function handleAddEdge(from: string, to: string) {
    if (!vertices.find(v => v.id === from) || !vertices.find(v => v.id === to)) {
      setError(`Vertex '${from}' or '${to}' does not exist`)
      return
    }
    setEdges(es => [...es, { from, to }])
    resetResult()
  }

  function handleRemoveEdge(index: number) {
    setEdges(es => es.filter((_, i) => i !== index))
    resetResult()
  }

  const handleVertexDrag = useCallback((id: string, x: number, y: number) => {
    setVertices(vs => vs.map(v => v.id === id ? { ...v, x, y } : v))
  }, [])

  function resetResult() {
    setMode('idle'); setResult(null); setStepIndex(0); setAutoPlay(false); setError(null)
  }

  // ── Adjacency list builder ───────────────────────────────────────────────────
  function buildAdjacency(): Record<string, string[]> {
    const adj: Record<string, string[]> = {}
    for (const v of vertices) adj[v.id] = []
    for (const e of edges) {
      if (adj[e.from]) adj[e.from].push(e.to)
    }
    return adj
  }

  // ── API calls ────────────────────────────────────────────────────────────────
  async function handleSolve() {
    setLoading(true); setError(null); resetResult()
    try {
      const res = await dfsService.solve(buildAdjacency(), start, goal || undefined)
      setResult(res); setMode('solved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally { setLoading(false) }
  }

  async function handleStartStep() {
    setLoading(true); setError(null)
    try {
      const res = await dfsService.solve(buildAdjacency(), start, goal || undefined)
      setResult(res); setMode('step'); setStepIndex(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally { setLoading(false) }
  }

  function handleNextStep() {
    if (!result || stepIndex >= result.steps.length - 1) return
    setStepIndex(i => i + 1)
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const currentStep = result?.steps[stepIndex]
  const isDone = mode === 'step' && result !== null && stepIndex >= result.steps.length - 1
  const displayTraversal = mode === 'solved'
    ? result?.traversalOrder ?? []
    : currentStep?.visitedSet ?? []

  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/artificial-intelligence-1" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Artificial Intelligence
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">Depth-First Search</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <Text variant="h2" color="default">Depth-First Search</Text>
          <Text variant="small" color="muted">
            Iterative DFS with explicit stack — traversal mode and goal-search mode with path reconstruction
          </Text>
        </div>

        {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Left panel ──────────────────────────────────────────────────── */}
          <Card padding="md" className="flex flex-col gap-5">
            <Text variant="h4" color="default">Graph Builder</Text>
            <GraphEditor
              vertices={vertices} edges={edges} start={start} goal={goal} loading={loading}
              onAddVertex={handleAddVertex} onRemoveVertex={handleRemoveVertex}
              onAddEdge={handleAddEdge} onRemoveEdge={handleRemoveEdge}
              onStartChange={setStart} onGoalChange={setGoal}
              onSolve={handleSolve} onStartStep={handleStartStep}
            />
            {mode !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={resetResult}>↺ Reset</Button>
            )}

            {/* Legend */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-border">
              {[
                { color: 'rgba(245,158,11,0.85)', label: 'Current' },
                { color: 'rgba(99,102,241,0.65)', label: 'In stack' },
                { color: 'rgba(34,197,94,0.55)',  label: 'Visited' },
                { color: 'rgba(99,102,241,0.9)',  label: 'Path to goal' },
                { color: 'rgba(239,68,68,0.7)',   label: 'Goal' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <Text variant="caption" color="muted">{label}</Text>
                </div>
              ))}
              <Text variant="caption" color="muted" className="mt-1">Leave Goal empty for full traversal. Drag vertices to reposition.</Text>
            </div>
          </Card>

          {/* ── Right panel ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Graph visualization */}
            <GraphCanvas
              vertices={vertices} edges={edges}
              vertexStates={vertexStates} pathToGoal={pathToGoal}
              onVertexDrag={handleVertexDrag}
            />

            {/* Step controls */}
            {mode === 'step' && result && (
              <Card padding="md" className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Text variant="h4" color="default">Step-by-Step</Text>
                    <Text variant="caption" color="muted">
                      Step {stepIndex + 1} / {result.steps.length}
                      {currentStep && ` — visiting ${currentStep.vertexId}`}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <>
                        <Button variant="primary" size="sm" onClick={handleNextStep}>Next →</Button>
                        <Button variant={autoPlay ? 'danger' : 'secondary'} size="sm"
                          onClick={() => setAutoPlay(v => !v)}>
                          {autoPlay ? '⏸ Pause' : '▶ Auto'}
                        </Button>
                      </>
                    )}
                    {isDone && <span className="text-green-400 text-sm font-semibold">✓ Complete</span>}
                  </div>
                </div>

                {autoPlay && (
                  <div className="flex items-center gap-3">
                    <Text variant="caption" color="muted">Speed:</Text>
                    <input type="range" min={200} max={2000} step={100}
                      value={autoPlaySpeed}
                      onChange={e => setAutoPlaySpeed(Number(e.target.value))}
                      className="flex-1 accent-primary-500" />
                    <Text variant="caption" color="muted" className="font-mono w-14">{autoPlaySpeed}ms</Text>
                  </div>
                )}
              </Card>
            )}

            {/* Stack + Traversal panels */}
            {result && mode !== 'idle' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="md">
                  <StackPanel
                    stack={mode === 'step' ? (currentStep?.stackState ?? []) : []}
                    currentVertex={mode === 'step' ? (currentStep?.vertexId ?? null) : null}
                  />
                </Card>
                <Card padding="md">
                  <TraversalOrder
                    traversalOrder={displayTraversal}
                    pathToGoal={result.pathToGoal ?? null}
                  />
                </Card>
              </div>
            )}

            {/* Metrics */}
            {result && (mode === 'solved' || isDone) && (
              <Card padding="md" className="flex gap-6">
                <div>
                  <Text variant="caption" color="muted">Vertices visited</Text>
                  <Text variant="small" weight="semibold" color="default" className="font-mono">{result.verticesVisited}</Text>
                </div>
                {result.pathToGoal && (
                  <div>
                    <Text variant="caption" color="muted">Path length</Text>
                    <Text variant="small" weight="semibold" color="default" className="font-mono">{result.pathToGoal.length}</Text>
                  </div>
                )}
              </Card>
            )}

            {/* Idle placeholder */}
            {mode === 'idle' && (
              <Card padding="md" className="flex flex-col items-center gap-3 py-12">
                <Text variant="body" color="muted" className="text-center">
                  Build a directed graph, optionally set a goal vertex, then click{' '}
                  <strong className="text-neutral-200">Run All</strong> for full traversal or{' '}
                  <strong className="text-neutral-200">Step Mode</strong> to advance one vertex at a time.
                </Text>
                <Text variant="caption" color="muted" className="text-center">
                  Leave the Goal field empty to run a full DFS traversal of the graph.
                </Text>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
