import { useEffect, useState } from 'react'

const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/**
 * Whether a media query matches, tracked live. Used where Tailwind's
 * responsive display utilities are unreliable: the shell and this remote ship
 * separate Tailwind builds, so `lg:block` can lose to the other build's
 * `.hidden` by stylesheet order (Slice 09b amendment). Without matchMedia
 * (jsdom, old engines) it returns `fallback`.
 */
export function useMediaQuery(query: string, fallback: boolean): boolean {
  const [matches, setMatches] = useState(() => (supported() ? window.matchMedia(query).matches : fallback))
  useEffect(() => {
    if (!supported()) return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    // Safari < 14 only has the deprecated addListener/removeListener pair.
    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    }
    list.addListener(onChange)
    return () => list.removeListener(onChange)
  }, [query])
  return matches
}
