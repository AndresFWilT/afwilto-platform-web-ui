import { useState } from 'react'
import { Card, Text, Button, Input } from '@afwilto/design-system'
import type { TraversalOrder } from '@/application/ports/ITrieService'

interface TrieOperationsProps {
  disabled: boolean
  onSearch: (prefix: string) => void
  onTraverse: (order: TraversalOrder) => void
}

const ORDERS: TraversalOrder[] = ['PREORDER', 'INORDER', 'POSTORDER']

export function TrieOperations({ disabled, onSearch, onTraverse }: TrieOperationsProps) {
  const [prefix, setPrefix] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<TraversalOrder>('PREORDER')

  const handleSearch = () => {
    onSearch(prefix.toLowerCase())
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">Operations</Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Prefix Search</Text>
          <div className="flex gap-2">
            <Input
              inputSize="sm"
              placeholder="prefix e.g. he"
              value={prefix}
              disabled={disabled}
              onChange={(e) => setPrefix(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
          <Text variant="caption" color="muted">Empty prefix returns all words.</Text>
        </div>

        <div className="flex flex-col gap-2">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Traversal</Text>
          <div className="flex gap-2 flex-wrap">
            {ORDERS.map((order) => (
              <Button
                key={order}
                variant={selectedOrder === order ? 'primary' : 'ghost'}
                size="sm"
                disabled={disabled}
                onClick={() => setSelectedOrder(order)}
              >
                {order.charAt(0) + order.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={() => onTraverse(selectedOrder)}
          >
            Traverse
          </Button>
        </div>
      </div>
    </Card>
  )
}
