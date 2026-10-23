// The dev attempts engine of the in-memory adapter: the same draw, deadline and scoring rules as the
// backend (Spec 18 FR-7..FR-10, slices 06a and 06b), so `pnpm dev` without an API behaves like production.
import {
  apportion,
  buildBreakdown,
  percentOf,
  feedbackOf,
  primaryClassification,
  type AnswerInput,
  type AnswerOutcome,
  type Attempt,
  type AttemptHistory,
  type AttemptItem,
  type AttemptReport,
  type AttemptResult,
  type AttemptReveal,
  type AttemptSummary,
  type Classification,
  type Exam,
  type ExamQuestion,
  type FeedbackMode,
  type QuestionCategoryRef,
  type QuestionType,
  type ReviewItem,
  type SessionConfig,
  type SessionPreview,
  type SessionSelection,
  type Shortage,
  type ViewOption,
} from '@/exams/domain'
import { ExamsAttemptInProgressError, ExamsConflictError, ExamsNotFoundError, ExamsValidationError, type ExamsViolation } from '@/exams/application/ports'

/** A write is accepted this long after the deadline (BR-A2). */
const GRACE_MS = 5_000
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
const EPSILON = 1e-9

/** mulberry32: a small seeded generator; the same seed gives the same sequence. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A Fisher–Yates shuffle of a copy. */
export function shuffled<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const violation = (field: string, rule: string, message: string, extra: Partial<ExamsViolation> = {}): ExamsViolation => ({ field, rule, message, ...extra })
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** FR-8: the largest pace among the question's categories in `classification`, else the exam pace. */
function questionPace(exam: Exam, classification: Classification | undefined, question: ExamQuestion): number {
  const examPace = exam.timeLimitMin / exam.questionCount
  const paces = (classification?.categories ?? [])
    .filter((c) => question.categories.some((r) => r.classification === classification!.name && r.name === c.name))
    .map((c) => (c.paceQuestions !== null && c.paceMinutes !== null ? c.paceMinutes / c.paceQuestions : examPace))
  return paces.length ? Math.max(...paces) : examPace
}

const ceilMinutes = (minutes: number) => Math.max(0, Math.ceil(minutes - EPSILON))

interface Snapshot {
  stem: string
  type: QuestionType
  chooseCount?: number
  /** In displayed order, relabelled A, B, C… */
  options: Array<ViewOption & { correct: boolean; rationale?: string }>
  explanation?: string
  categories: QuestionCategoryRef[]
  noteRef?: string
}

interface StoredItem {
  snapshot: Snapshot
  selected: string[]
  flagged: boolean
  answered: boolean
  revealed: boolean
  correct?: boolean
}

interface StoredAttempt {
  id: string
  seq: number
  examId: string
  config: SessionConfig
  feedback: FeedbackMode
  passPercent: number
  status: Attempt['status']
  startedAt: number
  deadlineAt?: number
  submittedAt?: number
  scorePercent?: number
  passed?: boolean | null
  suggestedMinutes: number
  items: StoredItem[]
}

interface Deps {
  now: () => number
  /** The exam as the UI reads it: counts and inferred weights derived from the bank. */
  exam: (examId: string) => Exam
  bank: (examId: string) => ExamQuestion[]
  notes: Record<string, string>
}

interface Pool {
  questions: ExamQuestion[]
  /** The classification whose paces price the questions. */
  paceClassification: Classification | undefined
}

export class MemoryAttempts {
  private readonly attempts: StoredAttempt[] = []
  private seq = 0
  private readonly deps: Deps

  constructor(deps: Deps) {
    this.deps = deps
  }

  // ── sessions ──────────────────────────────────────────────────────────────

  preview(examId: string, config: SessionConfig): SessionPreview {
    const exam = this.deps.exam(examId)
    this.validate(config)
    const { questions, paceClassification } = this.pool(exam, config.selection)
    const shortages = config.selection.kind === 'simulation' ? this.quotas(exam, questions).shortages : []
    if (config.selection.kind === 'simulation') {
      const drawCount = this.quotas(exam, questions).quotas.reduce((total, q) => total + q.quota, 0)
      return { poolSize: questions.length, drawCount, suggestedMinutes: drawCount === 0 ? 0 : exam.timeLimitMin, shortages }
    }
    const drawCount = this.drawCount(config.selection, questions.length)
    const sum = questions.reduce((total, q) => total + questionPace(exam, paceClassification, q), 0)
    const minutes = questions.length === 0 ? 0 : drawCount === questions.length ? sum : (drawCount * sum) / questions.length
    return { poolSize: questions.length, drawCount, suggestedMinutes: ceilMinutes(minutes), shortages }
  }

