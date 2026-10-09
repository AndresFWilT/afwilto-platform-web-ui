import { Button, Input } from '@afwilto/design-system'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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
  // Columns chosen in JS: `grid-cols-1 sm:grid-cols-[…]` loses to the shell's Tailwind build.
  const wide = useMediaQuery('(min-width: 640px)', true)
  const update = (i: number, patch: Partial<SlabLink>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-neutral-100">Related in slab</legend>
      {links.map((link, i) => (
        <div key={i} className="grid items-start gap-2" style={{ gridTemplateColumns: wide ? '1fr 1fr auto' : '1fr' }}>
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
