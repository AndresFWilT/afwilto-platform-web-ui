import { computeCircularLayout } from '../graph-algorithms/graph-layout'
import type { GraphEdge, MSTResult } from '@/application/ports/IGraphAlgoService'

const CANVAS_W = 560
const CANVAS_H = 320
const VERTEX_R  = 14

// Dark-on-light colors (light canvas exception §4.5)
const COLOR_EDGE_DEFAULT = 'rgba(24,29,53,0.2)'
const COLOR_EDGE_MST     = 'rgba(22,163,74,0.85)'
const COLOR_VERTEX_FILL  = 'rgba(255,255,255,0.85)'
const COLOR_VERTEX_STROKE = 'rgba(0,0,0,0.18)'
const COLOR_WEIGHT        = 'rgba(24,29,53,0.5)'
const COLOR_WEIGHT_MST    = 'rgba(22,163,74,0.85)'
const COLOR_LABEL         = 'rgba(24,29,53,0.85)'

interface KruskalGraphViewProps {
  vertexCount: number
  edges: GraphEdge[]
  result: MSTResult | null
}

function edgeKey(e: GraphEdge): string {
  return `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}-${e.weight}`
}

export function KruskalGraphView({ vertexCount: n, edges, result }: KruskalGraphViewProps) {
  const radius    = n <= 1 ? 0 : Math.min(CANVAS_W, CANVAS_H) * (n <= 4 ? 0.28 : 0.33)
  const positions = computeCircularLayout(n, CANVAS_W / 2, CANVAS_H / 2, radius)

  const mstKeys = new Set<string>()
  result?.edges.forEach(e => mstKeys.add(edgeKey(e)))

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {n === 0 && (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(58,77,174,0.5)" fontSize="13" fontFamily="monospace">
          Set vertices and add edges to start
        </text>
      )}

      {/* Undirected edges */}
      {edges.map((e, i) => {
        const p1 = positions[e.from], p2 = positions[e.to]
        if (!p1 || !p2 || e.from === e.to) return null
        const inMST  = mstKeys.has(edgeKey(e))
        const color  = inMST ? COLOR_EDGE_MST : COLOR_EDGE_DEFAULT
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
        return (
          <g key={i}>
            <line
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={color}
              strokeWidth={inMST ? 2.5 : 1.5}
            />
            <text
              x={mx} y={my - 5}
              textAnchor="middle"
              fill={inMST ? COLOR_WEIGHT_MST : COLOR_WEIGHT}
              fontSize={10} fontFamily="monospace"
              fontWeight={inMST ? '700' : '400'}
            >
              {e.weight}
            </text>
          </g>
        )
      })}

      {/* Vertices */}
      {positions.map(pos => (
        <g key={pos.id}>
          <circle
            cx={pos.x} cy={pos.y} r={VERTEX_R}
            fill={COLOR_VERTEX_FILL}
            stroke={COLOR_VERTEX_STROKE}
            strokeWidth={1.5}
          />
          <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
            fill={COLOR_LABEL} fontSize={10} fontFamily="monospace" fontWeight="700">
            {pos.id + 1}
          </text>
        </g>
      ))}

      {result && (
        <text x={CANVAS_W - 8} y={CANVAS_H - 8}
          textAnchor="end"
          fill={COLOR_EDGE_MST}
          fontSize={11} fontFamily="monospace" fontWeight="700">
          Total: {result.totalWeight}
        </text>
      )}
    </svg>
  )
}