  start(examId: string, config: SessionConfig, seed?: number): Attempt {
    const exam = this.deps.exam(examId)
    this.validate(config)
    const open = this.attempts.find((a) => {
      this.finalize(a)
      return a.examId === examId && a.status === 'in_progress'
    })
    if (open) throw new ExamsAttemptInProgressError(open.id, `attempt ${open.id} is in progress`)

    const rng = createRng(seed ?? Math.floor(Math.random() * 2 ** 32))
    const { selection } = config
    const { questions, paceClassification } = this.pool(exam, selection)
    let drawn: ExamQuestion[]
    if (selection.kind === 'simulation') {
      const { quotas, shortages } = this.quotas(exam, questions)
      if (shortages.length) throw this.insufficient(shortages)
      if (quotas.length === 0) throw this.insufficient([{ category: 'categorías con peso', needed: 1, available: 0 }])
      drawn = shuffled(
        quotas.flatMap(({ name, quota }) => {
          const mine = this.byId(questions.filter((q) => q.categories.some((r) => r.classification === primaryClassification(exam)!.name && r.name === name)))
          return shuffled(mine, rng).slice(0, quota)
        }),
        rng
      )
    } else if (selection.kind === 'origin-set') {
      if (questions.length === 0) throw this.insufficient([{ category: selection.set, needed: 1, available: 0 }])
      drawn = questions
    } else {
      const wanted = this.drawCount(selection, questions.length)
      if (wanted === 0) throw this.insufficient([{ category: 'banco', needed: 1, available: 0 }])
      drawn = shuffled(shuffled(this.byId(questions), rng).slice(0, wanted), rng)
    }

    const timed = selection.kind === 'simulation' ? exam.timeLimitMin : config.timing?.kind === 'timed' ? config.timing.minutes : undefined
    const startedAt = this.deps.now()
    const stored: StoredAttempt = {
      id: crypto.randomUUID(),
      seq: this.seq++,
      examId,
      config: structuredClone(config),
      feedback: selection.kind === 'simulation' ? 'end' : (config.feedback ?? 'end'),
      passPercent: exam.passPercent,
      status: 'in_progress',
      startedAt,
      ...(timed !== undefined && { deadlineAt: startedAt + timed * 60_000 }),
      suggestedMinutes:
        selection.kind === 'simulation' ? exam.timeLimitMin : ceilMinutes(drawn.reduce((total, q) => total + questionPace(exam, paceClassification, q), 0)),
      items: drawn.map((q) => ({ snapshot: this.snapshot(q, rng), selected: [], flagged: false, answered: false, revealed: false })),
    }
    this.attempts.push(stored)
    return this.view(stored)
  }

  // ── attempts ──────────────────────────────────────────────────────────────

  get(attemptId: string): Attempt {
    const attempt = this.find(attemptId)
    this.finalize(attempt)
    return this.view(attempt)
  }

  answer(attemptId: string, position: number, answer: AnswerInput): AnswerOutcome {
    const attempt = this.find(attemptId)
    const expiredNow = this.finalize(attempt)
    if (attempt.status !== 'in_progress') {
      throw new ExamsConflictError('attemptId', expiredNow ? 'attempt_expired' : 'attempt_closed', expiredNow ? 'the deadline passed' : 'the attempt is closed')
    }
    const item = attempt.items[position]
    if (!item) throw new ExamsNotFoundError('item not found')

    const shown = item.snapshot.options.map((o) => o.label)
    if (new Set(answer.selected).size !== answer.selected.length || answer.selected.some((l) => !shown.includes(l))) {
      throw new ExamsValidationError([violation('selected', 'invalid_label', 'labels must be shown by the item and not repeat')])
    }
    const limit = item.snapshot.type === 'multi' ? (item.snapshot.chooseCount ?? 1) : 1
    if (answer.selected.length > limit) {
      throw new ExamsValidationError([violation('selected', 'too_many_selected', `choose at most ${limit}`)])
    }
    const selected = shown.filter((l) => answer.selected.includes(l))
    if (item.revealed && !sameSet(selected, item.selected)) {
      throw new ExamsConflictError('selected', 'answer_locked', 'the answer was revealed and can no longer change')
    }
    item.selected = selected
    item.flagged = answer.flagged
    item.answered = selected.length > 0
    if (attempt.feedback === 'each' && selected.length > 0) item.revealed = true
    const reveal = item.revealed ? this.reveal(item) : undefined
    return {
      position,
      selected: [...item.selected],
      flagged: item.flagged,
      ...(attempt.deadlineAt !== undefined && { remainingSeconds: Math.max(0, Math.ceil((attempt.deadlineAt - this.deps.now()) / 1000)) }),
      ...(reveal && { reveal }),
    }
  }

