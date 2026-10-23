/** `78.5 %`, `60 %`: one decimal at most. */
export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : Math.round(value * 10) / 10} %`
}

/** Plural-aware count: `1 pregunta`, `13 preguntas`. */
export function countLabel(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
