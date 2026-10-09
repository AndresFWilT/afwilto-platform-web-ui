// Domain-language errors of the studies port. Adapters translate transport
// failures into these, so pages never see HTTP (Spec 16 §9.2, Slice 09a §2.1).

export interface Violation {
  field: string
  rule: string
  message: string
}

/** A 422: shape or business-rule violations, one per offending field. */
export class StudiesValidationError extends Error {
  readonly violations: Violation[]

  constructor(violations: Violation[]) {
    super(violations.map((v) => v.message).join('; ') || 'validation failed')
    this.name = 'StudiesValidationError'
    this.violations = violations
  }

  /** The message for one field, if it was rejected. */
  messageFor(field: string): string | undefined {
    return this.violations.find((v) => v.field === field)?.message
  }
}

export type ConflictRule = 'duplicate_name' | 'in_use' | 'stale_version'

/** A 409: duplicate name, still in use, or a stale version. */
export class StudiesConflictError extends Error {
  readonly field: string
  readonly rule: ConflictRule

  constructor(field: string, rule: ConflictRule, message: string) {
    super(message)
    this.name = 'StudiesConflictError'
    this.field = field
    this.rule = rule
  }
}

/** A 404 on a write: the target no longer exists (deleted meanwhile). */
export class StudiesNotFoundError extends Error {
  constructor(message = 'resource not found') {
    super(message)
    this.name = 'StudiesNotFoundError'
  }
}
