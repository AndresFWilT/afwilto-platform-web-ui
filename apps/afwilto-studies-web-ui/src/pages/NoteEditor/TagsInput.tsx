import { useState, type KeyboardEvent } from 'react'
import { Input } from '@afwilto/design-system'
import { addTag } from '@/domain/tags'
import { Field } from '../shared/Field'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  /** The text typed but not yet added; the page owns it so Save can commit it. */
  draft: string
  onDraftChange: (draft: string) => void
  /** A tag error from the page (pending draft at save time, or the server). */
  error?: string
}

/** Enter or a comma adds the normalized tag as a chip (FR-5); duplicates merge. */
export function TagsInput({ tags, onChange, draft, onDraftChange, error: pageError }: Props) {
  const [error, setError] = useState<string>()

  function commit() {
    const result = addTag(tags, draft)
    setError(result.error)
    if (!result.error) {
      onDraftChange('')
      if (result.tags !== tags) onChange(result.tags)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Field label="Tags" error={error ?? pageError}>
        {(props) => (
          <Input
            {...props}
            value={draft}
            placeholder="Type a tag and press Enter"
            onChange={(e) => {
              setError(undefined)
              onDraftChange(e.target.value)
            }}
            onKeyDown={onKeyDown}
            onBlur={() => draft.trim() && commit()}
            error={Boolean(error ?? pageError)}
          />
        )}
      </Field>
      {tags.length > 0 && (
        <ul aria-label="Selected tags" className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-brand-700 px-2.5 py-0.5 text-xs text-neutral-100">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => onChange(tags.filter((t) => t !== tag))}
                  className="text-neutral-400 hover:text-neutral-100"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
