# Slice 06a — Session preview and attempt start

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-7, FR-8, FR-9, AC-14–AC-17, AC-21
> Repo: `backend/afwilto-studies-mngr`

## 1. Functional specification

1. **`SessionConfig`** (JSON):

   ```json
   { "selection": { "kind": "simulation" }
                | { "kind": "random", "count": 40 }
                | { "kind": "categories", "classificationId": "…", "categoryIds": ["…"], "count": 20 | "all" }
                | { "kind": "origin-set", "set": "Timed Set 3" },
     "timing":   { "kind": "untimed" } | { "kind": "timed", "minutes": 30 },
     "feedback": "end" | "each" }
   ```

   - For `simulation`, `timing` and `feedback` must be omitted; they are forced to the exam
     time and `end`. Sending them → 422 rule `locked_by_simulation`.
   - `count` ranges over 1–200.
2. **`POST /api/v1/exams/{id}/sessions/preview`** with `{config}` is a pure read. It returns
   `{poolSize, drawCount, suggestedMinutes, shortages[]}`:
   - **`suggestedMinutes`** follows FR-8, computed for the **expected** draw:
     - with `count: "all"`, it is the exact sum;
     - with N < pool, it is `ceil(N × mean pace of the pool)`.
     The real draw at start may differ by rounding, and the editable time field absorbs that.
     (The parent's AC-16 second case uses the drawn questions; that applies to the start
     response, see S06a-4.)
   - **`shortages`** lists the categories whose alive questions are fewer than their
     simulation quota. It is the same check the start runs.
3. **`POST /api/v1/exams/{id}/attempts`** with `{config, seed?}`:
   - **Seed.** `seed` defaults to a random uint64. The draw uses `math/rand/v2` PCG seeded with
     `seed` only, so the same seed on an unchanged bank repeats the draw (AC-17).
   - **Draw.**
     - `simulation`: quotas by `LargestRemainder(questionCount, weights)` over primary
       categories with weight > 0. Then, per category in category order, a seeded shuffle of
       the alive question ids sorted by id, taking the first `quota`. Unclassified questions
       are never drawn.
     - `random` and `categories`: a seeded shuffle of the pool sorted by id, taking `count`,
       or everything for `"all"`.
     - `origin-set`: all alive questions with `origin.set` equal to the value, ordered by
       `origin.number`, then `key`. An empty set → 422 `insufficient_questions`.
   - **Order.** Questions are shuffled, except in `origin-set`. Options are always shuffled,
     both seeded.
   - **Snapshot.** Each `AttemptItem` holds the stem, the options in displayed order with
     their new labels and correct flags, the explanation, rationales, categories and
     `paceMinutes`.
   - **Deadline.** `timed` sets `deadlineAt = startedAt + minutes`.
   - **Response.** 201 `Attempt` `{id, examId, config, status, startedAt, deadlineAt?,
     remainingSeconds?, suggestedMinutes, items[{position, stem, options[{label, text?, image?,
     alt?}], type, chooseCount?}]}`. There are **no correct flags, rationales or explanations**
     here.
4. **BR-A1.** An exam with an `in_progress` attempt → 409 `attempt_in_progress`, with
   `details[0].field = attemptId` and the id in the message.

## 2. Acceptance criteria

The parent's AC-14, AC-15, AC-17 and AC-21 apply, plus these:

- **S06a-1** A preview of `simulation` on the AC-14 fixture → `{poolSize: ≥65, drawCount: 65,
  suggestedMinutes: 130, shortages: []}`.
- **S06a-2** A preview of `categories` VPC + Lambda with `"all"`, where VPC has pace 10/20 and
  Lambda 4/10 → `suggestedMinutes: 30` (AC-16, first case).
- **S06a-3** A start with `categories` VPC + Lambda, `count: 7`, seed s, where the fixture draw
  is 5 VPC + 2 Lambda → `suggestedMinutes: 15` (AC-16, second case).
- **S06a-4** The start response contains no `correct`, `rationale` or `explanation` key at any
  depth. The assertion walks the whole JSON.
- **S06a-5** `simulation` sent with `timing` → 422 `locked_by_simulation`.
- **S06a-6** A second start while one attempt is `in_progress` → 409 `attempt_in_progress`.
- **S06a-7** A `multi` question with 2 correct options → `chooseCount: 2` in the item.

## 3. Database changes

`0013_create_attempts.{up,down}.sql`:
- `attempts` (`id`, `exam_id`, `config jsonb`, `status`, `seed bigint`, `started_at`,
  `deadline_at`, `submitted_at`, `score_percent numeric(5,2)`, `passed`), with a partial
  unique index on `(exam_id) WHERE status = 'in_progress'` to enforce BR-A1 in the DB;
- `attempt_items` (`attempt_id`, `position`, `question_id`, `snapshot jsonb`, `selected
  text[]`, `flagged`, `answered_at`, `revealed boolean` (used by 06b), `correct`), primary key
  `(attempt_id, position)`;
- both tables have no-delete triggers.

## 4. Test plan

| Test | Kind | Covers |
|---|---|---|
| `exams/domain/draw_test.go` | unit | AC-14, AC-17, the origin-set order, seeded shuffles |
| `exams/domain/pace_test.go` | unit | FR-8, S06a-2, S06a-3 |
| `exams/app/usecase/start_test.go` | unit (fakes, fake clock) | AC-15, S06a-5, S06a-6 |
| `exams/adapter/in/http/attempts_api_test.go` | `httptest` + contract | S06a-4, S06a-7 |
| `exams/adapter/out/postgres/attempt_repo_test.go` | integration | the BR-A1 unique index, snapshot round-trip |
