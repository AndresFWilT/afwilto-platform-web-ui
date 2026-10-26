import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, useToast } from '@afwilto/design-system'
import { useServices } from '@/di'
import { validateExamInput, violationProblems, type ExamFormValues } from '@/exams/domain'
import { ExamsConflictError, ExamsValidationError } from '@/exams/application/ports'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { ExamParametersFields } from '../organisms/ExamParametersFields'
import { ManageExamTemplate } from '../templates/ManageExamTemplate'

type FieldErrors = Partial<Record<keyof ExamFormValues, string>>

const DEFAULTS: ExamFormValues = { name: '', questionCount: '65', timeLimitMin: '130', passPercent: '72' }
const FORM_FIELDS = Object.keys(DEFAULTS)

export function NewExamPage() {
  const { subjectId = '' } = useParams()
  const { examsService } = useServices()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState<ExamFormValues>(DEFAULTS)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [alert, setAlert] = useState<string>()
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const check = validateExamInput(values)
    setErrors(check.errors)
    setAlert(undefined)
    if (!check.value) return
    setSaving(true)
    try {
      const exam = await examsService.createExam(subjectId, check.value)
      showToast('Exam created', 'success')
      navigate(`/studies/exams/${exam.id}`)
    } catch (err) {
      if (err instanceof ExamsConflictError && err.rule === 'duplicate_name') {
        setErrors({ name: 'An exam with that name already exists' })
      } else if (err instanceof ExamsValidationError) {
        const { problems, unmapped } = violationProblems(undefined, err.details)
        setErrors(Object.fromEntries(Object.entries(problems).filter(([field]) => FORM_FIELDS.includes(field))) as FieldErrors)
        if (unmapped.length) setAlert(unmapped.join('; '))
      } else {
        setAlert(err instanceof Error ? err.message : String(err))
      }
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <ManageExamTemplate title="New exam" width="narrow">
        <ExamParametersFields values={values} errors={errors} onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))} disabled={saving} />
        {alert && <Alert variant="error">{alert}</Alert>}
        <div className="flex gap-2">
          <Button type="submit" loading={saving}>Create exam</Button>
          <ButtonLink to={`/studies/subjects/${subjectId}/exams`} variant="ghost">Cancel</ButtonLink>
        </div>
      </ManageExamTemplate>
    </form>
  )
}
