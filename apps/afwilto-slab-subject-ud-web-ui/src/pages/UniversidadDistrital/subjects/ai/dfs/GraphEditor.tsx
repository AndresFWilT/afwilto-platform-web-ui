import { useState } from 'react'
import { Button, Input, Text } from '@afwilto/design-system'
import type { UnweightedEdge, UnweightedVertexNode } from './types'

interface Props {
  vertices: UnweightedVertexNode[]
  edges: UnweightedEdge[]
  start: string
  goal: string
  loading: boolean
  onAddVertex: (id: string) => void
  onRemoveVertex: (id: string) => void
  onAddEdge: (from: string, to: string) => void
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
  const [eFrom, setEFrom] = useState('')
  const [eTo, setETo] = useState('')

  function handleAddVertex() {
    if (!newId.trim()) return
    onAddVertex(newId.trim().toUpperCase())
    setNewId('')
  }

  function handleAddEdge() {
    if (!eFrom.trim() || !eTo.trim()) return
    onAddEdge(eFrom.trim().toUpperCase(), eTo.trim().toUpperCase())
    setEFrom('')
    setETo('')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Add vertex */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Add Vertex</Text>
        <div className="flex gap-2">
          <Input inputSize="sm" placeholder="ID" value={newId} onChange={e => setNewId(e.target.value)} className="flex-1" />
          <Button variant="secondary" size="sm" onClick={handleAddVertex}>+</Button>
        </div>

        {vertices.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vertices.map(v => (
              <span key={v.id} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-surface-overlay text-neutral-200">
                {v.id}
                <button onClick={() => onRemoveVertex(v.id)} className="text-neutral-500 hover:text-red-400 transition-colors ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add edge */}
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Add Edge</Text>
        <div className="flex gap-2">
          <Input inputSize="sm" placeholder="From" value={eFrom} onChange={e => setEFrom(e.target.value)} className="flex-1" />
          <Input inputSize="sm" placeholder="To" value={eTo} onChange={e => setETo(e.target.value)} className="flex-1" />
          <Button variant="secondary" size="sm" onClick={handleAddEdge}>+</Button>
        </div>

        {edges.length > 0 && (
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
            {edges.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <span>{e.from}→{e.to}</span>
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
            <Text variant="caption" color="muted">Goal (optional)</Text>
            <Input inputSize="sm" placeholder="—" value={goal} onChange={e => onGoalChange(e.target.value.toUpperCase())} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" fullWidth loading={loading} onClick={onSolve}
          disabled={vertices.length < 1}>
          Run All
        </Button>
        <Button variant="secondary" size="sm" fullWidth onClick={onStartStep}
          disabled={vertices.length < 1 || loading}>
          Step Mode
        </Button>
      </div>
    </div>
  )
}
