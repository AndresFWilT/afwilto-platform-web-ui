# Slice 06b — Answering, deadline, scoring, review and history

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-10, BR-A1–A5, AC-18–AC-20, D-11–D-13
> Repo: `backend/afwilto-studies-mngr`

## 1. Functional specification

1. **Lazy expiry.** Every operation on an attempt starts with `finalizeIfExpired(now)`:
   - when `status=in_progress`, a deadline is set and `now > deadlineAt + 5 s`, the attempt is
     scored as it stands and set to `expired` before the request continues;
   - all time comes from the `Clock` port.
2. **`GET /api/v1/attempts/{id}`** returns the start shape plus each item's `{selected,
   flagged, answered}` and `remainingSeconds = max(0, ceil(deadlineAt − now))`.
   - For items already revealed under `feedback: each`, it also returns `{correct,
     correctLabels, rationales, explanation}`.
3. **`PUT /api/v1/attempts/{id}/items/{position}`** with `{selected: string[], flagged:
   boolean}`:
   - labels must be ones the item shows (`invalid_label`) and must not repeat;
   - `single` takes ≤ 1 label; `multi` takes ≤ `chooseCount` (BR-A5, `too_many_selected`);
   - `feedback: end` → 200 `{position, selected, flagged}` only (BR-A4);
   - `feedback: each` → when `selected` is non-empty, the response adds the reveal fields and
     sets `revealed=true`;
   - **after a reveal, `selected` is immutable** (D-13). A later `PUT` may change `flagged`
     only; a different `selected` → 409 `answer_locked`;
   - an attempt that is `submitted` or `expired` → 409 `attempt_closed` (BR-A3). When this call
     is what expired it, the response is `attempt_expired` (BR-A2).
4. **`POST /api/v1/attempts/{id}/submit`** scores and closes the attempt:
   - `correct` holds when the set of selected labels equals the set of correct labels exactly;
   - `scorePercent = round2(100 × correct / total)`;
   - `passed` is set only when `selection.kind == simulation`, and is otherwise `null`;
   - it returns `AttemptResult` `{scorePercent, passed, correctCount, total, durationSeconds,
     breakdown[{classification, categories[{name, correct, total, percent}]}]}`. Categories
     are sorted by percent ascending, then name;
   - submitting twice → 409 `attempt_closed`.
5. **`GET /api/v1/attempts/{id}/review`** is available once the attempt is closed. It returns
   every item with snapshot, selected, correct, correctLabels, rationales, explanation, flagged
   and `noteId?`:
   - `noteId` is set when `origin.noteRef`, with any trailing `(diap. …)` stripped, equals an
     alive note title of the exam's subject (read through a `NoteDirectory` port: SQL on
     `notes`, no Go import);
   - while the attempt is open, it returns 409 `attempt_in_progress`.
6. **`GET /api/v1/exams/{id}/attempts`** returns `AttemptSummary[]` `{id, selectionKind,
   timingKind, feedback, status, startedAt, durationSeconds?, scorePercent?, passed?}`, newest
   first. `meta.trend` holds the `[{at, scorePercent}]` of closed `simulation` attempts only,
   oldest first (D-11).
7. **The exam's `lastSimulation`**, from slice 02, now comes from the latest closed simulation.

## 2. Acceptance criteria

The parent's AC-18 to AC-20 apply, plus these:

- **S06b-1** A fake clock with `deadlineAt = T`. `GET` at T−10 s → `remainingSeconds: 10`;
  `GET` at T+3 s → `remainingSeconds: 0` and still `in_progress`; `GET` at T+6 s →
  `status: expired` with a score.
- **S06b-2** `feedback: each`. Answer "B", which is wrong → the response has `correct: false`
  and `correctLabels: ["C"]`. `PUT` `{selected: ["C"]}` → 409 `answer_locked`. `PUT`
  `{selected: ["B"], flagged: true}` → 200.
- **S06b-3** `selected: ["Z"]` on an item with labels A–D → 422 `invalid_label`.
- **S06b-4** Of 4 items, 3 are answered and 2 are right → `scorePercent: 50.00`. A
  `random`-selection attempt gives `passed: null`.
- **S06b-5** The breakdown on a fixture with domain A at 2/2 and domain B at 0/2 lists B first.
- **S06b-6** The review of a closed attempt links `noteId` for `noteRef: "03 · Route 53
  (diap. 12)"` when a note titled "03 · Route 53" is alive. After that note is deleted,
  `noteId` is absent.
- **S06b-7** The history returns 3 attempts (2 simulations, 1 practice) newest first, and
  `meta.trend` has 2 points.
- **S06b-8** Submitting after expiry → 409 `attempt_closed`; the attempt is already scored.

## 3. Database changes

None. `attempt_items.revealed` already exists from slice 06a's `0013`.

## 4. Test plan

