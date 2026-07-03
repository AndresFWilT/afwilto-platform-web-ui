import { useState, useCallback } from 'react'
import { Text, Alert, Badge, Spinner, Card } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { NaryTreeEditor } from './NaryTreeEditor'
import { LCRSOperations } from './LCRSOperations'
import { DualTreeVisualizer } from './DualTreeVisualizer'
import { ShortestPathResult } from './ShortestPathResult'
import type {
  NaryTree,
  BinaryTree,
  ShortestPathInfo,
  BinaryTraversalOrder,
} from '@/application/ports/ILCRSService'

const PROJECT = CS2_PROJECTS.find((p) => p.slug === 'lcrs-transform')!

export function LCRSTransformPage() {
  const { lcrsService } = useServices()

  const [naryTree, setNaryTree] = useState<NaryTree | null>(null)
  const [binaryTree, setBinaryTree] = useState<BinaryTree | null>(null)
  const [shortestPath, setShortestPath] = useState<ShortestPathInfo | null>(null)
  const [traversal, setTraversal] = useState<{ order: string; sequence: { label: string; weight: number }[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTreeChange = useCallback((tree: NaryTree) => {
    setNaryTree(tree)
    setBinaryTree(null)
    setShortestPath(null)
    setTraversal(null)
    setError(null)
  }, [])

  const run = useCallback(async (op: () => Promise<void>) => {
    setLoading(true)
    setError(null)
    try {
      await op()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTransform = useCallback(() => {
    if (!naryTree) return
    run(async () => {
      const result = await lcrsService.transform(naryTree)
      setBinaryTree(result.binaryTree)
      setShortestPath(null)
      setTraversal(null)
    })
  }, [naryTree, lcrsService, run])

  const handleShortestPath = useCallback(() => {
    if (!naryTree) return
    run(async () => {
      const result = await lcrsService.shortestPath(naryTree)
      setBinaryTree(result.binaryTree)
      setShortestPath(result.shortestPath)
      setTraversal(null)
    })
  }, [naryTree, lcrsService, run])

  const handleTraverse = useCallback((order: BinaryTraversalOrder) => {
    if (!binaryTree) return
    run(async () => {
      const result = await lcrsService.traverse(binaryTree, order)
      setTraversal({ order: result.order, sequence: result.sequence })
      setShortestPath(null)
    })
  }, [binaryTree, lcrsService, run])

  return (
    <CS2ProjectPage project={PROJECT}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">LCRS Transformation</Text>
          <Badge variant="primary" size="sm">Live</Badge>
        </div>
        <Text variant="caption" color="muted">
          Left-Child Right-Sibling encoding converts any N-ary tree into a binary tree where
          left = first child and right = next sibling. Solid edges are parent→child; dashed edges are siblings.
        </Text>

        <NaryTreeEditor disabled={loading} onTreeChange={handleTreeChange} />

        <LCRSOperations
          hasBinaryTree={binaryTree !== null}
          disabled={loading || !naryTree}
          onTransform={handleTransform}
          onShortestPath={handleShortestPath}
          onTraverse={handleTraverse}
        />

        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && (
          <Card padding="md" className="flex items-center justify-center" style={{ height: 64 }}>
            <Spinner size="md" />
          </Card>
        )}

        <DualTreeVisualizer
          naryTree={naryTree}
          binaryTree={binaryTree}
          shortestPath={shortestPath?.path ?? null}
        />

        <ShortestPathResult result={shortestPath} traversal={traversal} />
      </div>
    </CS2ProjectPage>
  )
}
