import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Text, useToast } from '@afwilto/design-system'
import { useServices } from '@/di'
import { setPendingCategoryPath } from '@/pages/Form/formDraft'
import { ColorField, isValidHexColor } from './ColorField'

interface FormErrors {
  path?: string
  color?: string
}

interface LocationState {
  returnTo?: string
}

export function CategoryFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const returnTo = (location.state as LocationState | null)?.returnTo

  const [path, setPath] = useState('')
  const [color, setColor] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!path.trim()) errs.path = 'Path is required'
    if (!isValidHexColor(color)) errs.color = 'Color must be a 6-digit hex value like #22D3EE'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const created = await certificationJourneyService.createCategory({
        path: path.trim(),
        color: color.toUpperCase(),
      })
      setPendingCategoryPath(created.path)
      navigate(returnTo ?? '/certifications/new', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create category'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    navigate(returnTo ?? '..')
  }

  return (
    <div>
      <div className="mx-auto max-w-lg flex flex-col gap-6">
        <Text as="h1" variant="h2">
          New Category
        </Text>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="path" className="text-sm font-medium text-neutral-100">
              Path
              <span className="ml-1 text-red-400" aria-hidden>
                *
              </span>
            </label>
            <input
              id="path"
              aria-label="Path"
              className={`w-full border bg-brand-800 text-neutral-100 placeholder-neutral-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.path ? 'border-red-500' : 'border-surface-border'}`}
              placeholder="e.g. Cloud / AWS"
              value={path}
              onChange={e => setPath(e.target.value)}
            />
            {errors.path && (
              <p role="alert" className="text-xs text-red-400">
                {errors.path}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="color" className="text-sm font-medium text-neutral-100">
              Color
              <span className="ml-1 text-red-400" aria-hidden>
                *
              </span>
            </label>
            <ColorField id="color" value={color} onChange={setColor} error={Boolean(errors.color)} />
            {errors.color && (
              <p role="alert" className="text-xs text-red-400">
                {errors.color}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
              Create
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
