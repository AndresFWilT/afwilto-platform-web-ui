import { computeTreeLayout } from './tree-layout'
import type { SpanningTreeNode } from '@/application/ports/IGraphTraversalService'
import type { LayoutNode } from './tree-layout'

const VERTEX_R = 14
const PAD_X    = 24
const PAD_Y    = 20

// Dark-on-light colors (light canvas exception §4.5)
const COLOR_EDGE   = 'rgba(24,29,53,0.2)'
const COLOR_FILL   = 'rgba(255,255,255,0.85)'
const COLOR_STROKE = 'rgba(0,0,0,0.18)'
const COLOR_LABEL  = 'rgba(24,29,53,0.85)'

interface SpanningTreeViewProps {
  root: SpanningTreeNode
  algorithm: 'BFS' | 'DFS'
}

function renderNodes(nodes: LayoutNode[], dx: number, dy: number): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  for (const node of nodes) {
    const x = node.x + dx
    const y = node.y + dy
    for (const child of node.children) {
      const cx = child.x + dx
      const cy = child.y + dy
      elements.push(
        <line key={`e-${node.vertex}-${child.vertex}`}
          x1={x} y1={y} x2={cx} y2={cy}
          stroke={COLOR_EDGE} strokeWidth={1.5}
        />
      )
    }
    elements.push(
      <g key={`v-${node.vertex}`}>
        <circle cx={x} cy={y} r={VERTEX_R}
          fill={COLOR_FILL} stroke={COLOR_STROKE} strokeWidth={1.5} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fill={COLOR_LABEL} fontSize={10} fontFamily="monospace" fontWeight="700">
          {node.vertex + 1}
        </text>
      </g>
    )
    elements.push(...renderNodes(node.children, dx, dy))
  }
  return elements
}

export function SpanningTreeView({ root, algorithm }: SpanningTreeViewProps) {
  const { tree, totalWidth, totalHeight } = computeTreeLayout(root)

  const svgW = totalWidth + PAD_X * 2
  const svgH = totalHeight + PAD_Y * 2

  // Shift so the root is horizontally centred in the SVG
  const dx = PAD_X + svgW / 2 - tree.x - PAD_X
  const dy = PAD_Y

  const label = algorithm === 'BFS'
    ? 'BFS tree — wide & shallow'
    : 'DFS tree — narrow & deep'

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: 'thin' }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ width: Math.max(svgW, 280), height: Math.max(svgH, 200), display: 'block' }}
        >
          {renderNodes([tree], dx, dy)}
        </svg>
      </div>
      <p style={{ color: 'rgba(58,77,174,0.6)', fontSize: 11, fontFamily: 'monospace', textAlign: 'center', marginTop: 4 }}>
        {label}
      </p>
    </div>
  )
}
