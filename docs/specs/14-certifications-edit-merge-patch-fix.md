# Spec 14 — Certifications: real merge-patch on edit + evidence write targeting

> Status: **Approved 2026-09-23**
> Scope: `apps/afwilto-certifications-web-ui` (frontend only).
> Related: `11-certifications-journey/slice-04-update-and-lifecycle.md` (BR-EV1/BR-EV2),
> `11-certifications-journey/slice-07-write-path-app.md` (write path),
> `11-certifications-journey/slice-09-app-evidence-ui.md` (evidence UI).

---

## 1. Context / problem

Editing **any** field of a non-achieved certification fails with a 422 toast:

```
credlyUrl is writable only when the certification is achieved
```

Reproduction: open `/certifications/:id/edit` on a `planned` certification, change
only "Expected exam", press Save.

### Root cause

`CertificationEditPage.buildUpdatePatch()` is not a patch — it is a full snapshot of
the form with empty strings coerced to `null`:

```ts
achievedDate: values.achievedDate || null,
evidenceUrl:  values.evidenceUrl.trim() || null,
```

`CertificationHttpAdapter.buildUpdateBody()` only drops `undefined` keys, so those
`null`s reach the wire as *explicit clears*:

```json
PATCH /certifications/:id  { …, "achievedDate": null, "credlyUrl": null }
```

The backend behaves exactly as specified: `updateService.Execute` sees
`CredlyURL.Set == true` and calls `SetCredlyURL(nil)`, whose `ensureEvidenceWritable`
guard rejects any evidence write — including a null clear — while the status is not
`achieved` (**BR-EV1**, `slice-04` §2). The reported date edit is incidental; the
failure comes from the always-sent `credlyUrl`.

### Why the test suite was green

`InMemoryCertificationAdapter.update()` does not enforce BR-EV1, so the write-path RTL
tests exercise a fake that is *more permissive than the real backend*. The contract
divergence, not the missing test case, is the defect: any new test written against
today's fake would also pass while production fails.

### Defects in the same family (in scope)

| # | Defect | Current outcome |
|---|---|---|
| D1 | Evidence fields (`achievedDate`, `evidenceUrl`) sent as `null` on every edit | 422 BR-EV1 — **the reported bug** |
| D2 | `categoryPath: null` sent when the Category input is empty | 422 `category cannot be null` |
| D3 | `evidenceUrl` reads from `credlyUrl ?? officialUrl` but always writes to `credlyUrl` | editing an official-URL certification creates a second, divergent evidence URL |
| D4 | Evidence values kept in form state while hidden (status switched away from `achieved`) are still submitted | 422 BR-EV1 on create and on edit |
| D5 | Empty Category is submittable on create (`category: ''`) | 422 `category segments must not be empty` |
| D6 | The fake does not enforce BR-EV1 / non-null contract | green tests over a broken flow |

---

## 2. Non-goals

- **No backend change.** BR-EV1 and BR-EV2 stay exactly as `slice-04` defines them;
  the client is made incapable of violating them.
- No optimistic UI, no dirty-state prompt on navigation, no autosave.
- No change to the attachment (file evidence) flow of `slice-09`.
- No new form library or validation library — validation stays hand-rolled in
  `CertificationForm`.
- No separate "Credly URL" and "Official URL" inputs. The form keeps one
  **Evidence URL** field; only its *write target* becomes correct (BR-EVT1).
- No change to `GET`/list mapping beyond the added `evidenceUrlSource` field.
- The fake's **`create`** is not given the backend's validation (a mandatory non-empty
  category, evidence ignored on create). Parity work here is scoped to `update`, the
  path the reported bug lives on; D5 is closed in the UI by BR-CAT1 instead.

---

## 3. Business rules

**BR-PATCH1 (merge-patch).** An edit submits only the fields whose value differs from
the loaded certification. An unchanged field is **absent** from the command
(`undefined`), never `null`.

**BR-PATCH2 (clear vs unchanged).** A nullable field the user emptied is sent as
`null` (clear). A field left as loaded is absent. Text fields are compared **after
trimming**, so whitespace-only edits are not sent.

**BR-PATCH3 (non-nullable fields).** `name` and `status` are never sent as `null`.
They appear in the command only when changed, always with a value.

