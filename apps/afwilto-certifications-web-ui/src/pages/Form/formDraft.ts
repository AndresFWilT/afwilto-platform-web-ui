import type { FormValues } from './CertificationForm'

const DRAFT_KEY = 'certifications:new-form-draft'
const PENDING_CATEGORY_KEY = 'certifications:pending-category-path'

// The draft is a per-tab, best-effort convenience for the round trip to
// /categories/new — sessionStorage can throw (private mode, quota, disabled
// storage), and losing it just means the create form comes back empty, so
// every access is wrapped rather than allowed to break navigation.

export function saveDraft(values: FormValues): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
  } catch {
    // best-effort
  }
}

export function loadAndClearDraft(): FormValues | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    sessionStorage.removeItem(DRAFT_KEY)
    return JSON.parse(raw) as FormValues
  } catch {
    return null
  }
}

export function setPendingCategoryPath(path: string): void {
  try {
    sessionStorage.setItem(PENDING_CATEGORY_KEY, path)
  } catch {
    // best-effort
  }
}

export function takePendingCategoryPath(): string | undefined {
  try {
    const path = sessionStorage.getItem(PENDING_CATEGORY_KEY)
    if (path) sessionStorage.removeItem(PENDING_CATEGORY_KEY)
    return path ?? undefined
  } catch {
    return undefined
  }
}
