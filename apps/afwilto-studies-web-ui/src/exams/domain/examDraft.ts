import type { Exam, UpdateExamInput } from './exam'
import {
  CATEGORY_NAME_MAX,
  CLASSIFICATION_NAME_MAX,
  EXAM_NAME_MAX,
  EXAM_RANGES,
  PACE_MAX,
  WEIGHT_MAX,
  validateExamInput,
  type ExamFormValues,
} from './examValidation'

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
const PACE_RANGE_MESSAGE = 'El ritmo admite enteros de 1 a 10 000'
const WEIGHT_RANGE_MESSAGE = `Los pesos son enteros de 0 a ${WEIGHT_MAX}`
const WEIGHTS_SUM_MESSAGE = 'Los pesos deben sumar 100'
const INVALID_TEXT_MESSAGE = 'El texto contiene caracteres no permitidos'
const nameTooLong = (max: number) => `El nombre admite hasta ${max} caracteres`
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
    else if (name.length > CLASSIFICATION_NAME_MAX) problems[`classification:${c.id}`] = nameTooLong(CLASSIFICATION_NAME_MAX)
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
    else if (name.length > CATEGORY_NAME_MAX) problems[`category:${c.id}`] = nameTooLong(CATEGORY_NAME_MAX)
    else if (name !== c.name) edit.name = name

    const q = d.paceQuestions.trim()
    const m = d.paceMinutes.trim()
    if (q !== (c.paceQuestions?.toString() ?? '') || m !== (c.paceMinutes?.toString() ?? '')) {
      const valid = (v: string) => INTEGER.test(v) && Number(v) >= 1
      const outOfRange = (v: string) => valid(v) && Number(v) > PACE_MAX
      if (q === '' && m === '') Object.assign(edit, { paceQuestions: null, paceMinutes: null })
      else if (outOfRange(q) || outOfRange(m)) problems[`pace:${c.id}`] = PACE_RANGE_MESSAGE
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
      if (entries.some((e) => e.raw !== '' && (!INTEGER.test(e.raw) || Number(e.raw) > WEIGHT_MAX))) problems.weights = WEIGHT_RANGE_MESSAGE
      else if (weightsSum !== 100) problems.weights = WEIGHTS_SUM_MESSAGE
      else {
        patch.weights = entries.map((e) => ({ categoryId: e.id, percent: e.raw === '' ? 0 : Number(e.raw) }))
        changed = true
      }
    }
  }

  return Object.keys(problems).length === 0 && changed ? { patch, problems, weightsSum } : { problems, weightsSum }
}

/** A server 422 violation as the form needs it (the port's `ExamsViolation` fits). */
export interface FieldViolation {
  field: string
  rule: string
  message: string
}

type Target = { key: string; kind: 'param' | 'name-classification' | 'name-category' | 'pace' | 'weights'; field: string }

/** Where a server field path (`categories[1].paceQuestions`, `weights[2].percent`, `name`) lives in the form. */
function targetOf(patch: UpdateExamInput | undefined, field: string): Target | undefined {
  if (field in EXAM_RANGES || field === 'name') return { key: field, kind: 'param', field }
  if (field === 'weights' || /^weights\[\d+\](\.\w+)?$/.test(field)) return { key: 'weights', kind: 'weights', field }
  const indexed = /^(classifications|categories)\[(\d+)\]\.(\w+)$/.exec(field)
  if (!indexed) return undefined
  const [, list, index, attribute] = indexed
  if (list === 'classifications') {
    const id = patch?.classifications?.[Number(index)]?.id
    return id && attribute === 'name' ? { key: `classification:${id}`, kind: 'name-classification', field } : undefined
  }
  const id = patch?.categories?.[Number(index)]?.id
  if (!id) return undefined
  if (attribute === 'name') return { key: `category:${id}`, kind: 'name-category', field }
  if (attribute === 'pace' || attribute === 'paceQuestions' || attribute === 'paceMinutes') return { key: `pace:${id}`, kind: 'pace', field }
  return undefined
}

function messageOf(target: Target, v: FieldViolation): string {
  if (v.rule === 'invalid_text') return INVALID_TEXT_MESSAGE
  switch (target.kind) {
    case 'param': {
      if (v.rule !== 'range') return v.message
      if (target.field === 'name') return nameTooLong(EXAM_NAME_MAX)
      const [min, max] = EXAM_RANGES[target.field as keyof typeof EXAM_RANGES]
      return `Debe estar entre ${min} y ${max}`
    }
    case 'name-classification':
      return v.rule === 'range' ? nameTooLong(CLASSIFICATION_NAME_MAX) : v.message
    case 'name-category':
      return v.rule === 'range' ? nameTooLong(CATEGORY_NAME_MAX) : v.message
    case 'pace':
      return v.rule === 'range' ? PACE_RANGE_MESSAGE : v.rule === 'pace_pair' ? PACE_MESSAGE : v.message
    case 'weights':
      return v.rule === 'range' ? WEIGHT_RANGE_MESSAGE : v.rule === 'weights_sum' ? WEIGHTS_SUM_MESSAGE : v.message
  }
}

/**
 * Maps the violations of a 422 onto the form's problem keys (`name`, `classification:<id>`, `category:<id>`,
 * `pace:<id>`, `weights`), reading `classifications[i]`/`categories[i]` through the patch that was sent.
 * What matches no field comes back as `unmapped` message text for a generic alert.
 */
export function violationProblems(patch: UpdateExamInput | undefined, details: FieldViolation[]): { problems: Record<string, string>; unmapped: string[] } {
  const problems: Record<string, string> = {}
  const unmapped: string[] = []
  for (const v of details) {
    const target = targetOf(patch, v.field)
    if (!target) unmapped.push(v.message)
    else problems[target.key] ??= messageOf(target, v)
  }
  return { problems, unmapped }
}
