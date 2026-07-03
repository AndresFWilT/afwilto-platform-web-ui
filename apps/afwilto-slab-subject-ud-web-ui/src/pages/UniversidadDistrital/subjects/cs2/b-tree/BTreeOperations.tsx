import { useState } from 'react'
import { Card, Text, Button, Input } from '@afwilto/design-system'

interface BTreeOperationsProps {
  disabled: boolean
  onInsert: (key: string) => void
  onDelete: (key: string) => void
  onFind: (key: string) => void
}

// Renders insert / delete / find controls. Single responsibility: capture a key
// per operation and emit the corresponding intent.
export function BTreeOperations({ disabled, onInsert, onDelete, onFind }: BTreeOperationsProps) {
  const [insertKey, setInsertKey] = useState('')
  const [deleteKey, setDeleteKey] = useState('')
  const [findKey, setFindKey] = useState('')

  const submit = (raw: string, fn: (k: string) => void, clear: () => void) => {
    const key = raw.trim()
    if (!key) return
    fn(key)
    clear()
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">Operations</Text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OperationRow
          label="Insert"
          placeholder="key e.g. M"
          value={insertKey}
          variant="primary"
          disabled={disabled}
          onChange={setInsertKey}
          onSubmit={() => submit(insertKey, onInsert, () => setInsertKey(''))}
        />
        <OperationRow
          label="Delete"
          placeholder="key e.g. M"
          value={deleteKey}
          variant="danger"
          disabled={disabled}
          onChange={setDeleteKey}
          onSubmit={() => submit(deleteKey, onDelete, () => setDeleteKey(''))}
        />
        <OperationRow
          label="Find"
          placeholder="key e.g. M"
          value={findKey}
          variant="secondary"
          disabled={disabled}
          onChange={setFindKey}
          onSubmit={() => submit(findKey, onFind, () => setFindKey(''))}
        />
      </div>
    </Card>
  )
}

interface OperationRowProps {
  label: string
  placeholder: string
  value: string
  variant: 'primary' | 'danger' | 'secondary'
  disabled: boolean
  onChange: (v: string) => void
  onSubmit: () => void
}

function OperationRow({ label, placeholder, value, variant, disabled, onChange, onSubmit }: OperationRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">{label}</Text>
      <div className="flex gap-2">
        <Input
          inputSize="sm"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        <Button variant={variant} size="sm" disabled={disabled || !value.trim()} onClick={onSubmit}>
          {label}
        </Button>
      </div>
    </div>
  )
}
