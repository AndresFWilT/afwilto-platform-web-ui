// Scoring views of a closed attempt (Spec 18 FR-10, slice 09).
import type { CategoryScore, ClassificationScore, ReviewItem } from './attempt'

export type ReviewFilter = 'incorrect' | 'flagged' | 'all'

/**
 * The server's percent: integer half-up on hundredths, `(20000 × correct + total) / (2 × total)`,
 * so no float rounding can move a score across a pass mark. 0 when `total` is 0.
 */
export function percentOf(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.floor((20000 * correct + total) / (2 * total)) / 100
}

/** The server's name order: case-insensitive, then bytewise (code unit order). */
export function compareNames(a: string, b: string): number {
  const x = a.toLowerCase()
  const y = b.toLowerCase()
  if (x !== y) return x < y ? -1 : 1
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Per classification (by name), per category: correct / total / percent, weakest first (percent ascending, then name).
 * Only the in-memory adapter computes this; the HTTP adapter reads the server's `result`.
 */
export function buildBreakdown(review: ReviewItem[]): ClassificationScore[] {
  const tally = new Map<string, Map<string, { correct: number; total: number }>>()
  for (const item of review) {
    for (const { classification, name } of item.categories) {
      const categories = tally.get(classification) ?? new Map()
      const score = categories.get(name) ?? { correct: 0, total: 0 }
      score.total += 1
      if (item.reveal.correct) score.correct += 1
      categories.set(name, score)
      tally.set(classification, categories)
    }
  }
  return [...tally]
    .sort(([a], [b]) => compareNames(a, b))
    .map(([classification, categories]) => ({
      classification,
      categories: [...categories]
        .map<CategoryScore>(([name, { correct, total }]) => ({ name, correct, total, percent: percentOf(correct, total) }))
        .sort((a, b) => a.percent - b.percent || compareNames(a.name, b.name)),
    }))
}

export function filterReview(review: ReviewItem[], filter: ReviewFilter): ReviewItem[] {
  if (filter === 'incorrect') return review.filter((i) => !i.reveal.correct)
  if (filter === 'flagged') return review.filter((i) => i.flagged)
  return review
}
