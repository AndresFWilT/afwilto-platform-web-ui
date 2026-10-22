import { useState, type FormEvent } from 'react'
import { Button, Text, Textarea } from '@afwilto/design-system'
import type { Violation } from '@/cidr/application/errors'
import { splitAddressList } from '@/shared/lib/splitAddressList'

interface AggregateFormProps {
  pending: boolean
  /** The API's per-entry rejections (field `addresses[<index>]`). */
  serverViolations: Violation[]
  onSubmit: (addresses: string[]) => void
}

export function AggregateForm({ pending, serverViolations, onSubmit }: AggregateFormProps) {
  const [text, setText] = useState('')
  const [missing, setMissing] = useState(false)
  const messages = missing ? ['Enter at least one IPv4 address'] : serverViolations.map((v) => v.message)

  function submit(event: FormEvent) {
    event.preventDefault()
    const addresses = splitAddressList(text)
    setMissing(addresses.length === 0)
    if (addresses.length) onSubmit(addresses)
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="addresses" className="flex flex-col gap-1.5">
        <Text as="span" variant="small" weight="medium" color="default">
          IP addresses
        </Text>
      </label>
      <Textarea
        id="addresses"
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'10.0.0.0\n10.0.0.1\n10.0.0.2'}
        spellCheck={false}
        error={messages.length > 0}
        aria-describedby="addresses-help"
        className="font-mono"
      />
      <Text id="addresses-help" variant="caption" color="muted">
        Up to 1000 IPv4 addresses, separated by new lines, spaces or commas.
      </Text>
      {messages.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1">
          {messages.map((message) => (
            <li key={message} className="text-xs text-red-400">
              {message}
            </li>
          ))}
        </ul>
      )}
      <Button type="submit" loading={pending} className="self-start">
        Aggregate
      </Button>
    </form>
  )
}
