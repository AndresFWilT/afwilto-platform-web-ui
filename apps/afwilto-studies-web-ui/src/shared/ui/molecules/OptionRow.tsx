import { MarkdownView } from '@/features/markdown/MarkdownView'
import { LetterBadge } from '../atoms/LetterBadge'
import { RevealMark } from '../atoms/RevealMark'
import { itemClasses, type OptionItemProps } from './optionItem'

/** T1/T2 option: letter badge + Markdown text, with its rationale below in review. */
export function OptionRow({ option, role, selected, inert, mark, rationale, resolveMediaUrl, onActivate }: OptionItemProps) {
  const activate = () => {
    if (!inert) onActivate(option.label)
  }
  return (
    <div className="flex flex-col gap-1">
      <div
        role={role}
        aria-checked={selected}
        aria-disabled={inert ? true : undefined}
        tabIndex={0}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key !== ' ') return
          e.preventDefault()
          activate()
        }}
        className={`flex items-start gap-3 ${itemClasses(selected, inert)}`}
      >
        <LetterBadge label={option.label} selected={selected} />
        <div className="min-w-0 flex-1 text-neutral-100 [&_p]:my-0">
          <MarkdownView content={option.text ?? ''} resolveMediaUrl={resolveMediaUrl} />
        </div>
        {mark && <RevealMark kind={mark} />}
      </div>
      {rationale && (
        <div className="pl-10 text-sm text-neutral-400 [&_p]:my-1">
          <MarkdownView content={rationale} resolveMediaUrl={resolveMediaUrl} />
        </div>
      )}
    </div>
  )
}
