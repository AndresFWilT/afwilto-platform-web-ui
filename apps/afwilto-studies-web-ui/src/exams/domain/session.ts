// The session form (Spec 18 FR-7, FR-8, slice 09): what the taker has typed and how it becomes a config.
import type { Exam } from './exam'
import type { FeedbackMode, SessionConfig } from './attempt'

export interface SessionForm {
  mode: 'simulation' | 'custom'
  selectionKind: 'random' | 'categories' | 'origin-set'
  randomCount: string
  classificationId: string
  categoryIds: string[]
  categoryScope: 'all' | 'count'
  categoryCount: string
  set: string
  timing: 'untimed' | 'timed'
  minutes: string
  /** Once the owner types in the minutes field, later previews stop overwriting it. */
  minutesEdited: boolean
  feedback: FeedbackMode
}

export const MINUTES_RANGE = [1, 600] as const
export const COUNT_RANGE = [1, 200] as const

export function initialSessionForm(_exam: Exam): SessionForm {
  throw new Error('not implemented')
}

/** The config to preview: the selection only matters, so timing is always `untimed`. Null while incomplete. */
export function buildPreviewConfig(_form: SessionForm): SessionConfig | null {
  throw new Error('not implemented')
}

/** The config to start with; null while the selection or the minutes are incomplete or out of range. */
export function buildSessionConfig(_form: SessionForm): SessionConfig | null {
  throw new Error('not implemented')
}

/** The suggestion of a fresh preview: fills the minutes unless the owner already edited them. */
export function withSuggestedMinutes(_form: SessionForm, _suggestedMinutes: number): SessionForm {
  throw new Error('not implemented')
}

export function editMinutes(_form: SessionForm, _value: string): SessionForm {
  throw new Error('not implemented')
}

/** "restablecer sugerido": the suggestion comes back and later previews may overwrite it again. */
export function resetMinutes(_form: SessionForm, _suggestedMinutes: number): SessionForm {
  throw new Error('not implemented')
}
