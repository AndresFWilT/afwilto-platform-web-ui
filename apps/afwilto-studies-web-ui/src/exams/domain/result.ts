// Scoring views of a closed attempt (Spec 18 FR-10, slice 09).
import type { ClassificationScore, ReviewItem } from './attempt'

export type ReviewFilter = 'incorrect' | 'flagged' | 'all'

/** Per classification, per category: correct / total / percent, weakest first. */
export function buildBreakdown(_review: ReviewItem[]): ClassificationScore[] {
  throw new Error('not implemented')
}

export function filterReview(_review: ReviewItem[], _filter: ReviewFilter): ReviewItem[] {
  throw new Error('not implemented')
}
