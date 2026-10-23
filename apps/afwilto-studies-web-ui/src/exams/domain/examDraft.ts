import type { Exam, UpdateExamInput } from './exam'
import { validateExamInput, type ExamFormValues } from './examValidation'

/** What the edit form holds while the user types: everything as text, keyed by id. */
export interface ExamDraft {
  params: ExamFormValues
  /** Classification id → name. */
  classificationNames: Record<string, string>
  /** The classification chosen as primary. */
  primaryId: string | null
  /** Category id → name and pace pair. */
  categories: Record<string, { name: string; paceQuestions: string; paceMinutes: string }>
  /** Primary category id → weight. */
  weights: Record<string, string>
}

export interface DraftCheck {
  /** The edit to send; absent when nothing changed. */
  patch?: UpdateExamInput
  /** Messages by key: a form field (`name`…), `classification:<id>`, `category:<id>`, `pace:<id>` or `weights`. Empty when sendable. */
  problems: Record<string, string>
  /** Sum of the primary weights in the draft (a blank counts as 0). */
  weightsSum: number
}

const PACE_MESSAGE = 'Indica ambos valores del ritmo o ninguno (enteros desde 1)'
const INTEGER = /^\d+$/

function allCategories(exam: Exam) {
  return exam.classifications.flatMap((c) => c.categories)
}

export function draftFrom(exam: Exam): ExamDraft {
  const primary = exam.classifications.find((c) => c.position === 0)
  return {
    params: {
      name: exam.name,
      questionCount: String(exam.questionCount),
      timeLimitMin: String(exam.timeLimitMin),
      passPercent: String(exam.passPercent),
    },
    classificationNames: Object.fromEntries(exam.classifications.map((c) => [c.id, c.name])),
    primaryId: primary?.id ?? null,
    categories: Object.fromEntries(
      allCategories(exam).map((c) => [c.id, { name: c.name, paceQuestions: c.paceQuestions?.toString() ?? '', paceMinutes: c.paceMinutes?.toString() ?? '' }])
    ),
    weights: Object.fromEntries((primary?.categories ?? []).map((c) => [c.id, c.weightPercent?.toString() ?? ''])),
  }
}

/** Compares the draft with the exam it was made from and builds the minimal atomic edit. */
export function checkDraft(exam: Exam, draft: ExamDraft): DraftCheck {
  const problems: Record<string, string> = {}
  const patch: UpdateExamInput = { version: exam.version }
  let changed = false

  // Parameters
  const params = validateExamInput(draft.params)
  Object.assign(problems, params.errors)
  if (params.value) {
    for (const field of ['name', 'questionCount', 'timeLimitMin', 'passPercent'] as const) {
      if (params.value[field] !== exam[field]) {
        Object.assign(patch, { [field]: params.value[field] })
        changed = true
      }
    }
  }

  // Classification names
  const renamedClassifications: NonNullable<UpdateExamInput['classifications']> = []
  for (const c of exam.classifications) {
    const name = (draft.classificationNames[c.id] ?? c.name).trim()
    if (name === '') problems[`classification:${c.id}`] = 'El nombre es obligatorio'
    else if (name !== c.name) renamedClassifications.push({ id: c.id, name })
  }
  if (renamedClassifications.length) {
    patch.classifications = renamedClassifications
    changed = true
  }

  // Category names and pace pairs
  const editedCategories: NonNullable<UpdateExamInput['categories']> = []
  for (const c of allCategories(exam)) {
    const d = draft.categories[c.id]
    if (!d) continue
    const edit: NonNullable<UpdateExamInput['categories']>[number] = { id: c.id }
    const name = d.name.trim()
    if (name === '') problems[`category:${c.id}`] = 'El nombre es obligatorio'
    else if (name !== c.name) edit.name = name

    const q = d.paceQuestions.trim()
    const m = d.paceMinutes.trim()
    if (q !== (c.paceQuestions?.toString() ?? '') || m !== (c.paceMinutes?.toString() ?? '')) {
      const valid = (v: string) => INTEGER.test(v) && Number(v) >= 1
      if (q === '' && m === '') Object.assign(edit, { paceQuestions: null, paceMinutes: null })
      else if (valid(q) && valid(m)) Object.assign(edit, { paceQuestions: Number(q), paceMinutes: Number(m) })
      else problems[`pace:${c.id}`] = PACE_MESSAGE
    }
    if (Object.keys(edit).length > 1) editedCategories.push(edit)
  }
  if (editedCategories.length) {
    patch.categories = editedCategories
    changed = true
  }

  // Primary swap and weights
  const primary = exam.classifications.find((c) => c.position === 0)
  const swapped = draft.primaryId !== null && primary !== undefined && draft.primaryId !== primary.id
  if (swapped) {
    patch.primaryClassificationId = draft.primaryId!
    changed = true
  }
  let weightsSum = 0
  if (primary) {
    const entries = primary.categories.map((c) => ({ id: c.id, raw: (draft.weights[c.id] ?? '').trim(), original: c.weightPercent?.toString() ?? '' }))
    weightsSum = entries.reduce((sum, e) => sum + (INTEGER.test(e.raw) ? Number(e.raw) : 0), 0)
    const dirty = entries.some((e) => e.raw !== e.original)
    if (dirty && !swapped) {
      if (entries.some((e) => e.raw !== '' && !INTEGER.test(e.raw))) problems.weights = 'Los pesos son enteros de 0 a 100'
      else if (weightsSum !== 100) problems.weights = 'Los pesos deben sumar 100'
      else {
        patch.weights = entries.map((e) => ({ categoryId: e.id, percent: e.raw === '' ? 0 : Number(e.raw) }))
        changed = true
      }
    }
  }

  return Object.keys(problems).length === 0 && changed ? { patch, problems, weightsSum } : { problems, weightsSum }
}
