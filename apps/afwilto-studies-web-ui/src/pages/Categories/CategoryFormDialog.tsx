import { useMemo, useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, Input, Select, useToast } from '@afwilto/design-system'
import type { Category, CategoryPatch } from '@/application/ports'
import { buildCategoryTree, descendantsOf, subtreeHeight } from '@/domain/categoryTree'
import { trimSpace, validateColor, validateName } from '@/domain/validation'
import { useServices } from '@/di'
import { Field } from '../shared/Field'
import { GONE_MESSAGE, toFormFailure } from '../shared/serverErrors'
import { ColorField } from './ColorField'

const MAX_DEPTH = 5
const ROOT = ''
/** A new category starts with a valid color, so it can be saved as is. */
const DEFAULT_COLOR = '#22D3EE'

export type CategoryFormMode = { type: 'create'; parentId: string | null } | { type: 'edit'; category: Category }

interface Props {
  mode: CategoryFormMode
  /** Every alive category, in the API's path order. */
  categories: Category[]
  onSaved: (outcome: 'created' | 'updated' | 'unchanged') => void
  /** The edited category was deleted meanwhile: the page refetches. */
  onGone: () => void
  onClose: () => void
}

/**
 * Create or edit a category (AC-F13). The parent picker never offers the
 * category itself, its descendants, or a parent too deep for its subtree;
 * the server stays authoritative and its max_depth / cycle land under Parent.
 */
export function CategoryFormDialog({ mode, categories, onSaved, onGone, onClose }: Props) {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const editing = mode.type === 'edit' ? mode.category : null

  const [name, setName] = useState(editing?.name ?? '')
  const [color, setColor] = useState(editing?.color ?? DEFAULT_COLOR)
  const [parentId, setParentId] = useState<string>(
    (editing ? editing.parentId : mode.type === 'create' ? mode.parentId : null) ?? ROOT
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [gone, setGone] = useState(false)

  const parentOptions = useMemo(() => {
    const tree = buildCategoryTree(categories)
    const excluded = editing ? descendantsOf(tree, editing.id) : new Set<string>()
    const height = editing ? subtreeHeight(tree, editing.id) : 1
    return categories.filter((c) => !excluded.has(c.id) && c.depth + height <= MAX_DEPTH)
  }, [categories, editing])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const clientErrors: Record<string, string> = {}
    const nameError = validateName(name, 60)
    const colorError = validateColor(color)
    if (nameError) clientErrors['name'] = nameError
    if (colorError) clientErrors['color'] = colorError
    setErrors(clientErrors)
    setAlert(undefined)
    if (Object.keys(clientErrors).length) return

    const chosenParent = parentId === ROOT ? null : parentId
    const trimmedName = trimSpace(name)
    const upperColor = trimSpace(color).toUpperCase()
    setSaving(true)
    try {
      if (editing) {
        const patch: CategoryPatch = {}
        if (trimmedName !== editing.name) patch.name = trimmedName
        if (upperColor !== editing.color) patch.color = upperColor
        if (chosenParent !== editing.parentId) patch.parentId = chosenParent
        if (Object.keys(patch).length === 0) {
          onSaved('unchanged')
          return
        }
        await studiesService.updateCategory(editing.id, patch)
        onSaved('updated')
      } else {
        await studiesService.createCategory({ name: trimmedName, color: upperColor, parentId: chosenParent })
        onSaved('created')
      }
    } catch (err) {
      const failure = toFormFailure(err, ['name', 'color', 'parentId'])
      setErrors(failure.fields)
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

  const formId = 'category-form'
  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? 'Edit category' : 'New category'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={saving} disabled={saving || gone}>
            Save
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Name" error={errors['name']}>
          {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} error={Boolean(errors['name'])} />}
        </Field>
        <ColorField value={color} onChange={setColor} error={errors['color']} />
        <Field label="Parent" error={errors['parentId']}>
          {(props) => (
            <Select {...props} value={parentId} onChange={(e) => setParentId(e.target.value)} error={Boolean(errors['parentId'])}>
              <option value={ROOT}>— Root —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.path}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {alert && <Alert variant="error">{alert}</Alert>}
        {gone && <Alert variant="info">{GONE_MESSAGE}</Alert>}
      </form>
    </Dialog>
  )
}
