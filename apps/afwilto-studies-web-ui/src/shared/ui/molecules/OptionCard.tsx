import { MarkdownView } from '@/features/markdown/MarkdownView'
import { LetterBadge } from '../atoms/LetterBadge'
import { RevealMark } from '../atoms/RevealMark'
import { SafeImage } from '../atoms/SafeImage'
import { itemClasses, shaOf, type OptionItemProps } from './optionItem'

/** T3 option: badge, a 4:3 `object-contain` image and the optional text below. Text-only options use the same card. */
export function OptionCard({ option, role, selected, inert, mark, rationale, resolveMediaUrl, onActivate }: OptionItemProps) {
  const activate = () => {
    if (!inert) onActivate(option.label)
  }
  const sha = shaOf(option.image)
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
        className={`flex h-full flex-col gap-2 ${itemClasses(selected, inert)}`}
      >
        <div className="flex items-center justify-between gap-2">
          <LetterBadge label={option.label} selected={selected} />
          {mark && <RevealMark kind={mark} />}
        </div>
        {option.image !== undefined && (
          <div className="aspect-[4/3] w-full overflow-hidden rounded bg-surface-overlay">
            <SafeImage
              src={sha ? resolveMediaUrl(sha) : null}
              alt={option.alt ?? ''}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        {option.text && (
          <div className="text-sm text-neutral-100 [&_p]:my-0">
            <MarkdownView content={option.text} resolveMediaUrl={resolveMediaUrl} />
          </div>
        )}
      </div>
      {rationale && (
        <div className="text-sm text-neutral-400 [&_p]:my-1">
          <MarkdownView content={rationale} resolveMediaUrl={resolveMediaUrl} />
        </div>
      )}
    </div>
  )
}
