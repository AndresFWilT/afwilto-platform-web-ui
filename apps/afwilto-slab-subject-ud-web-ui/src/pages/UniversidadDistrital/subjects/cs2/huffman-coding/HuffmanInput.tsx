import { useState } from 'react'
import { Card, Text, Button } from '@afwilto/design-system'

interface HuffmanInputProps {
  disabled: boolean
  onEncode: (text: string) => void
}

export function HuffmanInput({ disabled, onEncode }: HuffmanInputProps) {
  const [text, setText] = useState('abracadabra')

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed) onEncode(trimmed)
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">Input Text</Text>
        <Text variant="caption" color="muted">
          Enter any text with at least two distinct characters.
        </Text>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="flex-1 rounded-md border border-surface-border bg-surface-overlay px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary-400"
          placeholder="e.g. abracadabra"
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button
          variant="primary"
          disabled={disabled || !text.trim()}
          onClick={handleSubmit}
        >
          Encode
        </Button>
      </div>
    </Card>
  )
}
