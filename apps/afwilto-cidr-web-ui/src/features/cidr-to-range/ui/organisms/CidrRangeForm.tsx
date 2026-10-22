import { useState, type FormEvent } from 'react'
import { Button, FormField } from '@afwilto/design-system'

interface CidrRangeFormProps {
  pending: boolean
  /** The API's message for the `cidr` field, when it rejected the input. */
  serverError?: string
  onSubmit: (cidr: string) => void
}

export function CidrRangeForm({ pending, serverError, onSubmit }: CidrRangeFormProps) {
  const [cidr, setCidr] = useState('')
  const [missing, setMissing] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const text = cidr.trim()
    setMissing(!text)
    if (text) onSubmit(text)
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-64">
        <FormField
          id="cidr"
          label="CIDR"
          required
          value={cidr}
          onChange={(e) => setCidr(e.target.value)}
          placeholder="10.0.0.0/24 or 2001:db8::/32"
          autoComplete="off"
          spellCheck={false}
          errorMessage={missing ? 'Enter a CIDR such as 10.0.0.0/24' : serverError}
        />
      </div>
      <Button type="submit" loading={pending}>
        Calculate
      </Button>
    </form>
  )
}
