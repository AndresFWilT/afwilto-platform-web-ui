import { Card, Text, Badge } from '@afwilto/design-system'
import type { EmailMessage } from './types'

interface Props {
  message: EmailMessage
}

export function MessageView({ message }: Props) {
  return (
    <Card padding="md" className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-2 pb-3 border-b border-surface-border">
        <Text variant="h4" color="default">{message.subject}</Text>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="text-neutral-400">
            <span className="text-neutral-500">From: </span>
            <span className="text-neutral-200">{message.from || '(unknown)'}</span>
          </span>
          <span className="text-neutral-400">
            <span className="text-neutral-500">To: </span>
            <span className="text-neutral-200">{message.to || '(unknown)'}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">Message #{message.id}</Badge>
          {message.date && (
            <Text variant="caption" color="muted">{message.date}</Text>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
          {message.body || message.bodyPreview || '(empty message)'}
        </pre>
      </div>
    </Card>
  )
}
