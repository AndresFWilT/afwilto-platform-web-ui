import type { ReactNode } from 'react'
import { Alert, Text } from '@afwilto/design-system'
import { toRevealInfo, toViewQuestion, type ImportReport } from '@/exams/domain'
import { QuestionView } from '@/shared/ui/organisms/QuestionView'

interface Props {
  report: ImportReport
  /** The exam has no primary classification yet: the owner chooses it. */
  firstImport: boolean
  /** The exam's primary weights are fixed by hand. */
  manualWeights: boolean
  /** The primary classification currently chosen. */
  primary?: string
  onPrimaryChange: (name: string) => void
  busy: boolean
  /** Keep this function's identity stable. */
  resolveMediaUrl: (sha256: string) => string | null
}

const NO_SELECTION: string[] = []
const noop = () => {}

function Section({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section aria-label={name} className="flex flex-col gap-2">
      <Text variant="h3" color="default">{name}</Text>
      {children}
    </section>
  )
}

function groupByRule(errors: ImportReport['errors']): Array<[string, ImportReport['errors']]> {
  const groups = new Map<string, ImportReport['errors']>()
  for (const e of errors) groups.set(e.rule, [...(groups.get(e.rule) ?? []), e])
  return [...groups]
}

const list = 'flex flex-col gap-1 text-sm text-neutral-200'

/** The dry-run report, section by section in the order of the spec (slice 08 §1). */
export function ImportReportView({ report, firstImport, manualWeights, primary, onPrimaryChange, busy, resolveMediaUrl }: Props) {
  const chosen = primary ?? report.primary ?? undefined
  const { counts, media } = report
  const hasMedia = media.referenced > 0 || media.inZip > 0 || media.missing.length > 0 || media.unused.length > 0

  return (
    <div className="flex flex-col gap-6">
      {report.errors.length > 0 && (
        <Section name="Errors">
          {groupByRule(report.errors).map(([rule, errors]) => (
            <div key={rule} className="flex flex-col gap-1">
              <h4 className="font-mono text-sm font-semibold text-red-300">{rule}</h4>
              <ul aria-label={`Rule ${rule}`} className={list}>
                {errors.map((e) => (
                  <li key={`${e.path}:${e.message}`} className="flex flex-wrap gap-2">
                    <code className="text-red-200">{e.path}</code>
                    <span>{e.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      <Section name="Counts">
        <ul className={list}>
          <li>{counts.create} to create</li>
          <li>{counts.update} to update</li>
          <li>{counts.unchanged} unchanged</li>
          {counts.invalid > 0 && <li>{counts.invalid} invalid</li>}
        </ul>
      </Section>

      {report.newClassifications.length > 0 && (
        <Section name="New classifications">
          {firstImport ? (
            <div role="radiogroup" aria-label="Primary classification" className={list}>
              <p className="text-xs text-neutral-400">Choose the primary classification: its categories carry weight in the full simulation.</p>
              {report.newClassifications.map((c) => (
                <label key={c.name} className="flex items-center gap-2">
                  <input type="radio" name="primary-classification" value={c.name} checked={chosen === c.name} disabled={busy} onChange={() => onPrimaryChange(c.name)} />
                  {c.name}
                </label>
              ))}
            </div>
          ) : (
            <ul className={list}>{report.newClassifications.map((c) => <li key={c.name}>{c.name}</li>)}</ul>
          )}
        </Section>
      )}

      {report.newCategories.length > 0 && (
        <Section name="New categories">
          {manualWeights && (
            <Alert variant="info">New categories start with weight 0 until you assign one: they are not part of the full simulation.</Alert>
          )}
          <ul className={list}>
            {report.newCategories.map((c) => (
              <li key={`${c.classification}/${c.name}`}>
                {c.classification} / {c.name}
                {c.similarTo.length > 0 && (
                  <span className="ml-2 text-amber-300">“{c.name}” is similar to {c.similarTo.map((s) => `“${s}”`).join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(report.weightsAfter.length > 0 || report.warnings.length > 0) && (
        <Section name="Resulting weights">
          <ul className={list}>
            {report.weightsAfter.map((w) => (
              <li key={w.category}>{`${w.category}: ${w.percent}% (${w.mode === 'inferred' ? 'inferred' : 'manual'})`}</li>
            ))}
          </ul>
          {report.warnings.map((w) => (
            <Alert key={w} variant="warning">{w}</Alert>
          ))}
        </Section>
      )}

      {report.duplicateStems.length > 0 && (
        <Section name="Duplicates">
          <ul className={list}>
            {report.duplicateStems.map((d) => (
              <li key={d.key}>“{d.key}” has the same stem as “{d.existingKey}”</li>
            ))}
          </ul>
        </Section>
      )}

      {hasMedia && (
        <Section name="Media">
          <ul className={list}>
            <li>{media.referenced} referenced · {media.inZip} in the zip</li>
            {media.missing.length > 0 && <li className="text-red-300">Missing: {media.missing.join(', ')}</li>}
            {media.unused.length > 0 && <li className="text-amber-300">Unused: {media.unused.join(', ')}</li>}
          </ul>
        </Section>
      )}

      {report.preview.length > 0 && (
        <Section name="Preview">
          {report.preview.slice(0, 5).map((q) => (
            <article key={q.key} aria-label={`Question ${q.key}`} className="flex flex-col gap-2 rounded-lg border border-surface-border p-4">
              <code className="text-xs text-neutral-400">{q.key}</code>
              <QuestionView question={toViewQuestion(q)} selected={NO_SELECTION} onToggle={noop} disabled reveal={toRevealInfo(q)} resolveMediaUrl={resolveMediaUrl} />
            </article>
          ))}
        </Section>
      )}
    </div>
  )
}
