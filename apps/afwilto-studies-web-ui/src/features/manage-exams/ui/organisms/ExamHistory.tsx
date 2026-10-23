import { Link } from 'react-router-dom'
import { Text } from '@afwilto/design-system'
import type { AttemptHistory, AttemptSummary } from '@/exams/domain'
import { formatDate, formatMinutes, formatPercent } from '@/shared/lib/format'

const SELECTION: Record<AttemptSummary['selectionKind'], string> = {
  simulation: 'Simulacro',
  random: 'Aleatorio',
  categories: 'Por categorías',
  'origin-set': 'Por conjunto',
}
const TIMING: Record<AttemptSummary['timingKind'], string> = { timed: 'Con tiempo', untimed: 'Sin tiempo' }
const FEEDBACK: Record<AttemptSummary['feedback'], string> = { end: 'Respuestas al final', each: 'Respuestas tras cada pregunta' }

function Sparkline({ points }: { points: AttemptHistory['trend'] }) {
  const width = 240
  const height = 48
  const step = width / (points.length - 1)
  const path = points.map((p, i) => `${(i * step).toFixed(1)},${(height - (p.scorePercent / 100) * height).toFixed(1)}`).join(' ')
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className="h-12 w-60 text-primary-300">
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

/** The attempts of an exam, newest first, and the simulation-only trend (D-11). */
export function ExamHistory({ history }: { history: AttemptHistory }) {
  return (
    <>
      <section aria-label="Historial" className="flex flex-col gap-2">
        <Text variant="h3" color="default">Historial</Text>
        {history.attempts.length === 0 ? (
          <Text variant="body" color="muted">Aún no hay intentos</Text>
        ) : (
          <ul className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
            {history.attempts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <span className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-neutral-100">{SELECTION[a.selectionKind]}</span>
                  <span className="text-neutral-400">{formatDate(a.startedAt)}</span>
                  <span className="text-xs text-neutral-500">{TIMING[a.timingKind]} · {FEEDBACK[a.feedback]}</span>
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  {a.status === 'in_progress' ? (
                    <Link to={`/studies/attempts/${a.id}`} className="text-primary-300 hover:text-primary-200">En curso</Link>
                  ) : (
                    <>
                      {a.scorePercent !== undefined && <span className="text-neutral-100">{formatPercent(a.scorePercent)}</span>}
                      {a.passed !== undefined && <span className={a.passed ? 'text-green-400' : 'text-red-400'}>{a.passed ? 'Aprobado' : 'No aprobado'}</span>}
                      {a.durationSeconds !== undefined && <span className="text-neutral-400">{formatMinutes(a.durationSeconds)}</span>}
                      <Link to={`/studies/attempts/${a.id}/result`} className="text-primary-300 hover:text-primary-200">Ver resultado</Link>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {history.trend.length > 0 && (
        <section aria-label="Tendencia" className="flex flex-col gap-2">
          <Text variant="h3" color="default">Tendencia</Text>
          <p className="text-xs text-neutral-500">Solo cuentan los simulacros reales.</p>
          {history.trend.length > 1 && <Sparkline points={history.trend} />}
          <ol aria-label="Tendencia de simulacros" className="flex flex-col gap-1 text-sm text-neutral-300">
            {history.trend.map((p) => (
              <li key={p.at}>{formatDate(p.at)} · {formatPercent(p.scorePercent)}</li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}
