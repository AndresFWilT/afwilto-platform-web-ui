import type {
  EvidenceUrlSource,
  UpdateCertificationCommand,
} from '@/application/ports'
import type { FormValues } from './CertificationForm'

/**
 * Turns two form snapshots into a JSON merge-patch (Spec 14).
 *
 * BR-PATCH1 — only fields whose value differs from the loaded certification are
 * emitted; an unchanged field is absent, never null.
 * BR-PATCH2 — a nullable field the user emptied is emitted as null (clear);
 * text fields are compared after trimming, so whitespace-only edits are dropped.
 * BR-PATCH3 — `name`, `status` and `categoryPath` are never emitted as null; a
 * user who empties them is blocked by the form's validation instead.
 * BR-EV1-CLIENT — while the submitted status is not `achieved`, the evidence
 * fields are omitted entirely, so the client cannot produce the backend's
 * "writable only when the certification is achieved" violation, and the backend
 * keeps stored evidence as history when a certification leaves `achieved`
 * (BR-EV2).
 * BR-EVT1 — `evidenceUrl` is written back to the wire field it was read from.
 */
export function buildUpdatePatch(
  initial: FormValues,
  current: FormValues,
  evidenceUrlSource?: EvidenceUrlSource,
): UpdateCertificationCommand {
  const patch: UpdateCertificationCommand = {}

  // Required text: emit the trimmed value when it changed, never null.
  const name = current.name.trim()
  if (name && name !== initial.name.trim()) patch.name = name

  const categoryPath = current.categoryPath.trim()
  if (categoryPath && categoryPath !== initial.categoryPath.trim()) {
    patch.categoryPath = categoryPath
  }

  if (current.status !== initial.status) patch.status = current.status

  // Nullable text: empty means clear.
  const notes = current.notes.trim()
  if (notes !== initial.notes.trim()) patch.notes = notes || null

  // Dates are already normalized to YYYY-MM-DD (or '') by <input type="date">.
  if (current.studyStartDate !== initial.studyStartDate) {
    patch.studyStartDate = current.studyStartDate || null
  }
  if (current.expectedExamDate !== initial.expectedExamDate) {
    patch.expectedExamDate = current.expectedExamDate || null
  }

  // BR-EV1-CLIENT: evidence travels only when the result is an achieved cert.
  if (current.status === 'achieved') {
    if (current.achievedDate !== initial.achievedDate) {
      patch.achievedDate = current.achievedDate || null
    }
    const evidenceUrl = current.evidenceUrl.trim()
    if (evidenceUrl !== initial.evidenceUrl.trim()) {
      patch.evidenceUrl = evidenceUrl || null
      patch.evidenceUrlTarget = evidenceUrlSource ?? 'credly'
    }
  }

  return patch
}
