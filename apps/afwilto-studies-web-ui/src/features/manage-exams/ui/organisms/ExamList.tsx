import { Link } from 'react-router-dom'
import type { ExamSummary } from '@/exams/domain'
import { countLabel, formatPercent } from '@/shared/lib/format'

function lastSimulationText(exam: ExamSummary): string {
  const last = exam.lastSimulation
  return last ? `Último simulacro: ${formatPercent(last.scorePercent)} · ${last.passed ? 'Aprobado' : 'No aprobado'}` : 'Sin simulacros todavía'
}

/** The exams of a subject: name, parameters, bank size and the last simulation. */
export function ExamList({ exams }: { exams: ExamSummary[] }) {
  return (
    <ul aria-label="Exámenes" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
      {exams.map((exam) => (
        <li key={exam.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex flex-col gap-1">
            <Link to={`/studies/exams/${exam.id}`} className="font-medium text-neutral-100 hover:text-primary-300">
              {exam.name}
            </Link>
            <span className="text-xs text-neutral-500">
              {countLabel(exam.questionCount, 'pregunta', 'preguntas')} · {exam.timeLimitMin} min · aprobado con {exam.passPercent} %
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <span className="text-neutral-200">{countLabel(exam.questionTotal, 'pregunta', 'preguntas')}</span>
            <span className="text-xs text-neutral-400">{lastSimulationText(exam)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
