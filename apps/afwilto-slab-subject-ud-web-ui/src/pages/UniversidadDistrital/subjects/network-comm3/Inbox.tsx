import { useState, useEffect } from 'react'
import { Text, Spinner, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { EmailMessage } from './types'

interface Props {
  token: string
  selectedId: number | null
  onSelect: (msg: EmailMessage) => void
}

export function Inbox({ token, selectedId, onSelect }: Props) {
  const { mailClientService } = useServices()
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    mailClientService.listMessages(token)
      .then(r => { setMessages(r.messages); setError(null) })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load messages'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>
  if (error)   return <Alert variant="error" title="Inbox error">{error}</Alert>

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-2">
        <Text variant="body" color="muted">No messages</Text>
        <Text variant="caption" color="muted">Your mailbox is empty.</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-surface-border">
      {messages.map(msg => (
        <button
          key={msg.id}
          onClick={() => onSelect(msg)}
          className={`w-full text-left px-4 py-3 hover:bg-surface-overlay transition-colors ${selectedId === msg.id ? 'bg-surface-overlay border-l-2 border-primary-400' : ''}`}
        >
          <div className="flex items-center justify-between gap-2">
            <Text variant="small" weight="semibold" color="default" className="truncate">{msg.from || '(no sender)'}</Text>
            <Text variant="caption" color="muted" className="shrink-0">{formatDate(msg.date)}</Text>
          </div>
          <Text variant="small" color="default" className="truncate">{msg.subject}</Text>
          <Text variant="caption" color="muted" className="truncate">{msg.bodyPreview}</Text>
        </button>
      ))}
    </div>
  )
}

function formatDate(raw: string): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw.slice(0, 16)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
