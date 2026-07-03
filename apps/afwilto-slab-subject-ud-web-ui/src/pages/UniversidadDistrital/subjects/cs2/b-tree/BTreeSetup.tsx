import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'

interface BTreeSetupProps {
  order: number
  disabled: boolean
  onInitialize: (order: number) => void
}

// Renders the order input + "initialize empty tree" control.
// Single responsibility: capture a valid order and emit it.
export function BTreeSetup({ order, disabled, onInitialize }: BTreeSetupProps) {
  const [value, setValue] = useState(String(order))

  const parsed = Number.parseInt(value, 10)
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 20
  const error = value !== '' && !valid ? 'Order must be an integer between 1 and 20' : undefined

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">Setup</Text>
        <Text variant="caption" color="muted">
          The order <span className="font-mono">t</span> sets node capacity: a non-root node holds
          between <span className="font-mono">t</span> and <span className="font-mono">2t</span> keys.
        </Text>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="w-full sm:w-48">
          <FormField
            id="btree-order"
            label="Order (t)"
            type="number"
            min={1}
            max={20}
            value={value}
            errorMessage={error}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          disabled={disabled || !valid}
          onClick={() => valid && onInitialize(parsed)}
        >
          Initialize empty tree
        </Button>
      </div>
    </Card>
  )
}
