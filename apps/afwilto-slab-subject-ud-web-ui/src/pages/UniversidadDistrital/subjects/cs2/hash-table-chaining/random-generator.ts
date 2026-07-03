import type { HashEntry } from '@/application/ports/IHashTableService'

// Generates `count` unique random entries — pure frontend helper, no round-trip.
// Mirrors the legacy generarAleatoriamente + generos dedup logic.
export function randomEntries(count: number, maxKey = 200): HashEntry[] {
  if (count <= 0 || count > maxKey) {
    throw new Error(`count must be between 1 and maxKey (${maxKey})`)
  }
  const used = new Set<number>()
  const entries: HashEntry[] = []
  let attempts = 0

  while (entries.length < count && attempts < count * 10) {
    attempts++
    const key = Math.floor(Math.random() * maxKey)
    if (used.has(key)) continue
    used.add(key)
    entries.push({ key, label: randomLabel() })
  }

  if (entries.length < count) {
    throw new Error(`Could not generate ${count} unique keys in range [0, ${maxKey})`)
  }
  return entries
}

function randomLabel(): string {
  const base = 'a'.charCodeAt(0)
  return (
    String.fromCharCode(base + Math.floor(Math.random() * 26)) +
    String.fromCharCode(base + Math.floor(Math.random() * 26))
  )
}
