import { computeCircularLayout } from '../graph-algorithms/graph-layout'
import type { TraversalEdge } from '@/application/ports/IGraphTraversalService'

const CANVAS_W = 560
const CANVAS_H = 320
const VERTEX_R  = 14

// Dark-on-light colors (light canvas exception §4.5)
const COLOR_EDGE_DEFAULT  = 'rgba(24,29,53,0.18)'
const COLOR_EDGE_TREE_BFS = 'rgba(37,99,235,0.85)'
const COLOR_EDGE_TREE_DFS = 'rgba(22,163,74,0.85)'
const COLOR_VERTEX_FILL   = 'rgba(255,255,255,0.85)'
const COLOR_VERTEX_STROKE = 'rgba(0,0,0,0.18)'
const COLOR_SOURCE_STROKE = 'rgba(37,99,235,0.85)'
const COLOR_LABEL         = 'rgba(24,29,53,0.85)'

interface GraphCanvasProps {
  n: number
  adjacencyList: Record<number, number[]>
  spanningTreeEdges?: TraversalEdge[]
  algorithm?: 'BFS' | 'DFS'
  source?: number
}

function edgeKey(from: number, to: number): string {
  return `${from}->${to}`
}

export function GraphCanvas({ n, adjacencyList, spanningTreeEdges, algorithm, source }: GraphCanvasProps) {
  const radius    = n <= 1 ? 0 : Math.min(CANVAS_W, CANVAS_H) * (n <= 4 ? 0.3 : 0.35)
  const positions = computeCircularLayout(n, CANVAS_W / 2, CANVAS_H / 2, radius)

  const treeEdgeKeys = new Set<string>()
  spanningTreeEdges?.forEach(e => treeEdgeKeys.add(edgeKey(e.from, e.to)))

  const treeColor = algorithm === 'DFS' ? COLOR_EDGE_TREE_DFS : COLOR_EDGE_TREE_BFS

  // Arrow marker IDs must be unique per render
  const markerId        = 'gt-arrow-default'
  const markerTreeId    = 'gt-arrow-tree'

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={COLOR_EDGE_DEFAULT} />
        </marker>
        <marker id={markerTreeId} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={treeColor} />
        </marker>
      </defs>

      {n === 0 && (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(58,77,174,0.5)" fontSize="13" fontFamily="monospace">
          Set vertex count to start
        </text>
      )}

      {/* Directed edges */}
      {Array.from({ length: n }, (_, u) =>
        (adjacencyList[u] ?? []).map(v => {
          if (u === v) return null
          const p1 = positions[u], p2 = positions[v]
          if (!p1 || !p2) return null
          const isTree = treeEdgeKeys.has(edgeKey(u, v))
          const color  = isTree ? treeColor : COLOR_EDGE_DEFAULT
          const marker = isTree ? `url(#${markerTreeId})` : `url(#${markerId})`

          // Shorten line so arrowhead doesn't overlap vertex circle
          const dx = p2.x - p1.x, dy = p2.y - p1.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const ux = dx / len, uy = dy / len
          const x1 = p1.x + ux * VERTEX_R
          const y1 = p1.y + uy * VERTEX_R
          const x2 = p2.x - ux * (VERTEX_R + 2)
          const y2 = p2.y - uy * (VERTEX_R + 2)

          return (
            <line key={`${u}-${v}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth={isTree ? 2.5 : 1.5}
              markerEnd={marker}
            />
          )
        })
      )}

      {/* Vertices */}
      {positions.map(pos => {
        const isSource = source !== undefined && pos.id === source
        return (
          <g key={pos.id}>
            <circle
              cx={pos.x} cy={pos.y} r={VERTEX_R}
              fill={COLOR_VERTEX_FILL}
              stroke={isSource ? COLOR_SOURCE_STROKE : COLOR_VERTEX_STROKE}
              strokeWidth={isSource ? 2.5 : 1.5}
            />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
              fill={COLOR_LABEL} fontSize={10} fontFamily="monospace" fontWeight="700">
              {pos.id + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
