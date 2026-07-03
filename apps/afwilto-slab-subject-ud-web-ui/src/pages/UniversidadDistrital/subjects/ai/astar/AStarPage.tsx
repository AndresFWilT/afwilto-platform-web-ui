import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import { GraphEditor } from './GraphEditor'
import { GraphCanvas } from './GraphCanvas'
import { FrontierPanel } from './FrontierPanel'
import { CostTable } from './CostTable'
import type { VertexNode, GraphEdge, VertexState } from './types'
import type { AStarResult } from '@/application/ports/IAStarService'

type Mode = 'idle' | 'solved' | 'step'

const DEFAULT_VERTICES: VertexNode[] = [
  { id: 'A', heuristic: 5, x: 100, y: 180 },
  { id: 'B', heuristic: 3, x: 300, y: 80  },
  { id: 'C', heuristic: 4, x: 300, y: 280 },
  { id: 'D', heuristic: 2, x: 500, y: 100 },
  { id: 'E', heuristic: 0, x: 680, y: 180 },
]
const DEFAULT_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', cost: 1 },
  { from: 'A', to: 'C', cost: 4 },
  { from: 'B', to: 'D', cost: 1 },
  { from: 'C', to: 'D', cost: 2 },
  { from: 'D', to: 'E', cost: 1 },
  { from: 'C', to: 'E', cost: 5 },
]

function layoutVertices(count: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const cols = Math.ceil(Math.sqrt(count))
  for (let i = 0; i < count; i++) {
    positions.push({
      x: 80 + (i % cols) * 160,
      y: 80 + Math.floor(i / cols) * 120,
    })
  }
  return positions
}

