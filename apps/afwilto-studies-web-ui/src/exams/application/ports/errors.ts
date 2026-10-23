// Domain-language errors of the exams port. Adapters translate transport
// failures into these, so callers never see an HTTP status (S07-7).

export interface ExamsViolation {
  field: string
  rule: string
  message: string
}

/** A 422: one violation per offending field. */
export class ExamsValidationError extends Error {
  readonly details: ExamsViolation[]

  constructor(details: ExamsViolation[], message?: string) {
    super(message ?? (details.map((d) => d.message).join('; ') || 'validation failed'))
    this.name = 'ExamsValidationError'
    this.details = details
  }

  /** The message for one field, if it was rejected. */
  messageFor(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message
  }
}

export type ExamsConflictRule =
  | 'duplicate_name'
  | 'in_use'
  | 'stale_version'
  | 'attempt_in_progress'
  | 'attempt_expired'
  | 'attempt_closed'

/** A 409: the rule that was broken says what the caller can do about it. */
export class ExamsConflictError extends Error {
  readonly field: string
  readonly rule: ExamsConflictRule

  constructor(field: string, rule: ExamsConflictRule, message: string) {
    super(message)
    this.name = 'ExamsConflictError'
    this.field = field
    this.rule = rule
  }
}

/** A 404: the target does not exist (or was deleted meanwhile). */
export class ExamsNotFoundError extends Error {
  constructor(message = 'resource not found') {
    super(message)
    this.name = 'ExamsNotFoundError'
  }
}
