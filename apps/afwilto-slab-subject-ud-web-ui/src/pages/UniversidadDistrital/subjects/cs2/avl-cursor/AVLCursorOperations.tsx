import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'

interface AVLCursorOperationsProps {
  disabled: boolean
  onInsert: (key: string) => void
  onDelete: (key: string) => void
}

export function AVLCursorOperations({ disabled, onInsert, onDelete }: AVLCursorOperationsProps) {
  const [key, setKey] = useState('')

  const trimmed = key.trim()
  const valid = trimmed.length > 0

  const submit = (op: 'insert' | 'delete') => {
    if (!valid) return
    if (op === 'insert') onInsert(trimmed)
    else onDelete(trimmed)
    setKey('')
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">Operations</Text>
      <Text variant="caption" color="muted">
        Keys are compared by their <span className="font-mono">letterSum</span> (a=1…z=26). Case-insensitive; non-alpha characters contribute 0.
      </Text>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <FormField
            id="avlcursor-key"
            label="Key (word)"
            type="text"
            value={key}
            placeholder="e.g. hello"
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit('insert') }}
          />
        </div>
        <Button
          variant="primary"
          disabled={disabled || !valid}
          onClick={() => submit('insert')}
        >
          Insert
        </Button>
        <Button
          variant="danger"
          disabled={disabled || !valid}
          onClick={() => submit('delete')}
        >
          Delete
        </Button>
      </div>
    </Card>
  )
}
