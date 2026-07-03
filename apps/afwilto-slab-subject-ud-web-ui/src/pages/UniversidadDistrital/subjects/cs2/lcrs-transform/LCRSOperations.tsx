import { useState } from 'react'
import { Card, Text, Button } from '@afwilto/design-system'
import type { BinaryTraversalOrder } from '@/application/ports/ILCRSService'

interface LCRSOperationsProps {
  hasBinaryTree: boolean
  disabled: boolean
  onTransform: () => void
  onShortestPath: () => void
  onTraverse: (order: BinaryTraversalOrder) => void
}

const ORDERS: BinaryTraversalOrder[] = ['PREORDER', 'INORDER', 'POSTORDER', 'BFS']

export function LCRSOperations({ hasBinaryTree, disabled, onTransform, onShortestPath, onTraverse }: LCRSOperationsProps) {
  const [selectedOrder, setSelectedOrder] = useState<BinaryTraversalOrder>('PREORDER')

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">Operations</Text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Transform</Text>
          <Button variant="primary" disabled={disabled} onClick={onTransform}>
            N-ary → Binary (LCRS)
          </Button>
          <Text variant="caption" color="muted">Convert the N-ary tree to LCRS binary representation.</Text>
        </div>

        <div className="flex flex-col gap-2">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Shortest Path</Text>
          <Button variant="secondary" disabled={disabled} onClick={onShortestPath}>
            Find Shortest Leaf Path
          </Button>
          <Text variant="caption" color="muted">Minimum root-to-leaf edge-weight sum.</Text>
        </div>

        <div className="flex flex-col gap-2">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Traverse Binary</Text>
          <div className="flex flex-wrap gap-1">
            {ORDERS.map((o) => (
              <Button
                key={o}
                variant={selectedOrder === o ? 'primary' : 'ghost'}
                size="sm"
                disabled={disabled}
                onClick={() => setSelectedOrder(o)}
              >
                {o === 'BFS' ? 'BFS' : o.charAt(0) + o.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" disabled={disabled || !hasBinaryTree} onClick={() => onTraverse(selectedOrder)}>
            Traverse
          </Button>
        </div>
      </div>
    </Card>
  )
}