**BR-EV1-CLIENT (mirror of backend BR-EV1).** When the submitted status is not
`achieved`, the evidence fields (`achievedDate`, `evidenceUrl`) are **omitted from the
command entirely** — neither values nor nulls. Consequences:
- a non-achieved certification can never produce a BR-EV1 violation;
- moving a certification away from `achieved` sends only `status`, so the backend keeps
  the stored evidence as history (**BR-EV2** preserved).

**BR-EVT1 (evidence write target).** `evidenceUrl` is written back to the wire field it
was read from: `credlyUrl` when the certification's evidence came from `credlyUrl`,
`officialUrl` when it came from `officialUrl`. With no stored evidence the target
defaults to `credlyUrl`.

**BR-EVT2 (clearing is total).** The UI exposes a single evidence URL, so *clearing* it
clears **both** wire fields (`credlyUrl: null, officialUrl: null`) regardless of target.
Clearing only the target would resurface the other field on a row that holds both — the
exact shape defect D3 has been producing — and the clear would look to the user as if it
had silently failed.

**BR-HTTPS1 (evidence URL scheme).** An evidence URL must be `https://…`; the form
validates it and blocks submit with "Evidence URL must be an https URL". The rule mirrors
the backend's `ValidateEvidenceURL`. On create this matters beyond a nicer message: the
adapter creates via `POST` + follow-up `PATCH`, so a rejected URL leaves an orphaned
certification behind (see §10).

**BR-HIST1 (history is not current state).** Because BR-EV2 keeps evidence after a
certification leaves `achieved`, the detail page shows the achieved date and the evidence
link **only** while `status === 'achieved'` — the same gate the attachment section already
uses. Otherwise a `planned` certification renders an "Achieved" row and a live evidence
link.

**BR-CAT1 (category required).** Category is mandatory server-side (create rejects an
empty path; update rejects `null`). The form validates it client-side and blocks
submit with "Category is required"; the command therefore never carries a `null` or
empty category.

---

## 4. Acceptance criteria

### AC-1 — Editing one field of a non-achieved certification succeeds
Given a `planned` certification with a category and no evidence,
when the user changes only "Expected exam" to `2027-03-01` and saves,
then `update(id, patch)` is called with **exactly** `{ expectedExamDate: '2027-03-01' }`,
and the "Certification updated" toast is shown.

### AC-2 — Unchanged fields are absent, not null
Given the same certification,
when the user changes only the name,
then the patch has exactly one key (`name`), and in particular
`'evidenceUrl' in patch === false`, `'achievedDate' in patch === false`,
`'categoryPath' in patch === false`, `'status' in patch === false`.

### AC-3 — Emptying a nullable field clears it
Given a certification with `notes = 'why'` and `studyStartDate = '2026-01-01'`,
when the user clears both fields and saves,
then the patch is `{ notes: null, studyStartDate: null }`.

### AC-4 — Whitespace-only edits are not sent
Given a certification named `AWS SAA`,
when the user changes the name to `'  AWS SAA  '` and saves,
then `name` is absent from the patch.

### AC-5 — Evidence on an achieved certification is writable
Given an `achieved` certification with `evidenceUrl = 'https://credly.com/a'`,
when the user changes the URL to `https://credly.com/b`,
then the patch contains `{ evidenceUrl: 'https://credly.com/b', evidenceUrlTarget: 'credly' }`.
And when the user instead clears the URL,
then the patch contains `{ evidenceUrl: null, evidenceUrlTarget: 'credly' }`.

### AC-6 — Evidence is omitted while not achieved (BR-EV1-CLIENT)
Given an `achieved` certification with `achievedDate = '2026-05-01'` and an evidence URL,
when the user switches Status to `planned` and saves,
then the patch is exactly `{ status: 'planned' }` — no `achievedDate`, no `evidenceUrl`
(the backend keeps the evidence as history, BR-EV2).

### AC-7 — Achieve-and-fill in one patch
Given a `planned` certification,
when the user switches Status to `achieved`, sets Achieved date `2026-09-20` and
Evidence URL `https://credly.com/x`, and saves,
then the patch contains `status: 'achieved'`, `achievedDate: '2026-09-20'`,
`evidenceUrl: 'https://credly.com/x'` (the backend applies status before evidence).

