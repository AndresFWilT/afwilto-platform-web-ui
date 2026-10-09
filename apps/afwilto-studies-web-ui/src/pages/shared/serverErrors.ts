import { StudiesConflictError, StudiesNotFoundError, StudiesValidationError } from '@/application/errors'

export interface FormFailure {
  /** Messages for fields the form shows, keyed by the API field name. */
  fields: Record<string, string>
  /** A validation or conflict the form has no field for. */
  alert?: string
  /** The target was deleted meanwhile (404): the form says so and the page refetches. */
  gone?: boolean
  /** Anything else (network, 5xx): shown as a toast, the dialog stays open. */
  unexpected?: string
}

export const GONE_MESSAGE = 'It was already deleted.'

/** Spreads a write failure over the form's fields (Slice 09a §2.2); the message is the API's own. */
export function toFormFailure(e: unknown, formFields: string[]): FormFailure {
  if (e instanceof StudiesValidationError) {
    const fields: Record<string, string> = {}
    const others: string[] = []
    for (const v of e.violations) {
      if (formFields.includes(v.field)) fields[v.field] ??= v.message
      else others.push(v.message)
    }
    return { fields, alert: others.length ? others.join('; ') : undefined }
  }
  if (e instanceof StudiesNotFoundError) return { fields: {}, gone: true }
  if (e instanceof StudiesConflictError) {
    return formFields.includes(e.field) ? { fields: { [e.field]: e.message } } : { fields: {}, alert: e.message }
  }
  return { fields: {}, unexpected: e instanceof Error ? e.message : String(e) }
}
