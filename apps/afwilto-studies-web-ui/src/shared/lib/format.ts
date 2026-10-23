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
