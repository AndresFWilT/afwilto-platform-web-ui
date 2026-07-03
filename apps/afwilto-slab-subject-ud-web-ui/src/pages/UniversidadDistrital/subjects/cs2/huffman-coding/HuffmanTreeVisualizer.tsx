import { Text } from '@afwilto/design-system'
import type { HuffmanNode } from '@/application/ports/IHuffmanService'
import { layoutHuffmanTree, LAYOUT } from './huffman-layout'
import type { LayoutHuffmanNode } from './types'

interface HuffmanTreeVisualizerProps {
  root: HuffmanNode | null
  colorMap: Map<string, string>
}

const R = LAYOUT.NODE_RADIUS

export function HuffmanTreeVisualizer({ root, colorMap }: HuffmanTreeVisualizerProps) {
  const layout = layoutHuffmanTree(root)

  if (!layout.root) {
    return (
      <div className="flex h-full min-h-48 items-center justify-center">
        <Text variant="body" className="text-brand-400">Enter text and click Encode.</Text>
      </div>
    )
  }

  const edges: React.ReactNode[] = []
  const labels: React.ReactNode[] = []
  const nodes: React.ReactNode[] = []

  const walk = (node: LayoutHuffmanNode) => {
    const isLeaf = node.symbol !== null
    const fill = isLeaf ? (colorMap.get(node.symbol!) ?? '#3b82f6') : '#ffffff'

    if (node.left) {
      const mx = (node.x + node.left.x) / 2
      const my = (node.y + node.left.y) / 2
      edges.push(
        <line key={`el-${node.x}-${node.y}`}
          x1={node.x} y1={node.y + R} x2={node.left.x} y2={node.left.y - R}
          stroke="rgba(24,29,53,0.3)" strokeWidth={1.5} />
      )
      labels.push(
        <text key={`ll-${node.x}-${node.y}`} x={mx - 8} y={my}
          fontSize={11} fontWeight={700} fill="rgba(24,29,53,0.55)" fontFamily="monospace">0</text>
      )
      walk(node.left)
    }
    if (node.right) {
      const mx = (node.x + node.right.x) / 2
      const my = (node.y + node.right.y) / 2
      edges.push(
        <line key={`er-${node.x}-${node.y}`}
          x1={node.x} y1={node.y + R} x2={node.right.x} y2={node.right.y - R}
          stroke="rgba(24,29,53,0.3)" strokeWidth={1.5} />
      )
      labels.push(
        <text key={`lr-${node.x}-${node.y}`} x={mx + 4} y={my}
          fontSize={11} fontWeight={700} fill="rgba(24,29,53,0.55)" fontFamily="monospace">1</text>
      )
      walk(node.right)
    }

    nodes.push(
      <g key={`n-${node.x}-${node.y}`}>
        <circle cx={node.x} cy={node.y} r={R}
          fill={fill}
          stroke={isLeaf ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.18)'}
          strokeWidth={isLeaf ? 2 : 1.5}
          opacity={isLeaf ? 1 : 0.9}
        />
        <text x={node.x} y={node.y - (isLeaf ? 4 : 0)}
          textAnchor="middle" dominantBaseline="central"
          fontSize={isLeaf ? 14 : 11} fontWeight={700}
          fill={isLeaf ? '#ffffff' : '#181D35'}
          fontFamily="ui-monospace, monospace">
          {isLeaf ? node.symbol : node.frequency}
        </text>
        {isLeaf && (
          <text x={node.x} y={node.y + 7}
            textAnchor="middle" dominantBaseline="central"
            fontSize={9} fill="rgba(255,255,255,0.8)"
            fontFamily="ui-monospace, monospace">
            {node.frequency}
          </text>
        )}
      </g>
    )
  }

  walk(layout.root)

  return (
    <div className="overflow-auto" style={{ maxHeight: 480 }}>
      <div style={{ minWidth: layout.width, minHeight: layout.height }}>
        <svg width={layout.width} height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          aria-label="Huffman tree">
          {edges}
          {labels}
          {nodes}
        </svg>
      </div>
    </div>
  )
}
