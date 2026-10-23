// The session form (Spec 18 FR-7, FR-8, slice 09): what the taker has typed and how it becomes a config.
import { primaryClassification, type Exam } from './exam'
import type { FeedbackMode, SessionConfig, SessionSelection } from './attempt'

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

export function initialSessionForm(exam: Exam): SessionForm {
  return {
    mode: 'simulation',
    selectionKind: 'random',
    randomCount: '20',
    classificationId: primaryClassification(exam)?.id ?? exam.classifications[0]?.id ?? '',
    categoryIds: [],
    categoryScope: 'all',
    categoryCount: '20',
    set: '',
    timing: 'untimed',
    minutes: '',
    minutesEdited: false,
    feedback: 'end',
  }
}

/** A whole number within `[min, max]`, or null. */
function wholeNumber(text: string, [min, max]: readonly [number, number]): number | null {
  if (!/^\d+$/.test(text.trim())) return null
  const value = Number(text)
  return value >= min && value <= max ? value : null
}

function buildSelection(form: SessionForm): SessionSelection | null {
  switch (form.selectionKind) {
    case 'random': {
      const count = wholeNumber(form.randomCount, COUNT_RANGE)
      return count === null ? null : { kind: 'random', count }
    }
    case 'categories': {
      if (!form.classificationId || form.categoryIds.length === 0) return null
      const count = form.categoryScope === 'all' ? 'all' : wholeNumber(form.categoryCount, COUNT_RANGE)
      return count === null ? null : { kind: 'categories', classificationId: form.classificationId, categoryIds: form.categoryIds, count }
    }
    case 'origin-set':
      return form.set ? { kind: 'origin-set', set: form.set } : null
  }
}

/** The config to preview: only the selection matters, so timing is always `untimed`. Null while incomplete. */
export function buildPreviewConfig(form: SessionForm): SessionConfig | null {
  if (form.mode === 'simulation') return { selection: { kind: 'simulation' } }
  const selection = buildSelection(form)
  return selection && { selection, timing: { kind: 'untimed' }, feedback: form.feedback }
}

/** The config to start with; null while the selection or the minutes are incomplete or out of range. */
export function buildSessionConfig(form: SessionForm): SessionConfig | null {
  const preview = buildPreviewConfig(form)
  if (!preview || form.mode === 'simulation' || form.timing === 'untimed') return preview
  const minutes = wholeNumber(form.minutes, MINUTES_RANGE)
  return minutes === null ? null : { ...preview, timing: { kind: 'timed', minutes } }
}

/** The suggestion of a fresh preview: fills the minutes unless the owner already edited them. */
export function withSuggestedMinutes(form: SessionForm, suggestedMinutes: number): SessionForm {
  return form.minutesEdited ? form : { ...form, minutes: suggestedMinutes > 0 ? String(suggestedMinutes) : '' }
}

export function editMinutes(form: SessionForm, value: string): SessionForm {
  return { ...form, minutes: value, minutesEdited: true }
}

/** "restablecer sugerido": the suggestion comes back and later previews may overwrite it again. */
export function resetMinutes(form: SessionForm, suggestedMinutes: number): SessionForm {
  return { ...form, minutes: suggestedMinutes > 0 ? String(suggestedMinutes) : '', minutesEdited: false }
}
