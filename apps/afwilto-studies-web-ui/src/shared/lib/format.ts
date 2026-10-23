/** `78.5 %`, `60 %`: one decimal at most. */
export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : Math.round(value * 10) / 10} %`
}

/** Plural-aware count: `1 pregunta`, `13 preguntas`. */
export function countLabel(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** `2026-10-22` (UTC): stable across viewer time zones. */
export function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

/** Whole minutes of a duration in seconds: `50 min`. */
export function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`
}

/** One decimal at most, no trailing zero: `2`, `0.9`. */
export function formatNumber(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** A duration in seconds: `45 s`, `30 min`, `1 min 30 s`, `2 h 10 min`. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
  if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`
  return `${s} s`
}
