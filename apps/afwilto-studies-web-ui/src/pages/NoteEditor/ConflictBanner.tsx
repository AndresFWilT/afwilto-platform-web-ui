import { useState } from 'react'
import { Alert, Button } from '@afwilto/design-system'

type CopyState = 'idle' | 'copied' | 'failed'

/** AC-F9: the note changed elsewhere; keep the user's text and offer both ways out. */
export function ConflictBanner({ content, onReload }: { content: string; onReload: () => void }) {
  const [copy, setCopy] = useState<CopyState>('idle')

  async function copyText() {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(content)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <Alert variant="warning" title="Edit conflict">
      <div className="flex flex-col gap-2">
        <p>Your text is still here. Reload the latest version, or copy your text first.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onReload}>Reload latest</Button>
          <Button size="sm" variant="ghost" onClick={copyText}>Copy my text</Button>
          {copy !== 'idle' && <span aria-live="polite" className="text-xs">{copy === 'copied' ? 'Copied' : 'Copy failed'}</span>}
        </div>
      </div>
    </Alert>
  )
}
