// Domain-language errors of the calculator port. Adapters translate transport
// failures into these, so pages never see HTTP (spec 17 §9 rule 3).

export interface Violation {
  field: string
  rule: string
  message: string
}

/** The input broke one or more calculation rules (one violation per field). */
export class CidrValidationError extends Error {
  readonly violations: Violation[]

  constructor(violations: Violation[]) {
    super(violations.map((v) => v.message).join('; ') || 'validation failed')
    this.name = 'CidrValidationError'
    this.violations = violations
  }

  /** The messages for one field (or for indexed entries such as `addresses[2]`). */
  messageFor(field: string): string | undefined {
    const messages = this.violations.filter((v) => v.field === field || v.field.startsWith(`${field}[`))
    return messages.length ? messages.map((v) => v.message).join('; ') : undefined
  }
}
