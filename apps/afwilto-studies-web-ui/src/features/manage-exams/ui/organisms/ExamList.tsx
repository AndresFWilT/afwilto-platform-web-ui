import { Link } from 'react-router-dom'
import type { ExamSummary } from '@/exams/domain'
import { countLabel, formatPercent } from '@/shared/lib/format'

function lastSimulationText(exam: ExamSummary): string {
  const last = exam.lastSimulation
  return last ? `Last simulation: ${formatPercent(last.scorePercent)} · ${last.passed ? 'Passed' : 'Not passed'}` : 'No simulations yet'
}

/** The exams of a subject: name, parameters, bank size and the last simulation. */
export function ExamList({ exams }: { exams: ExamSummary[] }) {
  return (
    <ul aria-label="Exams" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
      {exams.map((exam) => (
        <li key={exam.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex flex-col gap-1">
            <Link to={`/studies/exams/${exam.id}`} className="font-medium text-neutral-100 hover:text-primary-300">
              {exam.name}
            </Link>
            <span className="text-xs text-neutral-500">
              {countLabel(exam.questionCount, 'question', 'questions')} · {exam.timeLimitMin} min · pass at {exam.passPercent}%
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <span className="text-neutral-200">{countLabel(exam.questionTotal, 'question', 'questions')}</span>
            <span className="text-xs text-neutral-400">{lastSimulationText(exam)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
