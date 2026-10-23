// Scoring views of a closed attempt (Spec 18 FR-10, slice 09).
import type { CategoryScore, ClassificationScore, ReviewItem } from './attempt'

export type ReviewFilter = 'incorrect' | 'flagged' | 'all'

const round2 = (value: number) => Math.round(value * 100) / 100

/** Per classification, per category: correct / total / percent, weakest first (percent ascending, then name). */
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
  return [...tally].map(([classification, categories]) => ({
    classification,
    categories: [...categories]
      .map<CategoryScore>(([name, { correct, total }]) => ({ name, correct, total, percent: round2((100 * correct) / total) }))
      .sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name)),
  }))
}

export function filterReview(review: ReviewItem[], filter: ReviewFilter): ReviewItem[] {
  if (filter === 'incorrect') return review.filter((i) => !i.reveal.correct)
  if (filter === 'flagged') return review.filter((i) => i.flagged)
  return review
}
