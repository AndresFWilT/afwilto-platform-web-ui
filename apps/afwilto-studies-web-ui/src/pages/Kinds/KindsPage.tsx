import { useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, Input, Text, useToast } from '@afwilto/design-system'
import type { NoteKind } from '@/application/ports'
import { trimSpace, validateName } from '@/domain/validation'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { DeleteDialog } from '../shared/DeleteDialog'
import { Field } from '../shared/Field'
import { GONE_MESSAGE, toFormFailure } from '../shared/serverErrors'
import { LoadError, LoadingRows } from '../shared/states'

type Modal = { type: 'rename'; kind: NoteKind } | { type: 'delete'; kind: NoteKind } | null

/** `/studies/kinds`: list, create, rename and delete note kinds (FR-7, AC-F12). */
export function KindsPage() {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const [reload, setReload] = useState(0)
  const state = useAsync(() => studiesService.listKinds(), [studiesService, reload])
  const [modal, setModal] = useState<Modal>(null)
  const refetch = () => setReload((n) => n + 1)
  const close = () => setModal(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Text variant="h1" color="default">Note kinds</Text>
        <Text variant="body" color="muted">Kinds classify notes, e.g. Summary or Cheat sheet.</Text>
      </div>

      <CreateKindForm
        onCreated={() => {
          showToast('Kind created', 'success')
          refetch()
        }}
      />

      {state.status === 'loading' && <LoadingRows />}
      {state.status === 'error' && <LoadError error={state.error} />}
      {state.status === 'success' && (
        <ul aria-label="Note kinds" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
          {state.data.map((kind) => (
            <li key={kind.id} className="flex items-center gap-3 px-4 py-2.5">
              <span data-kind-name className="font-medium text-neutral-100">{kind.name}</span>
              <span className="text-xs text-neutral-500">
                {kind.noteCount} {kind.noteCount === 1 ? 'note' : 'notes'}
              </span>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" aria-label={`Rename ${kind.name}`} onClick={() => setModal({ type: 'rename', kind })}>
                  Rename
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${kind.name}`} onClick={() => setModal({ type: 'delete', kind })}>
                  Delete
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {modal?.type === 'rename' && (
        <RenameKindDialog
          kind={modal.kind}
          onGone={refetch}
          onClose={close}
          onRenamed={(changed) => {
            close()
            if (!changed) return
            showToast('Kind renamed', 'success')
            refetch()
          }}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteDialog
          entity="kind"
          name={modal.kind.name}
          inUseText="Change or delete the notes using this kind first."
          onConfirm={() => studiesService.deleteKind(modal.kind.id)}
          onDeleted={() => {
            close()
            showToast('Kind deleted', 'success')
            refetch()
          }}
          onGone={refetch}
          onClose={close}
        />
      )}
    </div>
  )
}

function CreateKindForm({ onCreated }: { onCreated: () => void }) {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clientError = validateName(name, 40)
    setError(clientError ?? undefined)
    if (clientError) return
    setSaving(true)
    try {
      await studiesService.createKind(trimSpace(name))
      setName('')
      onCreated()
    } catch (err) {
      const failure = toFormFailure(err, ['name'])
      setError(failure.fields['name'] ?? failure.alert)
      if (failure.unexpected) showToast(failure.unexpected, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex items-end gap-2">
      <div className="flex-1">
        <Field label="New kind name" error={error}>
          {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} error={Boolean(error)} />}
        </Field>
      </div>
      <Button type="submit" loading={saving} disabled={saving}>
        Add kind
      </Button>
    </form>
  )
}

function RenameKindDialog({
  kind,
  onClose,
  onRenamed,
  onGone,
}: {
  kind: NoteKind
  onClose: () => void
  onRenamed: (changed: boolean) => void
  onGone: () => void
}) {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const [name, setName] = useState(kind.name)
  const [error, setError] = useState<string>()
  const [alert, setAlert] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [gone, setGone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clientError = validateName(name, 40)
    setError(clientError ?? undefined)
    setAlert(undefined)
    if (clientError) return
    if (trimSpace(name) === kind.name) {
      onRenamed(false)
      return
    }
    setSaving(true)
    try {
      await studiesService.renameKind(kind.id, trimSpace(name))
      onRenamed(true)
    } catch (err) {
      const failure = toFormFailure(err, ['name'])
      setError(failure.fields['name'])
      setAlert(failure.alert)
      if (failure.gone) {
        setGone(true)
        onGone()
      }
      if (failure.unexpected) showToast(failure.unexpected, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Rename kind"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="rename-kind-form" loading={saving} disabled={saving || gone}>Save</Button>
        </>
      }
    >
      <form id="rename-kind-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Name" error={error}>
          {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} error={Boolean(error)} />}
        </Field>
        {alert && <Alert variant="error">{alert}</Alert>}
        {gone && <Alert variant="info">{GONE_MESSAGE}</Alert>}
      </form>
    </Dialog>
  )
}
