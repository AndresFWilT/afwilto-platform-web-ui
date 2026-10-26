// The dev importer of the in-memory adapter (Spec 18 FR-2..FR-4 in miniature): JSON only, no media.
// The real rules live in the backend; this keeps `pnpm dev` without an API usable and gives the
// adapter contract something to test. It plans an import without touching any state.
import { ExamsValidationError } from '@/exams/application/ports'
import type { Classification, Difficulty, Exam, ExamCategory, ExamOption, ExamQuestion, ImportError, ImportReport, QuestionCategoryRef, QuestionOrigin } from '@/exams/domain'
import { fold, levenshtein, slug } from './names'

interface FileOption {
  text?: string
  image?: string
  alt?: string
  correct?: boolean
  rationale?: string
}

interface FileQuestion {
  key?: string
  type?: 'single' | 'multi'
  stem?: string
  explanation?: string
  difficulty?: Difficulty
  origin?: QuestionOrigin
  categories?: Record<string, string[]>
  options?: FileOption[]
}

export interface ImportPlan {
  report: Omit<ImportReport, 'dryRun' | 'applied' | 'weightsAfter'>
  /** The exam after the import (classifications and categories added). */
  exam: Exam
  /** The exam's whole bank after the import. */
  questions: ExamQuestion[]
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
const normalizeStem = (stem: string) => stem.trim().replace(/\s+/g, ' ').toLowerCase()
const content = (q: ExamQuestion) =>
  JSON.stringify({ key: q.key, type: q.type, stem: q.stem, explanation: q.explanation, difficulty: q.difficulty, origin: q.origin, categories: q.categories, options: q.options })

function parse(text: string): FileQuestion[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ExamsValidationError([{ field: 'file', rule: 'json', message: 'the file is not valid JSON' }])
  }
  const questions = (data as { questions?: unknown } | null)?.questions
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ExamsValidationError([{ field: 'file', rule: 'schema', message: 'expected { "questions": [ … ] } with at least one question' }])
  }
  return questions as FileQuestion[]
}

function correctCountError(q: FileQuestion): string | undefined {
  const options = q.options ?? []
  const correct = options.filter((o) => o.correct).length
  if (q.type === 'multi') return correct >= 2 && options.length - correct >= 1 ? undefined : 'a multi question needs at least 2 correct and 1 wrong option'
  return correct === 1 ? undefined : 'a single question needs exactly 1 correct option'
}

