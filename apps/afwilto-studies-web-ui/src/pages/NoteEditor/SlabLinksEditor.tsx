import { Button, Input } from '@afwilto/design-system'
import type { SlabLink } from '@/application/ports'
import { MAX_SLAB_LINKS } from '@/domain/noteValidation'
import { Field } from '../shared/Field'

interface Props {
  links: SlabLink[]
  onChange: (links: SlabLink[]) => void
  /** Errors keyed like the API: `slabLinks[0].label`, `slabLinks[0].path`, `slabLinks`. */
  errors: Record<string, string>
}

/** "Related in slab" links, in order: label + /slab path rows (FR-6, at most 10). */
export function SlabLinksEditor({ links, onChange, errors }: Props) {
  const update = (i: number, patch: Partial<SlabLink>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-neutral-100">Related in slab</legend>
      {links.map((link, i) => (
        <div key={i} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Field label={`Link ${i + 1} label`} error={errors[`slabLinks[${i}].label`]}>
            {(props) => <Input {...props} value={link.label} onChange={(e) => update(i, { label: e.target.value })} />}
          </Field>
          <Field label={`Link ${i + 1} path`} error={errors[`slabLinks[${i}].path`]}>
            {(props) => (
              <Input {...props} value={link.path} placeholder="/slab/ud/operative-systems" onChange={(e) => update(i, { path: e.target.value })} />
            )}
          </Field>
          <Button type="button" size="sm" variant="ghost" className="sm:mt-7" aria-label={`Remove link ${i + 1}`}
            onClick={() => onChange(links.filter((_, j) => j !== i))}>
            Remove
          </Button>
        </div>
      ))}
      {errors['slabLinks'] && <p className="text-xs text-red-400">{errors['slabLinks']}</p>}
      {links.length < MAX_SLAB_LINKS && (
        <Button type="button" size="sm" variant="secondary" className="self-start" onClick={() => onChange([...links, { label: '', path: '' }])}>
          Add slab link
        </Button>
      )}
    </fieldset>
  )
}
