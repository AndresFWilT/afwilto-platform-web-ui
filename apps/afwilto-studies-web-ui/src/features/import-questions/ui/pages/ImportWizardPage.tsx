import { useCallback, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, EmptyState, Text, useToast } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { importFileProblem, primaryClassification, type Exam, type ImportReport } from '@/exams/domain'
import { ExamsNotFoundError } from '@/exams/application/ports'
import { countLabel } from '@/shared/lib/format'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { StepIndicator, type WizardStep } from '../molecules/StepIndicator'
import { FilePicker } from '../organisms/FilePicker'
import { ImportReportView } from '../organisms/ImportReportView'
import { ImportWizardTemplate } from '../templates/ImportWizardTemplate'

export function ImportWizardPage() {
  const { examId = '' } = useParams()
  const { examsService } = useServices()
  const exam = useAsync(() => examsService.getExam(examId), [examsService, examId])

  if (exam.status === 'loading') return <LoadingRows />
  if (exam.status === 'error') {
    return exam.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Exam not found" description="It may have been deleted." />
    ) : (
      <LoadError error={exam.error} title="Could not load the exam" />
    )
  }
  return <Wizard exam={exam.data} />
}

function Wizard({ exam }: { exam: Exam }) {
  const { examsService } = useServices()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState<WizardStep>('file')
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<ImportReport | null>(null)
  const [primary, setPrimary] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const latest = useRef(0)
  const resolveMediaUrl = useCallback((sha: string) => examsService.mediaUrl(sha), [examsService])

  const primaryOfExam = primaryClassification(exam)
  const firstImport = primaryOfExam === undefined
  const manualWeights = primaryOfExam?.weightMode === 'manual'

  async function dryRun(next: File, chosenPrimary: string | undefined) {
    const token = ++latest.current
    setBusy(true)
    setError(undefined)
    try {
      const result = await examsService.importQuestions(exam.id, next, chosenPrimary ? { dryRun: true, primary: chosenPrimary } : { dryRun: true })
      if (token !== latest.current) return
      setReport(result)
      setStep('report')
    } catch (e) {
      if (token === latest.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (token === latest.current) setBusy(false)
    }
  }

  function chooseFile(next: File) {
    const problem = importFileProblem(next)
    if (problem) {
      setError(problem)
      return
    }
    setFile(next)
    setPrimary(undefined)
    void dryRun(next, undefined)
  }

  function changePrimary(name: string) {
    if (!file) return
    setPrimary(name)
    void dryRun(file, name)
  }

  function restart() {
    latest.current++
    setStep('file')
    setFile(null)
    setReport(null)
    setPrimary(undefined)
    setError(undefined)
    setBusy(false)
  }

  async function apply() {
    if (!file || !report) return
    const chosen = firstImport ? (primary ?? report.primary ?? undefined) : undefined
    setBusy(true)
    setError(undefined)
    try {
      const result = await examsService.importQuestions(exam.id, file, chosen ? { dryRun: false, primary: chosen } : { dryRun: false })
      if (result.applied) {
        const c = result.counts
        showToast(`Import complete: ${c.create} created, ${c.update} updated, ${c.unchanged} unchanged`, 'success')
        navigate(`/studies/exams/${exam.id}`)
        return
      }
      // Nothing was written: back to the report, now with the errors the apply found.
      setReport(result)
      setStep('report')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const nothingToDo = report !== null && report.counts.create + report.counts.update === 0

  return (
    <ImportWizardTemplate back={{ to: `/studies/exams/${exam.id}`, label: exam.name }} title="Import questions" steps={<StepIndicator current={step} />}>

      {step === 'file' && <FilePicker onFile={chooseFile} busy={busy} error={error} />}

      {step === 'report' && report && file && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
            <span>{file.name}</span>
            <Button size="sm" variant="ghost" onClick={restart}>Choose another file</Button>
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <ImportReportView
            report={report}
            firstImport={firstImport}
            manualWeights={manualWeights}
            primary={primary}
            onPrimaryChange={changePrimary}
            busy={busy}
            resolveMediaUrl={resolveMediaUrl}
          />
          {nothingToDo && report.errors.length === 0 && <Text variant="body" color="muted">Nothing to import: all the questions are already in the bank.</Text>}
          <div className="flex gap-2">
            <Button disabled={busy || report.errors.length > 0 || nothingToDo} onClick={() => setStep('confirm')}>Import</Button>
          </div>
        </>
      )}

      {step === 'confirm' && report && (
        <section aria-label="Confirmation" className="flex max-w-xl flex-col gap-3">
          <Text variant="body" color="default">
            {`${countLabel(report.counts.create, 'question', 'questions')} will be created and ${report.counts.update} updated.`}
            {report.counts.unchanged > 0 && ` ${report.counts.unchanged} ${report.counts.unchanged === 1 ? 'is' : 'are'} already up to date.`}
          </Text>
          <Text variant="small" color="muted">All or nothing: if anything fails, nothing is written.</Text>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex gap-2">
            <Button onClick={() => void apply()} loading={busy}>Confirm import</Button>
            <Button variant="ghost" disabled={busy} onClick={() => setStep('report')}>Back</Button>
          </div>
        </section>
      )}
    </ImportWizardTemplate>
  )
}
