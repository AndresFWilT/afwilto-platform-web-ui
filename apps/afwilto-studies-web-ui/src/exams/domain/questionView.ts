import type { ExamQuestion, RevealInfo, ViewQuestion } from './types'

/** What `QuestionView` draws: the question without its answer key. */
export function toViewQuestion(q: ExamQuestion): ViewQuestion {
  return {
    type: q.type,
    stem: q.stem,
    chooseCount: q.options.filter((o) => o.correct).length,
    options: q.options.map(({ label, text, image, alt }) => ({ label, text, image, alt })),
  }
}

/** The answer key, rationales and explanation for the reveal mode. */
export function toRevealInfo(q: ExamQuestion): RevealInfo {
  return {
    correctLabels: q.options.filter((o) => o.correct).map((o) => o.label),
    rationales: Object.fromEntries(q.options.flatMap((o) => (o.rationale ? [[o.label, o.rationale]] : []))),
    explanation: q.explanation,
  }
}
