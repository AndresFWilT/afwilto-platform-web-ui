import { Alert } from '@afwilto/design-system'

interface Props {
  onFile: (file: File) => void
  busy: boolean
  error?: string
}

/** Step 1: choose a .json or .zip. Choosing it starts the dry run. */
export function FilePicker({ onFile, busy, error }: Props) {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <label htmlFor="import-file" className="text-sm font-medium text-neutral-100">File</label>
      <input
        id="import-file"
        type="file"
        accept=".json,.zip"
        aria-label="Questions file"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
        className="text-sm text-neutral-200 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-neutral-100"
      />
      <p className="text-xs text-neutral-400">Accepts .json (up to 10 MiB) or .zip with images (up to 50 MiB).</p>
      {busy && <p aria-busy="true" className="text-sm text-neutral-300">Analyzing the file…</p>}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  )
}
