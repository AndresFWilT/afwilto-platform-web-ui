import { useRef, useCallback } from 'react'
import { Card } from '@afwilto/design-system'
import type { UnweightedEdge, UnweightedVertexNode, DFSVertexState } from './types'

const STATE_FILL: Record<DFSVertexState, string> = {
  'unvisited': 'rgba(148,163,184,0.25)',
  'in-stack':  'rgba(99,102,241,0.65)',
  'visited':   'rgba(34,197,94,0.55)',
  'current':   'rgba(245,158,11,0.85)',
  'goal':      'rgba(239,68,68,0.7)',
  'path':      'rgba(99,102,241,0.9)',
}
const STATE_STROKE: Record<DFSVertexState, string> = {
  'unvisited': 'rgba(148,163,184,0.4)',
  'in-stack':  'rgba(165,180,252,0.8)',
  'visited':   'rgba(134,239,172,0.8)',
  'current':   'rgba(252,211,77,1)',
  'goal':      'rgba(252,165,165,1)',
  'path':      'rgba(165,180,252,1)',
}

interface Props {
  vertices: UnweightedVertexNode[]
  edges: UnweightedEdge[]
  vertexStates: Record<string, DFSVertexState>
  pathToGoal: string[]
  onVertexDrag: (id: string, x: number, y: number) => void
}

const W = 800
const H = 360

export function GraphCanvas({ vertices, edges, vertexStates, pathToGoal, onVertexDrag }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<string | null>(null)

  const getState = (id: string): DFSVertexState => {
    if (pathToGoal.includes(id)) return 'path'
    return vertexStates[id] ?? 'unvisited'
  }

  const onMouseDown = useCallback((id: string) => { dragging.current = id }, [])
  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (W / rect.width)
    const y = (e.clientY - rect.top) * (H / rect.height)
    onVertexDrag(dragging.current, Math.max(20, Math.min(W - 20, x)), Math.max(20, Math.min(H - 20, y)))
  }, [onVertexDrag])
  const onMouseUp = useCallback(() => { dragging.current = null }, [])

  const pathEdges = new Set<string>()
  for (let i = 0; i < pathToGoal.length - 1; i++) {
    pathEdges.add(`${pathToGoal[i]}→${pathToGoal[i + 1]}`)
  }

  if (vertices.length === 0) {
    return (
      <Card padding="none" className="relative overflow-hidden w-full flex items-center justify-center"
        style={{ height: '360px', backgroundColor: 'var(--color-brand-50)' }}>
        <span style={{ color: 'var(--color-brand-500)', fontFamily: 'monospace', fontSize: '14px' }}>
          Add vertices to build the graph
        </span>
      </Card>
    )
  }

  return (
    <Card padding="none" className="relative overflow-hidden w-full" style={{ height: '360px', backgroundColor: 'var(--color-brand-50)' }}>
      <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: `${W}px`, height: '100%' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          >
            <defs>
              <marker id="dfs-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 8 3 L 0 6 Z" fill="rgba(24,29,53,0.4)" />
              </marker>
              <marker id="dfs-path-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 8 3 L 0 6 Z" fill="rgba(99,102,241,0.9)" />
              </marker>
            </defs>

            {edges.map((edge, i) => {
              const from = vertices.find(v => v.id === edge.from)
              const to = vertices.find(v => v.id === edge.to)
              if (!from || !to) return null
              const dx = to.x - from.x
              const dy = to.y - from.y
              const len = Math.sqrt(dx * dx + dy * dy)
              if (len === 0) return null
              const r = 20
              const tx = to.x - (dx / len) * (r + 2)
              const ty = to.y - (dy / len) * (r + 2)
              const isPath = pathEdges.has(`${edge.from}→${edge.to}`)
              return (
                <line key={i} x1={from.x} y1={from.y} x2={tx} y2={ty}
                  stroke={isPath ? 'rgba(99,102,241,0.85)' : 'rgba(24,29,53,0.25)'}
                  strokeWidth={isPath ? 3 : 1.5}
                  markerEnd={isPath ? 'url(#dfs-path-arr)' : 'url(#dfs-arr)'}
                />
              )
            })}

            {vertices.map(v => {
              const state = getState(v.id)
              return (
                <g key={v.id} style={{ cursor: 'grab' }} onMouseDown={() => onMouseDown(v.id)}>
                  <circle cx={v.x} cy={v.y} r={20}
                    fill={STATE_FILL[state]}
                    stroke={STATE_STROKE[state]}
                    strokeWidth={state === 'path' || state === 'current' ? 2.5 : 1.5}
                  />
                  <text x={v.x} y={v.y + 4} textAnchor="middle"
                    fill="rgba(0,0,0,0.85)" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {v.id}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </Card>
  )
}
