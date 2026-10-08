import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert, Button, DateField, Select, Textarea } from '@afwilto/design-system'
import type { Category, CertificationStatus } from '@/application/ports'

// Selecting this option asks the caller to navigate to the new-category form
// instead of setting the field — it is never a valid category value.
const NEW_CATEGORY_OPTION = '__new_category__'

export interface FormValues {
  name: string
  status: CertificationStatus
  categoryPath: string
  studyStartDate: string
  expectedExamDate: string
  achievedDate: string
  evidenceUrl: string
  notes: string
}

export function defaultValues(overrides?: Partial<FormValues>): FormValues {
  return {
    name: '',
    status: 'planned',
    categoryPath: '',
    studyStartDate: '',
    expectedExamDate: '',
    achievedDate: '',
    evidenceUrl: '',
    notes: '',
    ...overrides,
  }
}

interface FormErrors {
  name?: string
  category?: string
  evidenceUrl?: string
  dates?: string
}

interface CertificationFormProps {
  initialValues?: Partial<FormValues>
  categories: Category[]
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
  /** Called with the current in-progress values so the caller can preserve
   * them (e.g. via sessionStorage) across the round trip to /categories/new. */
  onRequestNewCategory: (values: FormValues) => void
  submitLabel?: string
}

function FieldWrapper({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-100">
        {label}
        {required && (
          <span className="ml-1 text-red-400" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

// Mirrors the backend's ValidateEvidenceURL: an https scheme and something after it.
function isHttpsUrl(raw: string): boolean {
  return raw.startsWith('https://') && raw.length > 'https://'.length
}

const STATUS_OPTIONS: { value: CertificationStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'expired', label: 'Expired' },
  { value: 'abandoned', label: 'Abandoned' },
]

export function CertificationForm({
  initialValues,
  categories,
  onSubmit,
  onCancel,
  onRequestNewCategory,
  submitLabel = 'Save',
}: CertificationFormProps) {
  const [values, setValues] = useState<FormValues>(() => defaultValues(initialValues))
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues(v => ({ ...v, [key]: value }))
  }

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!values.name.trim()) errs.name = 'Name is required'
    // BR-CAT1: the backend rejects an empty category on create and a null one
    // on update, so the field is mandatory here too.
    if (!values.categoryPath.trim()) errs.category = 'Category is required'
    // The backend accepts https evidence URLs only; catch it here rather than as
    // a 422 toast — on create that rejection would strand a half-created cert.
    const evidenceUrl = values.evidenceUrl.trim()
    if (values.status === 'achieved' && evidenceUrl && !isHttpsUrl(evidenceUrl)) {
      errs.evidenceUrl = 'Evidence URL must be an https URL'
    }
    if (
      values.studyStartDate &&
      values.expectedExamDate &&
      values.expectedExamDate < values.studyStartDate
    ) {
      errs.dates = 'Expected exam date must be on or after the study start date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  const isAchieved = values.status === 'achieved'

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Name */}
      <FieldWrapper id="name" label="Name" required error={errors.name}>
        <input
          id="name"
          aria-label="Name"
          className={`w-full border bg-brand-800 text-neutral-100 placeholder-neutral-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.name ? 'border-red-500' : 'border-surface-border'}`}
          value={values.name}
          onChange={e => set('name', e.target.value)}
          required
        />
      </FieldWrapper>

      {/* Status */}
      <FieldWrapper id="status" label="Status">
        <Select
          id="status"
          aria-label="Status"
          value={values.status}
          onChange={e => set('status', e.target.value as CertificationStatus)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FieldWrapper>

      {/* Category — a constrained Select over existing categories only; a new
          one is created on a separate route, never typed in free text here. */}
      <FieldWrapper id="category" label="Category" required error={errors.category}>
        <Select
          id="category"
          aria-label="Category"
          error={Boolean(errors.category)}
          value={values.categoryPath}
          onChange={e => {
            const value = e.target.value
            if (value === NEW_CATEGORY_OPTION) {
              onRequestNewCategory(values)
              return
            }
            set('categoryPath', value)
          }}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {categories.map(c => (
            <option key={c.id} value={c.path}>
              {c.path}
            </option>
          ))}
          <option value={NEW_CATEGORY_OPTION}>＋ Add new category</option>
        </Select>
      </FieldWrapper>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <DateField
          id="studyStartDate"
          label="Study start"
          aria-label="Study start"
          value={values.studyStartDate}
          onChange={e => set('studyStartDate', e.target.value)}
        />
        <DateField
          id="expectedExamDate"
          label="Expected exam"
          aria-label="Expected exam"
          value={values.expectedExamDate}
          onChange={e => set('expectedExamDate', e.target.value)}
        />
      </div>

      {errors.dates && (
        <Alert variant="error">{errors.dates}</Alert>
      )}

      {/* Conditional achieved fields */}
      {isAchieved && (
        <DateField
          id="achievedDate"
          label="Achieved date"
          aria-label="Achieved date"
          value={values.achievedDate}
          onChange={e => set('achievedDate', e.target.value)}
        />
      )}

      {isAchieved && (
        <FieldWrapper id="evidenceUrl" label="Evidence URL" error={errors.evidenceUrl}>
          <input
            id="evidenceUrl"
            aria-label="Evidence URL"
            type="url"
            className="w-full border border-surface-border bg-brand-800 text-neutral-100 placeholder-neutral-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="https://example.com/badge"
            value={values.evidenceUrl}
            onChange={e => set('evidenceUrl', e.target.value)}
          />
        </FieldWrapper>
      )}

      {/* Notes */}
      <FieldWrapper id="notes" label="Notes">
        <Textarea
          id="notes"
          aria-label="Notes"
          value={values.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Goal, motivation, study plan…"
          rows={4}
        />
      </FieldWrapper>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