export function planImport(input: { exam: Exam; bank: ExamQuestion[]; text: string; primary?: string }): ImportPlan {
  const { exam, bank } = input
  const file = parse(input.text)
  const errors: ImportError[] = []
  const valid: Array<{ index: number; q: FileQuestion }> = []
  file.forEach((q, index) => {
    const message = correctCountError(q)
    if (message) errors.push({ path: `questions[${index}].options`, rule: 'correct_count', message })
    else valid.push({ index, q })
  })

  // Classifications: existing ones first, then the new ones in order of first appearance.
  const next: Exam = structuredClone(exam)
  const existing = next.classifications
  const canonical = new Map<string, string>(existing.map((c) => [fold(c.name), c.name]))
  const detected: string[] = []
  for (const { q } of valid) {
    for (const name of Object.keys(q.categories ?? {})) {
      if (!canonical.has(fold(name))) canonical.set(fold(name), name.trim())
      if (!detected.includes(canonical.get(fold(name))!)) detected.push(canonical.get(fold(name))!)
    }
  }
  const newNames = detected.filter((name) => !existing.some((c) => c.name === name))
  let usable = detected
  if (existing.length + newNames.length > 2) {
    const first = valid.find(({ q }) => Object.keys(q.categories ?? {}).some((n) => newNames.includes(canonical.get(fold(n))!)))
    errors.push({ path: `questions[${first?.index ?? 0}].categories`, rule: 'too_many_classifications', message: 'an exam has at most 2 classifications' })
    usable = detected.filter((name) => existing.some((c) => c.name === name) || newNames.indexOf(name) < 2 - existing.length)
  }

  const currentPrimary = existing.find((c) => c.position === 0)
  const valuesOf = (q: FileQuestion, classification: string) =>
    Object.entries(q.categories ?? {}).filter(([n]) => canonical.get(fold(n)) === classification).flatMap(([, values]) => values)
  const chosen = usable.find((n) => fold(n) === fold(input.primary ?? '\u0000'))
  const defaulted = usable.find((n) => valid.every(({ q }) => valuesOf(q, n).length <= 1))
  const primary = currentPrimary?.name ?? chosen ?? defaulted ?? null

  if (primary) {
    for (const { index, q } of valid) {
      if (valuesOf(q, primary).length > 1) errors.push({ path: `questions[${index}].categories`, rule: 'primary_single_valued', message: 'a question has at most 1 category in the primary classification' })
    }
  }

  const addedClassifications: Classification[] = usable
    .filter((name) => !existing.some((c) => c.name === name))
    .map((name) => ({
      id: crypto.randomUUID(),
      name,
      position: !currentPrimary && name === primary ? 0 : 1,
      weightMode: 'inferred' as const,
      categories: [],
    }))
  if (!currentPrimary && primary === null && addedClassifications[0]) addedClassifications[0].position = 0
  next.classifications.push(...addedClassifications)

  // Categories: matched within their classification, the unknown ones are created.
  const newCategories: ImportReport['newCategories'] = []
  const refsOf = (q: FileQuestion): QuestionCategoryRef[] =>
    usable.flatMap((classificationName) => {
      const classification = next.classifications.find((c) => c.name === classificationName)!
      return valuesOf(q, classificationName).map((value) => {
        let category = classification.categories.find((c) => fold(c.name) === fold(value))
        if (!category) {
          const similarTo = classification.categories
            .filter((c) => !newCategories.some((n) => n.classification === classificationName && n.name === c.name))
            .filter((c) => levenshtein(fold(c.name), fold(value)) <= 2 || slug(c.name) === slug(value))
            .map((c) => c.name)
          category = {
            id: crypto.randomUUID(),
            key: slug(value),
            name: value.trim(),
            weightPercent: classification.position === 0 && classification.weightMode === 'manual' ? 0 : null,
            paceQuestions: null,
            paceMinutes: null,
            questionCount: 0,
          } satisfies ExamCategory
          classification.categories.push(category)
          newCategories.push({ classification: classificationName, name: category.name, similarTo })
        }
        return { classification: classificationName, name: category.name }
      })
    })

  const byKey = new Map(bank.map((q) => [q.key, q]))
  const keys: ImportReport['keys'] = { create: [], update: [], unchanged: [] }
  const duplicateStems: ImportReport['duplicateStems'] = []
  const stored = new Map<string, ExamQuestion>()
  for (const { q } of valid) {
    const key = String(q.key)
    const options: ExamOption[] = (q.options ?? []).map((o, i) => ({ label: LABELS[i], ...(o.text !== undefined && { text: o.text }), ...(o.image !== undefined && { image: o.image }), ...(o.alt !== undefined && { alt: o.alt }), correct: Boolean(o.correct), ...(o.rationale !== undefined && { rationale: o.rationale }) }))
    const candidate: ExamQuestion = {
      id: byKey.get(key)?.id ?? crypto.randomUUID(),
      examId: exam.id,
      key,
      type: q.type === 'multi' ? 'multi' : 'single',
      stem: String(q.stem ?? ''),
      ...(q.explanation !== undefined && { explanation: q.explanation }),
      ...(q.difficulty !== undefined && { difficulty: q.difficulty }),
      ...(q.origin !== undefined && { origin: q.origin }),
      categories: refsOf(q),
      options,
      version: 1,
    }
    const previous = byKey.get(key)
    if (!previous) {
      keys.create.push(key)
      const twin = bank.find((b) => normalizeStem(b.stem) === normalizeStem(candidate.stem))
      if (twin) duplicateStems.push({ key, existingKey: twin.key })
      stored.set(key, candidate)
    } else if (content(previous) === content(candidate)) {
      keys.unchanged.push(key)
      stored.set(key, previous)
    } else {
      keys.update.push(key)
      stored.set(key, { ...candidate, version: previous.version + 1 })
    }
  }

  const questions = [...bank.map((b) => stored.get(b.key) ?? b), ...[...stored.values()].filter((s) => !byKey.has(s.key))]
  const primaryClassification = next.classifications.find((c) => c.position === 0)
  const warnings =
    primaryClassification?.weightMode === 'manual'
      ? newCategories.filter((c) => c.classification === primaryClassification.name).map((c) => `"${c.name}" is not part of the full simulation until you assign it a weight`)
      : []

  return {
    report: {
      counts: { create: keys.create.length, update: keys.update.length, unchanged: keys.unchanged.length, invalid: file.length - valid.length },
      keys,
      errors,
      primary,
      newClassifications: addedClassifications.map((c) => ({ name: c.name })),
      newCategories,
      duplicateStems,
      media: { referenced: 0, inZip: 0, missing: [], unused: [] },
      preview: valid.slice(0, 5).map(({ q }) => stored.get(String(q.key))!),
      warnings,
    },
    exam: next,
    questions,
  }
}
