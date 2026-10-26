import type { KeyboardEvent } from 'react'
import { MarkdownView } from '@/features/markdown/MarkdownView'
import { chooseTemplate, splitMediaStem, type RevealInfo, type ViewQuestion } from '@/exams/domain'
import type { RevealMarkKind } from '../atoms/RevealMark'
import { ChooseBadge } from '../molecules/ChooseBadge'
import { MediaFrame } from '../molecules/MediaFrame'
import { OptionCard } from '../molecules/OptionCard'
import { OptionRow } from '../molecules/OptionRow'

export interface QuestionViewProps {
  question: ViewQuestion
  selected: string[]
  onToggle: (label: string) => void
  disabled?: boolean
  reveal?: RevealInfo
  /** Keep this function's identity stable: the Markdown pipeline re-runs when it changes. */
  resolveMediaUrl: (sha256: string) => string | null
}

function markOf(label: string, selected: boolean, reveal: RevealInfo | undefined): RevealMarkKind | undefined {
  if (!reveal) return undefined
  const correct = reveal.correctLabels.includes(label)
  if (selected) return correct ? 'right' : 'wrong'
  return correct ? 'correct' : undefined
}

/**
 * One question in whichever template its content calls for (FR-11). Data in, events out:
 * the selection and the answer key come from the page that owns them.
 */
export function QuestionView({ question, selected, onToggle, disabled = false, reveal, resolveMediaUrl }: QuestionViewProps) {
  const template = chooseTemplate(question)
  const multi = question.type === 'multi'
  const atLimit = multi && selected.length >= question.chooseCount
  const isInert = (label: string) => disabled || (atLimit && !selected.includes(label))
  const activate = (label: string) => {
    if (!isInert(label)) onToggle(label)
  }

  // 1–6 pick the option in that position; F, arrows and Enter belong to the runner.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !/^[1-6]$/.test(e.key)) return
    const option = question.options[Number(e.key) - 1]
    if (!option) return
    e.preventDefault()
    activate(option.label)
  }

  const { text: stemText, images } = template === 'media-stem' ? splitMediaStem(question.stem) : { text: question.stem, images: [] }

  const optionProps = (label: string) => ({
    role: multi ? ('checkbox' as const) : ('radio' as const),
    selected: selected.includes(label),
    inert: isInert(label),
    mark: markOf(label, selected.includes(label), reveal),
    rationale: reveal?.rationales[label],
    resolveMediaUrl,
    onActivate: activate,
  })

  const group = (className: string, Item: typeof OptionRow | typeof OptionCard) => (
    <div role={multi ? 'group' : 'radiogroup'} aria-label="Answer options" className={className}>
      {question.options.map((option) => (
        <Item key={option.label} option={option} {...optionProps(option.label)} />
      ))}
    </div>
  )

  return (
    <section data-template={template} onKeyDown={onKeyDown} className="flex flex-col gap-4">
      {stemText && (
        <div className="text-neutral-100">
          <MarkdownView content={stemText} resolveMediaUrl={resolveMediaUrl} />
        </div>
      )}
      {multi && <ChooseBadge chooseCount={question.chooseCount} selectedCount={selected.length} />}

      {template === 'text-list' && group('flex flex-col gap-2', OptionRow)}

      {template === 'media-stem' && (
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex basis-[28rem] grow flex-col gap-3">
            {images.map((image) => (
              <MediaFrame key={image.sha} src={resolveMediaUrl(image.sha)} alt={image.alt} />
            ))}
          </div>
          {group('flex basis-[22rem] grow flex-col gap-2', OptionRow)}
        </div>
      )}

      {template === 'option-cards' && group('grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3', OptionCard)}

      {reveal?.explanation && (
        <section aria-label="Explanation" className="rounded-lg border border-surface-border bg-surface-raised p-4">
          <h4 className="mb-2 font-semibold text-neutral-100">Explanation</h4>
          <MarkdownView content={reveal.explanation} resolveMediaUrl={resolveMediaUrl} />
        </section>
      )}
    </section>
  )
}