  submit(attemptId: string): AttemptResult {
    const attempt = this.find(attemptId)
    const expiredNow = this.finalize(attempt)
    if (attempt.status !== 'in_progress') {
      throw new ExamsConflictError('attemptId', expiredNow ? 'attempt_expired' : 'attempt_closed', expiredNow ? 'the deadline passed' : 'the attempt is closed')
    }
    this.close(attempt, 'submitted', this.deps.now())
    return this.result(attempt)
  }

  report(attemptId: string): AttemptReport {
    const attempt = this.find(attemptId)
    this.finalize(attempt)
    if (attempt.status === 'in_progress') throw new ExamsAttemptInProgressError(attempt.id, 'the attempt is still in progress')
    return { examId: attempt.examId, selectionKind: attempt.config.selection.kind, result: this.result(attempt), review: this.review(attempt) }
  }

  // ── history ───────────────────────────────────────────────────────────────

  /** The real attempts of an exam, newest first, merged with the seeded history. */
  history(examId: string, seeded: AttemptHistory = { attempts: [], trend: [] }): AttemptHistory {
    const mine = this.attempts.filter((a) => a.examId === examId)
    mine.forEach((a) => this.finalize(a))
    const rows = [
      ...mine.map((a) => ({ seq: a.seq, summary: this.summary(a) })),
      ...seeded.attempts.map((summary) => ({ seq: -1, summary })),
    ].sort((a, b) => (a.summary.startedAt < b.summary.startedAt ? 1 : a.summary.startedAt > b.summary.startedAt ? -1 : b.seq - a.seq))
    const trend = [
      ...seeded.trend,
      ...mine
        .filter((a) => a.config.selection.kind === 'simulation' && a.status !== 'in_progress')
        .map((a) => ({ at: new Date(a.submittedAt!).toISOString(), scorePercent: a.scorePercent! })),
    ].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    return { attempts: rows.map((r) => r.summary), trend }
  }