export function AStarPage() {
  const { astarService } = useServices()

  const [vertices, setVertices] = useState<VertexNode[]>(DEFAULT_VERTICES)
  const [edges, setEdges] = useState<GraphEdge[]>(DEFAULT_EDGES)
  const [start, setStart] = useState('A')
  const [goal, setGoal] = useState('E')

  const [mode, setMode] = useState<Mode>('idle')
  const [result, setResult] = useState<AStarResult | null>(null)
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
      if (!r || idx >= r.steps.length - 1) {
        setAutoPlay(false)
        return
      }
      setStepIndex(i => i + 1)
    }, autoPlaySpeed)
    return () => clearInterval(id)
  }, [autoPlay, autoPlaySpeed, mode, result])

  // ── Vertex state computation ─────────────────────────────────────────────────
  const vertexStates: Record<string, VertexState> = {}
  const solutionPath: string[] = []

  if (result && (mode === 'solved' || mode === 'step')) {
    const effectiveIndex = mode === 'solved' ? result.steps.length - 1 : stepIndex
    const visibleSteps = result.steps.slice(0, effectiveIndex + 1)
    const currentStep = visibleSteps[visibleSteps.length - 1]

    if (currentStep) {
      for (const id of currentStep.closedSet) vertexStates[id] = 'expanded'
      for (const fe of currentStep.frontierSnapshot) {
        if (!(fe.vertexId in vertexStates)) vertexStates[fe.vertexId] = 'in-frontier'
      }
      vertexStates[currentStep.vertexId] = currentStep.action === 'GOAL_REACHED' ? 'goal' : 'current'
    }

    if (currentStep?.action === 'GOAL_REACHED' || mode === 'solved') {
      for (const id of result.solutionPath) solutionPath.push(id)
    }
  }

  // ── Graph edit handlers ──────────────────────────────────────────────────────
  function handleAddVertex(id: string, heuristic: number) {
    if (vertices.find(v => v.id === id)) return
    const pos = layoutVertices(vertices.length + 1)[vertices.length]
    setVertices(vs => [...vs, { id, heuristic, ...pos }])
    resetResult()
  }

  function handleRemoveVertex(id: string) {
    setVertices(vs => vs.filter(v => v.id !== id))
    setEdges(es => es.filter(e => e.from !== id && e.to !== id))
    resetResult()
  }

  function handleAddEdge(from: string, to: string, cost: number) {
    if (!vertices.find(v => v.id === from) || !vertices.find(v => v.id === to)) {
      setError(`Vertex '${from}' or '${to}' does not exist`)
      return
    }
    setEdges(es => [...es, { from, to, cost }])
    resetResult()
  }

  function handleRemoveEdge(index: number) {
    setEdges(es => es.filter((_, i) => i !== index))
    resetResult()
  }

  function handleVertexDrag(id: string, x: number, y: number) {
    setVertices(vs => vs.map(v => v.id === id ? { ...v, x, y } : v))
  }

  function resetResult() {
    setMode('idle'); setResult(null); setStepIndex(0); setAutoPlay(false); setError(null)
  }

  // ── API calls ────────────────────────────────────────────────────────────────
  async function handleSolve() {
    setLoading(true); setError(null); resetResult()
    try {
      const res = await astarService.solve(
        vertices.map(v => ({ id: v.id, heuristic: v.heuristic })),
        edges.map(e => ({ from_vertex: e.from, to_vertex: e.to, cost: e.cost })),
        start,
        goal,
      )
      setResult(res); setMode('solved')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally { setLoading(false) }
  }

  function handleStartStep() {
    if (!result) {
      handleSolveForStep()
    } else {
      setMode('step'); setStepIndex(0); setAutoPlay(false)
    }
  }

  async function handleSolveForStep() {
    setLoading(true); setError(null)
    try {
      const res = await astarService.solve(
        vertices.map(v => ({ id: v.id, heuristic: v.heuristic })),
        edges.map(e => ({ from_vertex: e.from, to_vertex: e.to, cost: e.cost })),
        start,
        goal,
      )
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
  const currentFrontier = currentStep?.frontierSnapshot ?? []
  const isDone = mode === 'step' && result !== null && stepIndex >= result.steps.length - 1

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
          <span className="text-neutral-300">A* Pathfinding</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <Text variant="h2" color="default">A* Pathfinding</Text>
          <Text variant="small" color="muted">
            f(n) = g(n) + h(n) — optimal search with closed set, goal-pop termination, and step-by-step frontier trace
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
                { color: 'rgba(99,102,241,0.65)', label: 'In frontier' },
                { color: 'rgba(34,197,94,0.55)',  label: 'Expanded' },
                { color: 'rgba(99,102,241,0.9)',  label: 'Solution path' },
                { color: 'rgba(239,68,68,0.7)',   label: 'Goal' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <Text variant="caption" color="muted">{label}</Text>
                </div>
              ))}
              <Text variant="caption" color="muted" className="mt-1">Drag vertices to reposition them.</Text>
            </div>
          </Card>

          {/* ── Right panel ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Graph visualization */}
            <GraphCanvas
              vertices={vertices} edges={edges}
              vertexStates={vertexStates} solutionPath={solutionPath}
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
                      {currentStep && ` — expanding ${currentStep.vertexId}`}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <>
                        <Button variant="primary" size="sm" onClick={handleNextStep}>
                          Next →
                        </Button>
                        <Button
                          variant={autoPlay ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => setAutoPlay(v => !v)}
                        >
                          {autoPlay ? '⏸ Pause' : '▶ Auto'}
                        </Button>
                      </>
                    )}
                    {isDone && (
                      <span className="text-green-400 text-sm font-semibold">
                        ✓ {result.steps[result.steps.length - 1]?.action === 'GOAL_REACHED' ? 'Goal reached' : 'Complete'}
                      </span>
                    )}
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

            {/* Solution result */}
            {result && (mode === 'solved' || isDone) && result.solutionPath.length > 0 && (
              <Card padding="md" className="flex flex-col gap-3">
                <Text variant="h4" color="default">Solution</Text>
                <div className="flex items-center gap-2 flex-wrap">
                  {result.solutionPath.map((id, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-300 font-mono text-sm font-bold">
                        {id}
                      </span>
                      {i < result.solutionPath.length - 1 && (
                        <span className="text-neutral-500">→</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <Text variant="caption" color="muted">Total cost</Text>
                    <Text variant="small" weight="semibold" color="default" className="font-mono">{result.totalCost}</Text>
                  </div>
                  <div>
                    <Text variant="caption" color="muted">Vertices expanded</Text>
                    <Text variant="small" weight="semibold" color="default" className="font-mono">{result.verticesExpanded}</Text>
                  </div>
                </div>
              </Card>
            )}

            {/* Frontier + cost table */}
            {result && mode !== 'idle' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="md">
                  <FrontierPanel frontier={currentFrontier} />
                </Card>
                <Card padding="md">
                  <CostTable steps={result.steps} currentStepIndex={mode === 'solved' ? result.steps.length - 1 : stepIndex} />
                </Card>
              </div>
            )}

            {/* Idle placeholder */}
            {mode === 'idle' && (
              <Card padding="md" className="flex flex-col items-center gap-3 py-12">
                <Text variant="body" color="muted" className="text-center">
                  Build a weighted directed graph, set heuristics per vertex, then click{' '}
                  <strong className="text-neutral-200">Run All</strong> for the full result or{' '}
                  <strong className="text-neutral-200">Step Mode</strong> to advance one expansion at a time.
                </Text>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
