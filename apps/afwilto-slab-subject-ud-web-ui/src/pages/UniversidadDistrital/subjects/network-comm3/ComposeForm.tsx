import { useState } from 'react'
import { Button, FormField, Alert, Text, Card } from '@afwilto/design-system'
import { useServices } from '@/di'

interface Props {
  token: string
  fromEmail: string
}

export function ComposeForm({ token, fromEmail }: Props) {
  const { mailClientService } = useServices()
  const [to,      setTo]      = useState('')
  const [subject, setSubject] = useState('')
  const [body,    setBody]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sent,    setSent]    = useState(false)

  async function handleSend() {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('All fields are required.'); return
    }
    setLoading(true); setError(null); setSent(false)
    try {
      await mailClientService.sendMessage(token, to.trim(), subject.trim(), body.trim())
      setSent(true)
      setTo(''); setSubject(''); setBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">New Message</Text>
      <Text variant="caption" color="muted">From: {fromEmail}</Text>

      {error && <Alert variant="error" title="Send error" onClose={() => setError(null)}>{error}</Alert>}
      {sent  && <Alert variant="success" title="Sent">Message delivered successfully.</Alert>}

      <FormField label="To" id="compose-to" type="email" value={to}
        onChange={e => setTo(e.target.value)} inputSize="sm" />

      <FormField label="Subject" id="compose-subject" value={subject}
        onChange={e => setSubject(e.target.value)} inputSize="sm" />

      <div className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Body</span>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={8}
          className="w-full bg-surface-raised border border-surface-border rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-primary-400 resize-y"
          placeholder="Write your message here..."
        />
      </div>

      <Button variant="primary" size="md" loading={loading} onClick={handleSend}>
        Send via SMTP
      </Button>
    </Card>
  )
}