### AC-8 — Evidence write targets the field it was read from (BR-EVT1)
Given a wire certification with `credlyUrl: null` and
`officialUrl: 'https://aws.amazon.com/a'`,
then `getById` maps `evidenceUrl = 'https://aws.amazon.com/a'` and
`evidenceUrlSource = 'official'`.
And when `update` is called with
`{ evidenceUrl: 'https://aws.amazon.com/b', evidenceUrlTarget: 'official' }`,
then the PATCH body is `{ officialUrl: 'https://aws.amazon.com/b' }` and has **no**
`credlyUrl` key.
And with `evidenceUrlTarget` absent, the body uses `credlyUrl`.

### AC-9 — Category is required (BR-CAT1)
Given the create form or the edit form,
when the user submits with an empty Category,
then a `role="alert"` "Category is required" message is shown and neither `create`
nor `update` is called.

### AC-10 — Create does not send evidence for a non-achieved status (D4)
Given the create form,
when the user selects Status `achieved`, types an Evidence URL, then switches Status
back to `in_progress` and submits,
then `create` is called without `achievedDate` and without `evidenceUrl`.

### AC-11 — The fake enforces the backend contract (D6)
`InMemoryCertificationAdapter.update` rejects, with the backend's message:
- an `achievedDate` or `evidenceUrl` key (value **or** `null`) when the resulting
  status is not `achieved` → `"<field> is writable only when the certification is achieved"`,
  where `<field>` is `credlyUrl` / `officialUrl` per `evidenceUrlTarget`;
- `categoryPath: null` → `"category cannot be null"`;
- `name: null` / `status: null` → `"<field> cannot be null"`.
And it honors BR-EV2: moving away from `achieved` leaves `achievedDate`/`evidenceUrl`
on the row untouched.

### AC-13 — Evidence URL scheme (BR-HTTPS1)
Given the create or edit form with Status `achieved`,
when the user submits `http://credly.com/x`,
then "Evidence URL must be an https URL" is shown and neither `create` nor `update` is
called. `https://credly.com/x` submits normally.

### AC-14 — History is not shown as current state (BR-HIST1)
Given a certification that was achieved (achieved date + evidence URL stored) and has
since been moved to `planned`,
when the detail page renders,
then neither the achieved date nor the "View evidence" link is present.
While the certification is `achieved`, both are present.

### AC-15 — Adapter parity on explicit `undefined`
`update(id, { status: 'in_progress', achievedDate: undefined, evidenceUrl: undefined })`
— the shape `CertificationHttpAdapter.create` builds for its follow-up patch — is treated
identically by both adapters: the key is **absent**, not a clear, and it does not trip
BR-EV1. The in-memory adapter also stamps `achievedDate` on the transition to `achieved`
when none is supplied, as `ChangeStatus` does server-side.

### AC-12 — Regression guard
The pre-fix `buildUpdatePatch` behavior (full snapshot with nulls) run against the
BR-EV1-enforcing fake fails; the new behavior passes. No existing test in
`test/write.test.tsx`, `test/evidence.test.tsx`,
`test/InMemoryCertificationAdapter.behavioral.test.ts` or
`test/CertificationHttpAdapter.test.ts` regresses.

---

## 5. Port delta

```ts
export type EvidenceUrlSource = 'credly' | 'official'

export interface Certification {
  // …
  evidenceUrl?: string
  evidenceUrlSource?: EvidenceUrlSource   // which wire field evidenceUrl came from
}

export interface UpdateCertificationCommand {
  // …
  evidenceUrl?: string | null
  evidenceUrlTarget?: EvidenceUrlSource   // default 'credly'
}
```

`CreateCertificationCommand` is unchanged.

---

## 6. Database / backend changes

None.

---

## 7. Test plan (TDD order)

