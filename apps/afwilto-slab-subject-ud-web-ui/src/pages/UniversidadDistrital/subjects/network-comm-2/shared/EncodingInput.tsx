import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'

interface EncodingInputProps {
  disabled: boolean
  onEncode: (text: string) => void
}

export function EncodingInput({ disabled, onEncode }: EncodingInputProps) {
  const [value, setValue] = useState('abracadabra')

  const trimmed = value.trim()
  const valid = trimmed.length >= 2

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">Input Text</Text>
        <Text variant="caption" color="muted">
          Enter at least 2 characters with 2+ distinct symbols.
        </Text>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <FormField
            id="encoding-input"
            label="Text to encode"
            type="text"
            value={value}
            placeholder="e.g. abracadabra"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) onEncode(trimmed) }}
          />
        </div>
        <Button
          variant="primary"
          disabled={disabled || !valid}
          onClick={() => valid && onEncode(trimmed)}
        >
          Encode
        </Button>
      </div>
    </Card>
  )
}
