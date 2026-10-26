import { useId } from 'react'
import { FormField } from '@afwilto/design-system'
import { EXAM_NAME_MAX, type ExamFormValues } from '@/exams/domain'

const FIELDS: Array<{ name: keyof ExamFormValues; label: string; numeric: boolean }> = [
  { name: 'name', label: 'Name', numeric: false },
  { name: 'questionCount', label: 'Questions in the full simulation', numeric: true },
  { name: 'timeLimitMin', label: 'Time limit (min)', numeric: true },
  { name: 'passPercent', label: 'Pass mark (%)', numeric: true },
]

interface Props {
  values: ExamFormValues
  errors: Partial<Record<keyof ExamFormValues, string>>
  onChange: (field: keyof ExamFormValues, value: string) => void
  disabled?: boolean
}

/** The four parameters of a real simulation (FR-1), shared by the create and edit forms. */
export function ExamParametersFields({ values, errors, onChange, disabled }: Props) {
  const prefix = useId()
  return (
    <>
      {FIELDS.map(({ name, label, numeric }) => (
        <FormField
          key={name}
          id={`${prefix}-${name}`}
          label={label}
          value={values[name]}
          onChange={(e) => onChange(name, e.target.value)}
          errorMessage={errors[name]}
          aria-invalid={Boolean(errors[name])}
          disabled={disabled}
          {...(numeric ? { type: 'number', min: 1, step: 1 } : { maxLength: EXAM_NAME_MAX })}
        />
      ))}
    </>
  )
}
