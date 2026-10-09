import { useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, Input, Select, Skeleton, Textarea, useToast } from '@afwilto/design-system'
import type { Subject, SubjectPatch } from '@/application/ports'
import { trimSpace, validateDescription, validateName } from '@/domain/validation'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { Field } from '../shared/Field'
import { GONE_MESSAGE, toFormFailure } from '../shared/serverErrors'

interface Props {
  /** Absent: create. Present: edit with a minimal patch. */
  subject?: Subject
  /** Create mode: the category to preselect (e.g. from a category view). */
  defaultCategoryId?: string
  onSaved: (subject: Subject | null) => void
  onClose: () => void
}

/** Create or edit a subject: category (by path), name, description (FR-2, BR-SUB1). */
export function SubjectFormDialog({ subject, defaultCategoryId, onSaved, onClose }: Props) {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const categories = useAsync(() => studiesService.listCategories(), [studiesService])

  const [categoryId, setCategoryId] = useState(subject?.categoryId ?? defaultCategoryId ?? '')
  const [name, setName] = useState(subject?.name ?? '')
  const [description, setDescription] = useState(subject?.description ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [gone, setGone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clientErrors: Record<string, string> = {}
    if (!categoryId) clientErrors['categoryId'] = 'Pick a category'
    const nameError = validateName(name, 120)
    const descriptionError = validateDescription(description)
    if (nameError) clientErrors['name'] = nameError
    if (descriptionError) clientErrors['description'] = descriptionError
    setErrors(clientErrors)
    setAlert(undefined)
    if (Object.keys(clientErrors).length) return

    const trimmedName = trimSpace(name)
    const cleanDescription = description.trim() === '' ? null : description
    setSaving(true)
    try {
      if (subject) {
        const patch: SubjectPatch = {}
        if (categoryId !== subject.categoryId) patch.categoryId = categoryId
        if (trimmedName !== subject.name) patch.name = trimmedName
        if (cleanDescription !== subject.description) patch.description = cleanDescription
        if (Object.keys(patch).length === 0) {
          onSaved(null)
          return
        }
        onSaved(await studiesService.updateSubject(subject.id, patch))
      } else {
        onSaved(await studiesService.createSubject({ categoryId, name: trimmedName, description: cleanDescription }))
      }
    } catch (err) {
      const failure = toFormFailure(err, ['categoryId', 'name', 'description'])
      setErrors(failure.fields)
      setAlert(failure.alert)
      if (failure.gone) setGone(true)
      if (failure.unexpected) showToast(failure.unexpected, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={subject ? 'Edit subject' : 'New subject'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="subject-form" loading={saving} disabled={saving || gone || (!subject && categories.status !== 'success')}>
            Save
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Category" error={errors['categoryId']}>
          {(props) =>
            categories.status === 'success' ? (
              <Select {...props} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={Boolean(errors['categoryId'])}>
                {!subject && <option value="">Choose a category</option>}
                {categories.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.path}
                  </option>
                ))}
              </Select>
            ) : categories.status === 'error' ? (
              <Alert variant="error">{categories.error.message}</Alert>
            ) : (
              <Skeleton className="h-10 w-full" />
            )
          }
        </Field>
        <Field label="Name" error={errors['name']}>
          {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} error={Boolean(errors['name'])} />}
        </Field>
        <Field label="Description" error={errors['description']}>
          {(props) => (
            <Textarea {...props} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} error={Boolean(errors['description'])} />
          )}
        </Field>
        {alert && <Alert variant="error">{alert}</Alert>}
        {gone && <Alert variant="info">{GONE_MESSAGE}</Alert>}
      </form>
    </Dialog>
  )
}