  /** The latest closed simulation of the exam, for the exam summary. */
  lastSimulation(examId: string): { scorePercent: number; passed: boolean; at: string } | undefined {
    const [latest] = this.attempts
      .filter((a) => a.examId === examId && a.config.selection.kind === 'simulation')
      .filter((a) => {
        this.finalize(a)
        return a.status !== 'in_progress'
      })
      .sort((a, b) => b.submittedAt! - a.submittedAt!)
    return latest && { scorePercent: latest.scorePercent!, passed: latest.passed === true, at: new Date(latest.submittedAt!).toISOString() }
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private find(attemptId: string): StoredAttempt {
    const found = this.attempts.find((a) => a.id === attemptId)
    if (!found) throw new ExamsNotFoundError('attempt not found')
    return found
  }

  private validate(config: SessionConfig) {
    const found: ExamsViolation[] = []
    if (config.selection.kind === 'simulation') {
      if (config.timing) found.push(violation('timing', 'locked_by_simulation', 'a simulation is timed with the exam time'))
      if (config.feedback) found.push(violation('feedback', 'locked_by_simulation', 'a simulation shows its answers at the end'))
    } else {
      if (!config.timing) found.push(violation('timing', 'required', 'timing is required'))
      if (!config.feedback) found.push(violation('feedback', 'required', 'feedback is required'))
      if (config.timing?.kind === 'timed' && !(config.timing.minutes >= 1 && config.timing.minutes <= 600)) {
        found.push(violation('timing', 'range', 'minutes must be between 1 and 600'))
      }
      const count = config.selection.kind === 'random' || config.selection.kind === 'categories' ? config.selection.count : 1
      if (count !== 'all' && !(count >= 1 && count <= 200)) found.push(violation('count', 'range', 'count must be between 1 and 200'))
    }
    if (found.length) throw new ExamsValidationError(found)
  }

  private pool(exam: Exam, selection: SessionSelection): Pool {
    const questions = this.deps.bank(exam.id)
    const primary = primaryClassification(exam)
    switch (selection.kind) {
      case 'simulation': {
        const weighted = new Set((primary?.categories ?? []).filter((c) => (c.weightPercent ?? 0) > 0).map((c) => c.name))
        return {
          questions: questions.filter((q) => q.categories.some((r) => r.classification === primary?.name && weighted.has(r.name))),
          paceClassification: primary,
        }
      }
      case 'random':
        return { questions, paceClassification: primary }
      case 'categories': {
        const classification = exam.classifications.find((c) => c.id === selection.classificationId)
        const names = new Set((classification?.categories ?? []).filter((c) => selection.categoryIds.includes(c.id)).map((c) => c.name))
        return {
          questions: questions.filter((q) => q.categories.some((r) => r.classification === classification?.name && names.has(r.name))),
          paceClassification: classification,
        }
      }
      case 'origin-set':
        return {
          questions: questions
            .filter((q) => q.origin?.set === selection.set)
            .sort((a, b) => (a.origin?.number ?? 0) - (b.origin?.number ?? 0) || a.key.localeCompare(b.key)),
          paceClassification: primary,
        }
    }
  }

  private drawCount(selection: SessionSelection, poolSize: number): number {
    if (selection.kind === 'random' || selection.kind === 'categories') return selection.count === 'all' ? poolSize : Math.min(selection.count, poolSize)
    return poolSize
  }

  /** Simulation quotas by largest remainder over the weighted primary categories, and the categories short of theirs. */
  private quotas(exam: Exam, questions: ExamQuestion[]): { quotas: Array<{ name: string; quota: number }>; shortages: Shortage[] } {
    const primary = primaryClassification(exam)
    const weighted = (primary?.categories ?? []).filter((c) => (c.weightPercent ?? 0) > 0)
    const parts = apportion(exam.questionCount, weighted.map((c) => c.weightPercent ?? 0))
    const quotas = weighted.map((c, i) => ({ name: c.name, quota: parts[i] }))
    const shortages = quotas.flatMap(({ name, quota }) => {
      const available = questions.filter((q) => q.categories.some((r) => r.classification === primary!.name && r.name === name)).length
      return available < quota ? [{ category: name, needed: quota, available }] : []
    })
    return { quotas, shortages }
  }

  private insufficient(shortages: Shortage[]): ExamsValidationError {
    return new ExamsValidationError(
      shortages.map((s) => violation('selection', 'insufficient_questions', `faltan ${s.needed - s.available} en ${s.category}`, s))
    )
  }

  private byId(questions: ExamQuestion[]): ExamQuestion[] {
    return [...questions].sort((a, b) => a.id.localeCompare(b.id))
  }

  private snapshot(question: ExamQuestion, rng: () => number): Snapshot {
    const options = shuffled(question.options, rng).map((o, i) => ({
      label: LABELS[i],
      ...(o.text !== undefined && { text: o.text }),
      ...(o.image !== undefined && { image: o.image }),
      ...(o.alt !== undefined && { alt: o.alt }),
      correct: o.correct,
      ...(o.rationale !== undefined && { rationale: o.rationale }),
    }))
    const correctCount = options.filter((o) => o.correct).length
    return {
      stem: question.stem,
      type: question.type,
      ...(question.type === 'multi' && { chooseCount: correctCount }),
      options,
      ...(question.explanation !== undefined && { explanation: question.explanation }),
      categories: structuredClone(question.categories),
      ...(question.origin?.noteRef !== undefined && { noteRef: question.origin.noteRef }),
    }
  }

  private viewOptions(item: StoredItem): ViewOption[] {
    return item.snapshot.options.map(({ correct: _c, rationale: _r, ...option }) => option)
  }

  private reveal(item: StoredItem): AttemptReveal {
    const { options, explanation } = item.snapshot
    const correctLabels = options.filter((o) => o.correct).map((o) => o.label)
    return {
      correct: sameSet(item.selected, correctLabels),
      correctLabels,
      rationales: Object.fromEntries(options.flatMap((o) => (o.rationale ? [[o.label, o.rationale]] : []))),
      ...(explanation !== undefined && { explanation }),
    }
  }

  /** Scores what is answered and closes the attempt at `at`. */
  private close(attempt: StoredAttempt, status: 'submitted' | 'expired', at: number) {
    attempt.items.forEach((item) => (item.correct = this.reveal(item).correct))
    const correct = attempt.items.filter((i) => i.correct).length
    attempt.scorePercent = percentOf(correct, attempt.items.length)
    // Like the server: hundredths against the frozen pass mark, never floats.
    attempt.passed = attempt.config.selection.kind === 'simulation' ? Math.round(attempt.scorePercent * 100) >= attempt.passPercent * 100 : null
    attempt.status = status
    attempt.submittedAt = at
  }

  /**
   * Lazy expiry (BR-A2): past deadline + grace, the attempt is scored as it stands and closed.
   * Returns true when this call is what expired it, false when nothing changed.
   */
  private finalize(attempt: StoredAttempt): boolean {
    if (attempt.status !== 'in_progress' || attempt.deadlineAt === undefined) return false
    if (this.deps.now() <= attempt.deadlineAt + GRACE_MS) return false
    this.close(attempt, 'expired', attempt.deadlineAt)
    return true
  }

  private view(attempt: StoredAttempt): Attempt {
    const now = this.deps.now()
    return {
      id: attempt.id,
      examId: attempt.examId,
      config: structuredClone(attempt.config),
      status: attempt.status,
      startedAt: new Date(attempt.startedAt).toISOString(),
      ...(attempt.deadlineAt !== undefined && {
        deadlineAt: new Date(attempt.deadlineAt).toISOString(),
        remainingSeconds: attempt.status === 'in_progress' ? Math.max(0, Math.ceil((attempt.deadlineAt - now) / 1000)) : 0,
      }),
      suggestedMinutes: attempt.suggestedMinutes,
      items: attempt.items.map((item, position): AttemptItem => ({
        position,
        stem: item.snapshot.stem,
        type: item.snapshot.type,
        ...(item.snapshot.chooseCount !== undefined && { chooseCount: item.snapshot.chooseCount }),
        options: this.viewOptions(item),
        selected: [...item.selected],
        flagged: item.flagged,
        answered: item.answered,
        ...(item.revealed && { reveal: this.reveal(item) }),
      })),
      ...(attempt.status !== 'in_progress' && { result: this.result(attempt) }),
    }
  }

  private review(attempt: StoredAttempt): ReviewItem[] {
    return attempt.items.map((item, position) => {
      const title = item.snapshot.noteRef?.replace(/\s*\(diap\.[^)]*\)\s*$/, '')
      const noteId = title === undefined ? undefined : this.deps.notes[title]
      return {
        position,
        stem: item.snapshot.stem,
        type: item.snapshot.type,
        options: this.viewOptions(item),
        selected: [...item.selected],
        flagged: item.flagged,
        reveal: this.reveal(item),
        categories: structuredClone(item.snapshot.categories),
        ...(noteId !== undefined && { noteId }),
      }
    })
  }

  private result(attempt: StoredAttempt): AttemptResult {
    const review = this.review(attempt)
    return {
      scorePercent: attempt.scorePercent!,
      passed: attempt.passed ?? null,
      correctCount: review.filter((r) => r.reveal.correct).length,
      total: review.length,
      durationSeconds: Math.floor((attempt.submittedAt! - attempt.startedAt) / 1000),
      breakdown: buildBreakdown(review),
    }
  }

  private summary(attempt: StoredAttempt): AttemptSummary {
    const closed = attempt.status !== 'in_progress'
    const { selection, timing } = attempt.config
    return {
      id: attempt.id,
      selectionKind: selection.kind,
      timingKind: selection.kind === 'simulation' || timing?.kind === 'timed' ? 'timed' : 'untimed',
      feedback: feedbackOf({ selection, feedback: attempt.feedback }),
      status: attempt.status,
      startedAt: new Date(attempt.startedAt).toISOString(),
      ...(closed && {
        durationSeconds: Math.round((attempt.submittedAt! - attempt.startedAt) / 1000),
        scorePercent: attempt.scorePercent!,
        ...(attempt.passed !== null && attempt.passed !== undefined && { passed: attempt.passed }),
      }),
    }
  }
}
