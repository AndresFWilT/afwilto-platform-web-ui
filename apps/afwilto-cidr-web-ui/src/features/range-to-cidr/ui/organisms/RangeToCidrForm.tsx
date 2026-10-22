import { useState, type FormEvent } from 'react'
import { Button, FormField } from '@afwilto/design-system'

interface RangeToCidrFormProps {
  pending: boolean
  /** The API's messages for each bound, when it rejected the input. */
  serverErrors: { firstIp?: string; lastIp?: string }
  onSubmit: (firstIp: string, lastIp: string) => void
}

export function RangeToCidrForm({ pending, serverErrors, onSubmit }: RangeToCidrFormProps) {
  const [firstIp, setFirstIp] = useState('')
  const [lastIp, setLastIp] = useState('')
  const [missing, setMissing] = useState({ firstIp: false, lastIp: false })

  function submit(event: FormEvent) {
    event.preventDefault()
    const bounds = { firstIp: firstIp.trim(), lastIp: lastIp.trim() }
    setMissing({ firstIp: !bounds.firstIp, lastIp: !bounds.lastIp })
    if (bounds.firstIp && bounds.lastIp) onSubmit(bounds.firstIp, bounds.lastIp)
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-56">
        <FormField
          id="firstIp"
          label="First IP"
          required
          value={firstIp}
          onChange={(e) => setFirstIp(e.target.value)}
          placeholder="192.168.1.10"
          autoComplete="off"
          spellCheck={false}
          errorMessage={missing.firstIp ? 'Enter the first IP of the range' : serverErrors.firstIp}
        />
      </div>
      <div className="flex-1 min-w-56">
        <FormField
          id="lastIp"
          label="Last IP"
          required
          value={lastIp}
          onChange={(e) => setLastIp(e.target.value)}
          placeholder="192.168.1.20"
          autoComplete="off"
          spellCheck={false}
          errorMessage={missing.lastIp ? 'Enter the last IP of the range' : serverErrors.lastIp}
        />
      </div>
      <Button type="submit" loading={pending}>
        Calculate
      </Button>
    </form>
  )
}
