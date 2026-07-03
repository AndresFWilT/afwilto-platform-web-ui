import { useMemo, type ReactElement } from 'react'
import type { HuffmanNode } from '@/application/ports/IEncodingService'
import { computeLayout, type LayoutNode } from './huffman-layout'

interface HuffmanTreeVisualizerProps {
  root: HuffmanNode
  colorMap: Map<string, string>
}

export function HuffmanTreeVisualizer({ root, colorMap }: HuffmanTreeVisualizerProps) {
  const layout = useMemo(() => computeLayout(root), [root])

  const edges: ReactElement[] = []
  const nodes: ReactElement[] = []

  function renderNode(n: LayoutNode): void {
    const isLeaf = n.node.symbol !== null
    const color  = isLeaf ? (colorMap.get(n.node.symbol!) ?? '#94a3b8') : undefined
    const r = layout.nodeR

    if (n.left)  renderEdge(n, n.left,  r)
    if (n.right) renderEdge(n, n.right, r)

    nodes.push(
      <g key={`n-${n.x}-${n.y}`}>
        <circle
          cx={n.x} cy={n.y} r={r}
          fill={isLeaf ? `${color}40` : 'rgba(255,255,255,0.07)'}
          stroke={isLeaf ? color : 'rgba(255,255,255,0.45)'}
          strokeWidth={isLeaf ? 2.5 : 1.5}
        />
        <text
          x={n.x} y={n.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isLeaf ? color : 'rgba(255,255,255,0.90)'}
          fontSize={isLeaf ? 13 : 11}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {isLeaf
            ? (n.node.symbol === ' ' ? '·' : n.node.symbol)
            : n.node.frequency}
        </text>
      </g>
    )

    if (n.left)  renderNode(n.left)
    if (n.right) renderNode(n.right)
  }

  function renderEdge(parent: LayoutNode, child: LayoutNode, r: number): void {
    const dx  = child.x - parent.x
    const dy  = child.y - parent.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const ux  = dx / len
    const uy  = dy / len
    const x1  = parent.x + ux * r
    const y1  = parent.y + uy * r
    const x2  = child.x  - ux * r
    const y2  = child.y  - uy * r
    const mx  = (x1 + x2) / 2
    const my  = (y1 + y2) / 2

    const is0 = child.edgeLabelFromParent === '0'

    edges.push(
      <g key={`e-${parent.x}-${parent.y}-${child.x}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <rect
          x={mx - 9} y={my - 9} width={18} height={18} rx={4}
          fill={is0 ? 'rgba(255,255,255,0.10)' : 'rgba(96,165,250,0.20)'}
          stroke={is0 ? 'rgba(255,255,255,0.25)' : 'rgba(96,165,250,0.50)'}
          strokeWidth={1}
        />
        <text x={mx} y={my}
          fill={is0 ? 'rgba(255,255,255,0.80)' : '#60a5fa'}
          fontSize={11} fontFamily="monospace" fontWeight="bold"
          textAnchor="middle" dominantBaseline="central">
          {child.edgeLabelFromParent}
        </text>
      </g>
    )
  }

  renderNode(layout.root)

  const minW = 400
  const w = Math.max(layout.width, minW)

  return (
    <div className="overflow-auto w-full" style={{ scrollbarWidth: 'thin' }}>
      <div style={{ minWidth: `${minW}px` }}>
        <svg
          viewBox={`0 0 ${w} ${layout.height}`}
          width={w}
          height={layout.height}
        >
          {edges}
          {nodes}
        </svg>
      </div>
    </div>
  )
}
