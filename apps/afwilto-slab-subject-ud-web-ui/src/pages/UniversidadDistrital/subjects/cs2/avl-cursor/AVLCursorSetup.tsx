import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'

interface AVLCursorSetupProps {
  disabled: boolean
  onInitialize: (name: string, capacity: number) => void
}

export function AVLCursorSetup({ disabled, onInitialize }: AVLCursorSetupProps) {
  const [name, setName] = useState('CRS1')
  const [capacity, setCapacity] = useState('11')

  const parsedCap = Number.parseInt(capacity, 10)
  const nameValid = name.length >= 1 && name.length <= 4
  const capValid = Number.isInteger(parsedCap) && parsedCap >= 2 && parsedCap <= 200
  const nameError = name !== '' && !nameValid ? 'Name must be 1–4 characters' : undefined
  const capError = capacity !== '' && !capValid ? 'Capacity must be between 2 and 200' : undefined

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">Setup</Text>
        <Text variant="caption" color="muted">
          Name (1–4 chars) identifies the table. Capacity is the total array size — slot 0 is metadata, so you get <span className="font-mono">capacity − 1</span> data slots.
        </Text>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="w-full sm:w-32">
          <FormField
            id="avlcursor-name"
            label="Table name"
            type="text"
            maxLength={4}
            value={name}
            errorMessage={nameError}
            onChange={(e) => setName(e.target.value.toUpperCase())}
          />
        </div>
        <div className="w-full sm:w-40">
          <FormField
            id="avlcursor-capacity"
            label="Capacity"
            type="number"
            min={2}
            max={200}
            value={capacity}
            errorMessage={capError}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          disabled={disabled || !nameValid || !capValid}
          onClick={() => nameValid && capValid && onInitialize(name, parsedCap)}
        >
          Initialize
        </Button>
      </div>
    </Card>
  )
}
