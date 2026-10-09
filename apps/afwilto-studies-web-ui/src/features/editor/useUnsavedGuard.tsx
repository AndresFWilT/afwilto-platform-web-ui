import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Dialog } from '@afwilto/design-system'

/** The in-app route an anchor click would open, or null if it is not an in-app navigation. */
function inAppTarget(anchor: HTMLAnchorElement): string | null {
  if (anchor.target && anchor.target !== '_self') return null
  if (anchor.hasAttribute('download')) return null
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#')) return null
  if (href.startsWith('/') && !href.startsWith('//')) return href
  try {
    const url = new URL(href, window.location.href)
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : null
  } catch {
    return null
  }
}

/**
 * AC-F8 within D-1: while `dirty`, in-app link clicks and `requestLeave` ask
 * through the design-system Dialog, and tab close / reload gets the browser's
 * own beforeunload prompt. The Back button is not covered: the shell's
 * declarative BrowserRouter has no blocker (Slice 09b §2.5). Never confirm().
 */
export function useUnsavedGuard(dirty: boolean): { requestLeave: (to: string) => void; dialog: ReactNode } {
  const navigate = useNavigate()
  const location = useLocation()
  const [pending, setPending] = useState<string | null>(null)
  const here = location.pathname + location.search + location.hash

  useEffect(() => {
    if (!dirty) return
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const to = inAppTarget(anchor)
      if (!to || to === here) return
      event.preventDefault() // no full page load; the router's Link skips prevented clicks
      setPending(to)
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = '' // legacy browsers need it to show their prompt
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [dirty, here])

  const requestLeave = (to: string) => (dirty ? setPending(to) : navigate(to))

  const dialog = pending ? (
    <Dialog
      open
      onClose={() => setPending(null)}
      title="Discard unsaved changes?"
      footer={
        <>
          <Button variant="ghost" onClick={() => setPending(null)}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={() => navigate(pending)}>
            Discard
          </Button>
        </>
      }
    >
      <p className="text-sm text-neutral-300">Your edits to this note will be lost.</p>
    </Dialog>
  ) : null

  return { requestLeave, dialog }
}
