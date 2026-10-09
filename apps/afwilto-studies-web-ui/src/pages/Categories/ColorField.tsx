import { Input } from '@afwilto/design-system'
import { trimSpace } from '@/domain/validation'
import { Field } from '../shared/Field'

const HEX = /^#[0-9A-Fa-f]{6}$/

/**
 * As the certifications ColorField (copied, not shared): a native color picker
 * (the OS/browser one) paired with the #RRGGBB text field, so any hex works.
 */
export function ColorField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const hex = trimSpace(value)
  const pickerValue = HEX.test(hex) ? hex.toLowerCase() : '#000000'
  return (
    <Field label="Color" error={error}>
      {(props) => (
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Pick color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-10 w-14 shrink-0 cursor-pointer rounded border border-surface-border bg-brand-800"
          />
          <Input
            {...props}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#22D3EE"
            className="font-mono"
            error={Boolean(error)}
          />
        </div>
      )}
    </Field>
  )
}
