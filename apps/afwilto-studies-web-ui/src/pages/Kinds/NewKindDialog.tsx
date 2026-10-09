import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, Input, useToast } from '@afwilto/design-system'
import type { NoteKind } from '@/application/ports'
import { trimSpace, validateName } from '@/domain/validation'
import { useServices } from '@/di'
import { Field } from '../shared/Field'
import { toFormFailure } from '../shared/serverErrors'

/** Create a note kind without leaving the current page (Slice 09b-2, from the note editor). */
export function NewKindDialog({
  onCreated,
  onClose,
}: {
  /** `select` is false when the dialog was closed before the kind came back: list it, don't pick it. */
  onCreated: (kind: NoteKind, select: boolean) => void
  onClose: () => void
}) {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()
  const [alert, setAlert] = useState<string>()
  const [saving, setSaving] = useState(false)
  const open = useRef(true)
  useEffect(
    () => () => {
      open.current = false
    },
    []
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clientError = validateName(name, 40)
    setError(clientError ?? undefined)
    setAlert(undefined)
    if (clientError) return
    setSaving(true)
    try {
      const kind = await studiesService.createKind(trimSpace(name))
      onCreated(kind, open.current)
    } catch (err) {
      const failure = toFormFailure(err, ['name'])
      setError(failure.fields['name'])
      setAlert(failure.alert)
      if (failure.unexpected) showToast(failure.unexpected, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="New kind"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="new-kind-form" loading={saving} disabled={saving}>Save</Button>
        </>
      }
    >
      <form id="new-kind-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Name" error={error}>
          {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} error={Boolean(error)} />}
        </Field>
        {alert && <Alert variant="error">{alert}</Alert>}
      </form>
    </Dialog>
  )
}
