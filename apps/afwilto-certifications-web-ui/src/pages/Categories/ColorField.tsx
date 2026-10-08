const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

interface ColorFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  error?: boolean
}

// Pairs a native color picker (a real OS/browser picker) with a text input
// showing/accepting the #RRGGBB value directly — free hex, no fixed palette.
export function ColorField({ id, value, onChange, error }: ColorFieldProps) {
  const pickerValue = isValidHexColor(value) ? value : '#000000'

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        aria-label="Pick color"
        value={pickerValue}
        onChange={e => onChange(e.target.value.toUpperCase())}
        className="h-10 w-14 shrink-0 rounded border border-surface-border bg-brand-800 cursor-pointer"
      />
      <input
        id={id}
        aria-label="Color"
        className={`w-full border bg-brand-800 text-neutral-100 placeholder-neutral-500 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 ${error ? 'border-red-500' : 'border-surface-border'}`}
        placeholder="#22D3EE"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
