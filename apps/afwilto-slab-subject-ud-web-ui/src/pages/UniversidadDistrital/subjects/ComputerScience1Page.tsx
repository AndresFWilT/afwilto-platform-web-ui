import { useState, useEffect, useMemo, useCallback } from 'react'
import { Text, Button, Input, Badge, Spinner, Alert, Card } from '@afwilto/design-system'
import { useServices } from '@/di'
import { SubjectPage } from '@/pages/Subject'
import type {
  NodeSnapshot,
  SnapshotResponse,
  SearchResponse,
  TraversalResponse,
  ExtremesResponse,
  TraversalOrder,
} from '@/application/ports/IRBTService'

// ── Page entry point ──────────────────────────────────────────────────────────

export function ComputerScience1Page() {
  return (
    <SubjectPage university="distrital" slug="computer-science-1">
      <RBTVisualizer />
    </SubjectPage>
  )
}

// ── Tree layout ───────────────────────────────────────────────────────────────

const NODE_R   = 22
const H_GAP    = 64
const V_GAP    = 84
const PADDING  = 40

interface LayoutNode {
  key:   number
  color: 'red' | 'black'
  xIdx:  number
  depth: number
  left:  LayoutNode | null
  right: LayoutNode | null
}

function buildLayout(root: NodeSnapshot | null): {
  tree: LayoutNode | null
  svgW: number
  svgH: number
  maxDepth: number
} {
  if (!root) return { tree: null, svgW: 320, svgH: 160, maxDepth: 0 }

  let idx = 0
  let maxDepth = 0

  function assign(node: NodeSnapshot | undefined, depth: number): LayoutNode | null {
    if (!node) return null
    const left  = assign(node.left,  depth + 1)
    const xIdx  = idx++
    const right = assign(node.right, depth + 1)
    if (depth > maxDepth) maxDepth = depth
    return { key: node.key, color: node.color, xIdx, depth, left, right }
  }

  const tree = assign(root, 0)
  const totalCols = idx
  const svgW = Math.max(320, totalCols * H_GAP + PADDING * 2)
  const svgH = Math.max(160, (maxDepth + 1) * V_GAP + PADDING * 2)

  return { tree, svgW, svgH, maxDepth }
}

function px(node: LayoutNode) {
  return PADDING + node.xIdx * H_GAP + H_GAP / 2
}

function py(node: LayoutNode) {
  return PADDING + node.depth * V_GAP + NODE_R
}

// ── SVG rendering helpers ─────────────────────────────────────────────────────

interface EdgeData { x1: number; y1: number; x2: number; y2: number; key: string }
interface NodeData { node: LayoutNode; x: number; y: number }

function collectEdges(n: LayoutNode | null, acc: EdgeData[] = []): EdgeData[] {
  if (!n) return acc
  const x = px(n); const y = py(n)
  if (n.left)  { acc.push({ x1: x, y1: y, x2: px(n.left),  y2: py(n.left),  key: `e-${n.key}-L` }); collectEdges(n.left,  acc) }
  if (n.right) { acc.push({ x1: x, y1: y, x2: px(n.right), y2: py(n.right), key: `e-${n.key}-R` }); collectEdges(n.right, acc) }
  return acc
}

function collectNodes(n: LayoutNode | null, acc: NodeData[] = []): NodeData[] {
  if (!n) return acc
  collectNodes(n.left,  acc)
  acc.push({ node: n, x: px(n), y: py(n) })
  collectNodes(n.right, acc)
  return acc
}

// ── RBT Canvas (SVG) ──────────────────────────────────────────────────────────

const RED_FILL   = '#C41E3A'
const BLACK_FILL = '#0a0a0a'
const HIGHLIGHT  = '#FFD100'

