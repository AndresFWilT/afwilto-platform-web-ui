import { useState } from 'react'
import { Alert, Button, Dialog } from '@afwilto/design-system'
import { StudiesConflictError, StudiesNotFoundError } from '@/application/errors'
import { GONE_MESSAGE } from './serverErrors'

type Outcome = { kind: 'idle' } | { kind: 'in_use' } | { kind: 'gone' } | { kind: 'failed'; message: string }

interface DeleteDialogProps {
  /** e.g. "category" → title "Delete category “Cloud”?" */
  entity: string
  name: string
  /** Shown on 409 in_use (AC-F11). */
  inUseText: string
  onConfirm: () => Promise<void>
  onDeleted: () => void
  /** The item was already gone (404): the caller refetches. */
  onGone: () => void
  onClose: () => void
}

/** Logical delete with the parent spec's explanations (AC-F11). Never a native confirm(). */
export function DeleteDialog({ entity, name, inUseText, onConfirm, onDeleted, onGone, onClose }: DeleteDialogProps) {
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' })

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
      onDeleted()
    } catch (e) {
      if (e instanceof StudiesConflictError && e.rule === 'in_use') setOutcome({ kind: 'in_use' })
      else if (e instanceof StudiesNotFoundError) {
        setOutcome({ kind: 'gone' })
        onGone()
      } else setOutcome({ kind: 'failed', message: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  const blocked = outcome.kind === 'in_use' || outcome.kind === 'gone'
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Delete ${entity} “${name}”?`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy || blocked} loading={busy}>
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-300">This cannot be undone from the app.</p>
      {outcome.kind === 'in_use' && <Alert variant="warning">{inUseText}</Alert>}
      {outcome.kind === 'gone' && <Alert variant="info">{GONE_MESSAGE}</Alert>}
      {outcome.kind === 'failed' && <Alert variant="error">{outcome.message}</Alert>}
    </Dialog>
  )
}
