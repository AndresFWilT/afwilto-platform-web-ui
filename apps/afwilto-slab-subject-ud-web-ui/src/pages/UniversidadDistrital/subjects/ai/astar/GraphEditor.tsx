import { useState } from 'react'
import { Button, Input, Text } from '@afwilto/design-system'
import type { GraphEdge, VertexNode } from './types'

interface Props {
  vertices: VertexNode[]
  edges: GraphEdge[]
  start: string
  goal: string
  loading: boolean
  onAddVertex: (id: string, heuristic: number) => void
  onRemoveVertex: (id: string) => void
  onAddEdge: (from: string, to: string, cost: number) => void
  onRemoveEdge: (index: number) => void
  onStartChange: (v: string) => void
  onGoalChange: (v: string) => void
  onSolve: () => void
  onStartStep: () => void
}

export function GraphEditor({
  vertices, edges, start, goal, loading,
  onAddVertex, onRemoveVertex, onAddEdge, onRemoveEdge,
  onStartChange, onGoalChange, onSolve, onStartStep,
}: Props) {
  const [newId, setNewId] = useState('')
  const [newH, setNewH] = useState('')
  const [eFrom, setEFrom] = useState('')
  const [eTo, setETo] = useState('')
  const [eCost, setECost] = useState('')

  function handleAddVertex() {
    const h = parseFloat(newH)
    if (!newId.trim() || isNaN(h)) return
    onAddVertex(newId.trim().toUpperCase(), h)
    setNewId('')
    setNewH('')
  }

  function handleAddEdge() {
    const cost = parseFloat(eCost)
    if (!eFrom.trim() || !eTo.trim() || isNaN(cost) || cost < 0) return
    onAddEdge(eFrom.trim().toUpperCase(), eTo.trim().toUpperCase(), cost)
    setEFrom('')
    setETo('')
    setECost('')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Add vertex */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Add Vertex</Text>
        <div className="flex gap-2">
          <Input
            inputSize="sm" placeholder="ID" value={newId}
            onChange={e => setNewId(e.target.value)}
            className="w-16"
          />
          <Input
            inputSize="sm" placeholder="h(n)" value={newH}
            onChange={e => setNewH(e.target.value)}
            className="w-20"
          />
          <Button variant="secondary" size="sm" onClick={handleAddVertex}>+</Button>
        </div>

        {vertices.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vertices.map(v => (
              <span
                key={v.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-surface-overlay text-neutral-200"
              >
                {v.id}
                <span className="text-neutral-500">h={v.heuristic}</span>
                <button
                  onClick={() => onRemoveVertex(v.id)}
                  className="text-neutral-500 hover:text-red-400 transition-colors ml-0.5"
                >×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add edge */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Add Edge</Text>
        <div className="flex gap-2 flex-wrap">
          <Input inputSize="sm" placeholder="From" value={eFrom} onChange={e => setEFrom(e.target.value)} className="w-16" />
          <Input inputSize="sm" placeholder="To" value={eTo} onChange={e => setETo(e.target.value)} className="w-16" />
          <Input inputSize="sm" placeholder="Cost" value={eCost} onChange={e => setECost(e.target.value)} className="w-16" />
          <Button variant="secondary" size="sm" onClick={handleAddEdge}>+</Button>
        </div>

        {edges.length > 0 && (
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
            {edges.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <span>{e.from}→{e.to}</span>
                <span className="text-neutral-500">cost={e.cost}</span>
                <button onClick={() => onRemoveEdge(i)} className="text-neutral-600 hover:text-red-400 transition-colors">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start / goal */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Search</Text>
        <div className="flex gap-2">
          <div className="flex flex-col gap-0.5 flex-1">
            <Text variant="caption" color="muted">Start</Text>
            <Input inputSize="sm" value={start} onChange={e => onStartChange(e.target.value.toUpperCase())} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <Text variant="caption" color="muted">Goal</Text>
            <Input inputSize="sm" value={goal} onChange={e => onGoalChange(e.target.value.toUpperCase())} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" fullWidth loading={loading} onClick={onSolve}
          disabled={vertices.length < 2}>
          Run All
        </Button>
        <Button variant="secondary" size="sm" fullWidth onClick={onStartStep}
          disabled={vertices.length < 2 || loading}>
          Step Mode
        </Button>
      </div>
    </div>
  )
}