| # | File | Named cases | AC |
|---|---|---|---|
| 1 | `test/buildUpdatePatch.test.ts` (new) | unchanged form → empty patch; single date change → only that key; unchanged evidence keys absent; empty nullable → null; whitespace-only name → absent; name/status never null; evidence omitted when status ≠ achieved; evidence sent when achieved; clear evidence on achieved → null; achieve-and-fill; evidenceUrlTarget from source; target defaults to credly | AC-1..AC-8 |
| 2 | `test/InMemoryCertificationAdapter.behavioral.test.ts` | BR-EV1: evidence value rejected while planned; BR-EV1: evidence **null** rejected while planned; evidence accepted when patch also sets achieved; BR-EV2: leaving achieved keeps evidence; category null rejected; name/status null rejected | AC-11 |
| 3 | `test/CertificationHttpAdapter.test.ts` | officialUrl-only wire → `evidenceUrlSource = 'official'`; credly wire → `'credly'`; no evidence → undefined; update with target `official` → body `officialUrl` and no `credlyUrl`; update with no target → `credlyUrl` | AC-8 |
| 4 | `test/write.test.tsx` | AC-1 edit a planned cert's date → succeeds, patch has one key; AC-6 achieved → planned sends only status; AC-9 empty category blocks submit on create and edit; AC-10 create drops stale evidence | AC-1, AC-6, AC-9, AC-10, AC-12 |

Runner: `pnpm --filter afwilto-certifications-web-ui test` (vitest, jsdom).
Typecheck: `pnpm --filter afwilto-certifications-web-ui typecheck`.

---

## 8. Implementation notes

**New:** `src/pages/Form/buildUpdatePatch.ts` — pure, no React, no service imports:

```ts
export function buildUpdatePatch(
  initial: FormValues,
  current: FormValues,
  evidenceUrlSource?: EvidenceUrlSource,
): UpdateCertificationCommand
```

Applies BR-PATCH1/2/3, then BR-EV1-CLIENT, then attaches `evidenceUrlTarget` only when
`evidenceUrl` survives in the patch.

**Updated:**
- `src/pages/Form/CertificationEditPage.tsx` — keep the loaded cert's `FormValues` as
  the diff baseline; call `buildUpdatePatch(baseline, values, cert.evidenceUrlSource)`.
  An **empty patch is still submitted** (`update(id, {})`) rather than short-circuited,
  so save feedback and navigation stay uniform; the backend treats an all-absent
  merge-patch as a no-op.
- `src/pages/Form/CertificationFormPage.tsx` — drop evidence fields when
  status ≠ `achieved` (BR-EV1-CLIENT on create).
- `src/pages/Form/CertificationForm.tsx` — Category marked required + validated
  (BR-CAT1).
- `src/application/ports/ICertificationJourneyService.ts` (+ `index.ts`) — port delta §5.
- `src/infrastructure/adapters/http/CertificationHttpAdapter.ts` — map
  `evidenceUrlSource` on read; route `evidenceUrl` to `credlyUrl`/`officialUrl` per
  `evidenceUrlTarget` on write.
- `src/infrastructure/adapters/memory/InMemoryCertificationAdapter.ts` — enforce the
  backend contract per AC-11.

---

## 9. Independent review outcome

A reviewer with no authoring context verified the fix against the Go backend and confirmed
no reachable form input still produces a BR-EV1 or `category cannot be null` violation.
Findings folded into this spec: BR-EVT2 (clearing was not total), BR-HTTPS1, BR-HIST1,
AC-15 (the fake was *stricter* than the HTTP adapter on explicit `undefined`, and did not
model the `achievedDate` auto-default), plus the two acceptance rows whose tests were
missing (AC-9's create half, AC-12).

---

## 10. Known issues deliberately left out of this spec

Pre-existing defects confirmed during review; each needs its own slice.

1. **`create` is not atomic.** `CertificationHttpAdapter.create` does `POST` then a
   follow-up `PATCH`, because the backend's create ignores status and evidence. If the
   PATCH fails, the certification exists as `planned` with no evidence, and retrying from
   the form hits `a certification with this name already exists` with no way forward.
   BR-HTTPS1 removes the most likely trigger but not the race. Proper fix: let
   `POST /certifications` accept status/evidence, or compensate by deleting on failure.
2. **`CertificationEditPage` load failures.** A rejected `getById` leaves the page with a
   heading and nothing else (no error, no retry); a missing `:id` leaves the skeleton up
   forever; the effect's dep array omits `certificationJourneyService`.
3. **Three unsynchronized copies of BR-EV1** (Go domain, in-memory fake, patch builder),
   and `buildUpdatePatch` imports `FormValues` from a React component module. Candidate:
   a shared `src/domain/certification/` module the pages and the fake both consume.

---

## 11. Definition of done

- [ ] Every AC above maps to a passing named test.
- [ ] Full suite green; `typecheck` clean.
- [ ] Non-goals respected — zero backend diff.
- [ ] Independent review pass on the diff.
