import { Input } from '@afwilto/design-system'
import { Field } from '../shared/Field'

const HEX = /^#[0-9A-Fa-f]{6}$/

/** Hex text field with a live swatch (as the certifications ColorField; copied, not shared). */
export function ColorField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const swatch = HEX.test(value.trim()) ? value.trim() : 'transparent'
  return (
    <Field label="Color" error={error}>
      {(props) => (
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-8 w-8 shrink-0 rounded border border-surface-border"
            style={{ backgroundColor: swatch }}
          />
          <Input {...props} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#22D3EE" error={Boolean(error)} />
        </div>
      )}
    </Field>
  )
}
