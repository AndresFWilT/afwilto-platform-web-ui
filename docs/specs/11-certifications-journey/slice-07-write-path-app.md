# Slice 07 — Frontend write path (app layer)

> Status: Approved 2026-07-05 · Parent: `../11-certifications-journey.md` §16 Slice 7
> Design-system portion of Slice 7 is complete (Slice 7-DS, commit 617a85b).
> This document specifies the app-layer write path only.

## 1. Scope

Create/edit certification form, delete confirmation dialog, toast feedback, and
`ToastProvider` wiring. No timeline, no attachments (Slice 8/9).

## 2. Non-goals

- Evidence file upload (Slice 9).
- Timeline page (Slice 8).
- Category management screen (implicit creation only).
- Optimistic UI / offline queue.

## 3. Acceptance criteria

### AC-1 — Create flow
Given: user navigates to `/certifications/new`.
- The form renders fields: Name (required), Status (select), Category (text),
  Study start (date), Expected exam (date), Achieved date (date, only visible when
  Status = `achieved`), Notes (textarea).
- Submitting with a valid Name calls `create(cmd)`, shows a "Certification created"
  success toast, and navigates to `/certifications/<new-id>`.

### AC-2 — Edit flow
Given: user navigates to `/certifications/:id/edit`.
- The form pre-fills all fields from the existing certification.
- Submitting calls `update(id, patch)`, shows "Certification updated" toast,
  navigates to `/certifications/:id`.

### AC-3 — Client-side validation
- Submitting with an empty Name shows a `role="alert"` error "Name is required"
  and does NOT call `create` or `update`.
- Submitting with `expectedExamDate < studyStartDate` shows an error "Expected
  exam date must be on or after the study start date" and does NOT submit.

### AC-4 — Delete flow
Given: user is on `/certifications/:id` (detail page).
- Clicking the "Delete" button opens a `Dialog` whose title contains "Delete".
- Clicking "Cancel" in the dialog closes it without calling `remove`.
- Clicking "Delete" in the dialog calls `remove(id)`, shows "Certification deleted"
  toast, and navigates to `/certifications` (list).

### AC-5 — Error feedback
- A `create`/`update`/`remove` rejection shows an error toast with the
  `Error.message` from the service. The user stays on the current page.

### AC-6 — Conditional evidence fields
- `achievedDate` field is visible only when Status = `achieved`.
- `evidenceUrl` field is visible only when Status = `achieved`. (Slice 9 adds
  file uploads here; text URL input is sufficient for this slice.)

### AC-7 — Category autocomplete
- The Category input renders a native `<datalist>` populated with `CategoryInUse`
  paths from `listCategories()`. Existing categories are suggested without
  requiring a library.

## 4. Test plan

RTL integration tests rendered with `MemoryRouter` + in-memory adapter injected
via `ServiceProvider.value`:

| Test | AC |
|---|---|
| Form renders all fields including conditional achievedDate on `achieved` | AC-1, AC-6 |
| Submit empty name → alert shown, no service call | AC-3 |
| Submit with bad date order → date error, no service call | AC-3 |
| Valid create → service called, toast "Certification created", navigate to detail | AC-1 |
| Edit page pre-fills from existing cert | AC-2 |
| Valid edit → update called, toast "Certification updated", navigate to detail | AC-2 |
| Service error on create → error toast, stays on form | AC-5 |
| Detail: delete button opens dialog | AC-4 |
| Detail: dialog cancel closes without remove | AC-4 |
| Detail: dialog confirm → remove called, toast, navigate to list | AC-4 |

## 5. Implementation notes

- `CertificationForm` — shared controlled form component; `onSubmit(values)` callback.
- `CertificationFormPage` — create wrapper; calls `create()`; navigates to `../<id>`.
- `CertificationEditPage` — edit wrapper; loads cert + categories; navigates `..`.
- `CertificationDetailPage` — gains delete dialog + `useToast` (no service hook needed,
  the hook is already consumed via `useCertification`; add `certificationJourneyService`
  from `useServices()` directly for `remove`).
- `App.tsx` — wrap element in `<ToastProvider>`.
- `router/routes.tsx` — replace `new` and `:id/edit` stubs with lazy-loaded real pages.
- `FormField` in design-system embeds `Input` — use a local `FieldWrapper` (label +
  children + error text) for `Select` and `Textarea` fields in the form.
