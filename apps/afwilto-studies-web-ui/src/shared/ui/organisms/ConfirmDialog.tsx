import { useState, type ReactNode } from 'react'
import { Alert, Button, Dialog } from '@afwilto/design-system'

interface Props {
  /** Also the dialog's accessible name. */
  title: string
  children?: ReactNode
  confirmLabel: string
  /** Throw to keep the dialog open and show the failure. */
  onConfirm: () => Promise<void>
  onClose: () => void
  /** The text shown for a failed confirmation; defaults to the error message. */
  describeError?: (error: unknown) => string
  danger?: boolean
}

/** A confirmation that names what it will do (never a native confirm()). */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose, describeError, danger = false }: Props) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string>()

  async function confirm() {
    setBusy(true)
    setFailure(undefined)
    try {
      await onConfirm()
    } catch (e) {
      setFailure(describeError ? describeError(e) : e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={busy}>{confirmLabel}</Button>
        </>
      }
    >
      {children}
      {failure && <Alert variant="error">{failure}</Alert>}
    </Dialog>
  )
}