function RBTCanvas({
  snapshot,
  highlightKey,
}: {
  snapshot: SnapshotResponse
  highlightKey: number | undefined
}) {
  const { tree, svgW, svgH } = useMemo(
    () => buildLayout(snapshot.root),
    [snapshot]
  )

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="text-5xl opacity-40">🌳</span>
        <Text variant="body" className="text-brand-500">
          Tree is empty — insert a key to begin.
        </Text>
      </div>
    )
  }

  const edges = collectEdges(tree)
  const nodes = collectNodes(tree)

  return (
    <div className="overflow-x-auto overflow-y-hidden w-full">
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        aria-label="Red-Black Tree visualisation"
        className="block"
      >
        {/* Edges */}
        {edges.map(e => (
          <line
            key={e.key}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="rgba(24,29,53,0.25)"
            strokeWidth={2}
          />
        ))}

        {/* Nodes */}
        {nodes.map(({ node, x, y }) => {
          const highlighted = node.key === highlightKey
          const fill = node.color === 'red' ? RED_FILL : BLACK_FILL
          return (
            <g key={node.key}>
              {highlighted && (
                <circle cx={x} cy={y} r={NODE_R + 6} fill="none" stroke={HIGHLIGHT} strokeWidth={3} opacity={0.9} />
              )}
              <circle
                cx={x} cy={y} r={NODE_R}
                fill={fill}
                stroke={highlighted ? HIGHLIGHT : 'rgba(0,0,0,0.18)'}
                strokeWidth={highlighted ? 2 : 1}
              />
              <text
                x={x} y={y}
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize={node.key > 99 ? 11 : 13}
                fontWeight="700"
                fontFamily="monospace"
              >
                {node.key}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Control panel ─────────────────────────────────────────────────────────────

interface ControlPanelProps {
  loading: boolean
  onInsert: (key: number) => void
  onDelete: (key: number) => void
  onSearch: (key: number) => void
  onTraversal: (order: TraversalOrder) => void
}

function ControlPanel({ loading, onInsert, onDelete, onSearch, onTraversal }: ControlPanelProps) {
  const [insertVal, setInsertVal]   = useState('')
  const [deleteVal, setDeleteVal]   = useState('')
  const [searchVal, setSearchVal]   = useState('')
  const [traversal, setTraversal]   = useState<TraversalOrder>('inorder')

  function submit(val: string, fn: (k: number) => void, clear: () => void) {
    const k = parseInt(val)
    if (isNaN(k)) return
    fn(k)
    clear()
  }

  function onKey(e: React.KeyboardEvent, val: string, fn: (k: number) => void, clear: () => void) {
    if (e.key === 'Enter') submit(val, fn, clear)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Insert */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Insert</Text>
        <div className="flex gap-2">
          <Input
            inputSize="sm"
            placeholder="key…"
            value={insertVal}
            onChange={e => setInsertVal(e.target.value)}
            onKeyDown={e => onKey(e, insertVal, onInsert, () => setInsertVal(''))}
            disabled={loading}
            type="number"
            className="w-full"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => submit(insertVal, onInsert, () => setInsertVal(''))}
            disabled={loading || !insertVal}
          >
            +
          </Button>
        </div>
      </div>

      {/* Delete */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Delete</Text>
        <div className="flex gap-2">
          <Input
            inputSize="sm"
            placeholder="key…"
            value={deleteVal}
            onChange={e => setDeleteVal(e.target.value)}
            onKeyDown={e => onKey(e, deleteVal, onDelete, () => setDeleteVal(''))}
            disabled={loading}
            type="number"
            className="w-full"
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => submit(deleteVal, onDelete, () => setDeleteVal(''))}
            disabled={loading || !deleteVal}
          >
            −
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Search</Text>
        <div className="flex gap-2">
          <Input
            inputSize="sm"
            placeholder="key…"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => onKey(e, searchVal, onSearch, () => {})}
            disabled={loading}
            type="number"
            className="w-full"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => submit(searchVal, onSearch, () => {})}
            disabled={loading || !searchVal}
          >
            ?
          </Button>
        </div>
      </div>

      {/* Traversal */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Traversal</Text>
        <div className="flex gap-2">
          <select
            value={traversal}
            onChange={e => setTraversal(e.target.value as TraversalOrder)}
            disabled={loading}
            className="flex-1 bg-brand-800 border border-surface-border text-neutral-100 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:border-primary-400"
          >
            <option value="inorder">In-Order</option>
            <option value="preorder">Pre-Order</option>
            <option value="postorder">Post-Order</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTraversal(traversal)}
            disabled={loading}
          >
            ▶
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function TreeStats({
  size,
  extremes,
  searchResult,
}: {
  size: number
  extremes: ExtremesResponse | null
  searchResult: SearchResponse | null
}) {
  return (
    <div className="flex flex-wrap items-center gap-6 px-1">
      <Stat label="Nodes" value={String(size)} />
      {extremes && size > 0 && (
        <>
          <Stat label="Min" value={String(extremes.min)} />
          <Stat label="Max" value={String(extremes.max)} />
        </>
      )}
      {searchResult && (
        <div className="flex items-center gap-2 ml-auto">
          <Text variant="caption" color="muted">Search {searchResult.key}:</Text>
          <Badge variant={searchResult.found ? 'success' : 'error'} size="sm">
            {searchResult.found ? '✓ Found' : '✕ Not found'}
          </Badge>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">{label}</Text>
      <Text variant="small" weight="bold" color="primary">{value}</Text>
    </div>
  )
}

// ── Traversal result display ──────────────────────────────────────────────────

function TraversalDisplay({ result }: { result: TraversalResponse }) {
  const labels: Record<string, string> = {
    inorder:   'In-Order (L → Root → R)',
    preorder:  'Pre-Order (Root → L → R)',
    postorder: 'Post-Order (L → R → Root)',
  }
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text variant="small" weight="semibold" color="muted">
        {labels[result.order] ?? result.order}
      </Text>
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {result.keys.map((k, i) => (
          <span key={`${k}-${i}`} className="flex items-center gap-1">
            <span className="font-mono text-sm text-neutral-100 bg-brand-800 border border-surface-border px-2 py-0.5 rounded-md">
              {k}
            </span>
            {i < result.keys.length - 1 && (
              <span className="text-neutral-600 text-xs">→</span>
            )}
          </span>
        ))}
        {result.keys.length === 0 && (
          <Text variant="small" color="muted">Tree is empty</Text>
        )}
      </div>
    </Card>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">Legend</Text>
      <div className="flex items-center gap-2">
        <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#C41E3A' }} />
        <Text variant="caption" color="muted">Red node</Text>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.15)' }} />
        <Text variant="caption" color="muted">Black node</Text>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-4 h-4 rounded-full border-2" style={{ borderColor: '#FFD100' }} />
        <Text variant="caption" color="muted">Search result</Text>
      </div>
    </div>
  )
}

// ── Main visualizer (orchestrates state + API calls) ──────────────────────────

function RBTVisualizer() {
  const { rbtService } = useServices()

  const [snapshot,      setSnapshot]      = useState<SnapshotResponse>({ root: null, size: 0 })
  const [extremes,      setExtremes]      = useState<ExtremesResponse | null>(null)
  const [searchResult,  setSearchResult]  = useState<SearchResponse | null>(null)
  const [traversalResult, setTraversalResult] = useState<TraversalResponse | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const refreshTree = useCallback(async () => {
    const snap = await rbtService.getTree()
    setSnapshot(snap)
    if (snap.size > 0) {
      const ext = await rbtService.getExtremes()
      setExtremes(ext)
    } else {
      setExtremes(null)
    }
  }, [rbtService])

  useEffect(() => {
    withLoading(refreshTree)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function withLoading(fn: () => Promise<void>) {
    setLoading(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  function handleInsert(key: number) {
    withLoading(async () => {
      await rbtService.insert(key)
      setSearchResult(null)
      setTraversalResult(null)
      await refreshTree()
    })
  }

  function handleDelete(key: number) {
    withLoading(async () => {
      await rbtService.delete(key)
      if (searchResult?.key === key) setSearchResult(null)
      setTraversalResult(null)
      await refreshTree()
    })
  }

  function handleSearch(key: number) {
    withLoading(async () => {
      const result = await rbtService.search(key)
      setSearchResult(result)
    })
  }

  function handleTraversal(order: TraversalOrder) {
    withLoading(async () => {
      const result = await rbtService.traversal(order)
      setTraversalResult(result)
    })
  }

  const highlightKey = searchResult?.found ? searchResult.key : undefined

  return (
    <div className="flex flex-col gap-5">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Red-Black Tree</Text>
        <Badge variant="neutral" size="sm">Interactive</Badge>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Card padding="md">
        <ControlPanel
          loading={loading}
          onInsert={handleInsert}
          onDelete={handleDelete}
          onSearch={handleSearch}
          onTraversal={handleTraversal}
        />
      </Card>

      {/* Canvas card — brand-50 background so black nodes read as black */}
      <Card
        padding="none"
        className="relative overflow-hidden"
        style={{ minHeight: '280px', backgroundColor: 'var(--color-brand-50)' }}
      >
        {/* Loading overlay */}
        {loading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand-50) 75%, transparent)' }}
          >
            <Spinner size="lg" />
          </div>
        )}
        <div className="p-4">
          <RBTCanvas snapshot={snapshot} highlightKey={highlightKey} />
        </div>
      </Card>

      {/* Stats + Legend row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <TreeStats size={snapshot.size} extremes={extremes} searchResult={searchResult} />
        <Legend />
      </div>

      {/* Traversal result */}
      {traversalResult && <TraversalDisplay result={traversalResult} />}
    </div>
  )
}