| Test | Kind | Covers |
|---|---|---|
| `exams/domain/score_test.go` | unit | AC-20, S06b-4, S06b-5 |
| `exams/app/usecase/answer_test.go`, `submit_test.go` | unit (fake clock) | AC-19, S06b-1–S06b-3, S06b-8 |
| `exams/adapter/in/http/attempts_api_test.go` (extended) | `httptest` + contract | AC-18 (no-leak walk), S06b-2 |
| `exams/adapter/out/postgres/review_repo_test.go` | integration | S06b-6, S06b-7 |

## 5. Amendments

- 2026-10-23 (coordinator decisions, extend §1; contract is additive, OpenAPI 0.3.0):
  - **Result on read.** `GET /api/v1/attempts/{id}` on a closed attempt (`submitted` or `expired`) also returns `result`, the same `AttemptResult` the submit returns. The frontend used to compose it from three calls.
  - **Clock resync on save.** The `PUT .../items/{position}` response also returns `remainingSeconds` (the GET formula) for timed attempts, and omits it for untimed ones, so the runner resyncs its countdown after every save. With `feedback: end` this is the only field beyond `position`, `selected` and `flagged` (BR-A4 forbids correctness, not time).
  - **Start finalizes an expired open attempt.** Lazy expiry also runs at `POST /exams/{id}/attempts`: when the exam's `in_progress` attempt is past `deadlineAt + 5 s`, it is scored and set to `expired` first, and the new attempt starts instead of answering 409 `attempt_in_progress`. This replaces the last bullet of 06a §5 for that case; an attempt still inside its grace period keeps blocking the start.
  - **CORS.** The preflight allows `PUT`.
- 2026-10-23 (phase-3 review fixes):
  - **Submit inside the grace.** A `submit` that arrives after `deadlineAt` but inside the 5 s grace is accepted, and the attempt is closed with `submittedAt = min(now, deadlineAt)`, so `durationSeconds` is the time the taker had and never exceeds the time limit (same principle as "Expiry time" below).
  - **Reveal under `feedback: each`.** A non-empty `selected` reveals the item and locks it (see "Lock" below), so a client must send the selection of a `multi` item only once it holds `chooseCount` labels; an earlier `PUT` with a partial set would lock a partial answer. The frontend already does this.
  - **Label violations are capped.** The label validation of a `PUT` stops after 10 violations, so a huge `selected` array cannot produce a huge 422 body.
  - **Start racing a close.** The status of the open attempt that `POST /exams/{id}/attempts` found is read again under its row lock. One that a concurrent `submit` or finalize closed in the meantime does not block the start; a start that still loses the unique index answers 409 `attempt_in_progress` naming the attempt that is really in progress.
- 2026-10-23: details the slice left open, fixed by the tests.
  - **`PUT` check order.** Expiry (`attempt_expired`), then closed (`attempt_closed`), then an unknown `position` (404), then the labels (422), then the lock (`answer_locked`).
  - **Labels.** A repeated label is `invalid_label` (field `selected[i]` of the second one); there is no rule of its own. When any label is invalid or repeated, only those violations come back; `too_many_selected` (field `selected`) is reported when every label is valid and the count passes the limit. `single` allows 1 label, `multi` allows `chooseCount`.
  - **Lock.** An item locks on its first non-empty answer under `feedback: each`. A later `PUT` is allowed when its `selected` is the same set (order ignored), so only `flagged` changes; the response again carries the reveal fields. Clearing the selection of a locked item is a different set, so `answer_locked`. A `PUT` with an empty selection never reveals.
  - **Expiry time.** An attempt that expires is closed with `submittedAt = deadlineAt`, however late the request that finds it, so `durationSeconds` is the time the taker had and not the time until someone looked. `durationSeconds` is `submittedAt − startedAt` in whole seconds (rounded down).
  - **Scoring.** The percent is exact: `round2` is half-up on integer hundredths (`(20000 × correct + total) / (2 × total)`), and `passed` compares those hundredths with `passPercent × 100`, using the `pass_percent` frozen at the start. An item with no categories in a classification is not part of that classification's breakdown. Classifications are sorted by name, categories by percent ascending, then name (case-insensitive, then bytewise).
  - **GET items.** Every item carries `selected`, `flagged` and `answered` (the start response too, with empty values). Reveal fields appear only on items with `revealed = true`, on open and closed attempts alike. `remainingSeconds` of a closed timed attempt is 0.
  - **Review.** `correct` is the stored value, `correctLabels` come from the snapshot, `rationales` holds the non-empty ones by label (`{}` when none), `explanation` is `null` when absent. `noteId` matches the stripped `noteRef` (`\s*\(diap\.[^)]*\)\s*$` removed, then trimmed) by exact, case-sensitive title among the alive notes of the exam's subject.
  - **History.** `timingKind` and `feedback` of a `simulation` are `timed` and `end` (the forced values), even though its stored config omits them. `passed` is absent for non-simulations. `meta.trend[].at` is `submittedAt`. The history is a pure read: it does not finalize an open attempt.
  - **`lastSimulation`.** The latest closed simulation by `submittedAt`; it appears in the exam detail and in the subject's exam list, which share the `ExamSummary` schema.
