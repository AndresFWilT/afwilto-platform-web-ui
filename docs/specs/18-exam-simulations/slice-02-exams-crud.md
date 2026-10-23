# Slice 02 — Exams CRUD

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-1, BR-E1–E3 · Repo: `backend/afwilto-studies-mngr`

## 1. Functional specification

- **Create** with `POST /api/v1/subjects/{id}/exams`:
  - body `{name, questionCount, timeLimitMin, passPercent}`;
  - the subject must be alive, checked through the out-port `SubjectDirectory.IsAlive`.
- **List** with `GET /api/v1/subjects/{id}/exams`:
  - each item is an `ExamSummary` `{id, subjectId, name, questionCount, timeLimitMin,
    passPercent, questionTotal, lastSimulation?: {scorePercent, passed, at}, version,
    createdAt, updatedAt}`;
  - `questionTotal` is 0 and `lastSimulation` is absent until slices 03 and 06b fill them in;
  - the list is sorted by `name asc`, then by `id`.
- **Read** with `GET /api/v1/exams/{id}`: `Exam` = `ExamSummary` + `classifications[]`, which
  is empty until slice 03 creates them.
- **Edit** with `PATCH /api/v1/exams/{id}`:
  - body `{version (required), name?, questionCount?, timeLimitMin?, passPercent?}`;
  - each successful edit increments `version`. Classification and category editing comes in
    slice 04.
- **Delete** with `DELETE /api/v1/exams/{id}`: a logical delete, returning 204.
- **Subject guard.** Studies' `DeleteSubject` gains an out-port `SubjectExamCounter`,
  implemented in `internal/studies/adapter/out/postgres` by a SQL count on `exams`. This is a
  cross-context read through SQL only, with no Go import. A subject with alive exams →
  409 `in_use`.

**Non-goals:** questions, classifications and categories, which come in slices 03 and 04.

## 2. Business rules

- BR-E1: the name is trimmed and must be unique among alive exams of the subject, compared
  case-insensitively.
- BR-E2: the numeric ranges in parent §4.
- BR-E3: the subject half lands here. The exam half (alive questions) lands in slice 03.

## 3. Acceptance criteria

- **S02-1** `POST` `{name:"SAA-C03", questionCount:65, timeLimitMin:130, passPercent:72}` on an
  alive subject → 201 `Exam` with `version:1` and `classifications:[]`.
- **S02-2** The same name, differing only in case or surrounding spaces, on the same subject →
  409 `duplicate_name`. The same name on another subject → 201.
- **S02-3** `questionCount:0`, `timeLimitMin:601` or `passPercent:101` → 422 with one violation
  per field and rule `range`.
- **S02-4** A deleted or unknown subject → 422 `validation_failed`, field `subjectId`, rule
  `not_found`. A malformed id → 404.
- **S02-5** `PATCH` with a stale `version` → 409 `stale_version`. A correct `version` → 200 and
  `version+1`.
- **S02-6** After `DELETE`, the exam returns 404 on `GET`, is missing from the subject list, and
  its name can be reused.
- **S02-7** `DELETE /subjects/{id}` while the subject has an alive exam → 409 `in_use`. After the
  exam is deleted, the subject delete → 204.
- **S02-8** A SQL `DELETE FROM exams` is rejected by the `forbid_hard_delete` trigger.

## 4. OpenAPI contract delta

None: v0.2.0 already documents these paths. Responses recorded from the real router are
checked against it.

## 5. Database changes

`0009_create_exams.{up,down}.sql`:
- `exams` (`id uuid pk`, `subject_id uuid not null references subjects`, `name`,
  `question_count`, `time_limit_min`, `pass_percent` with CHECK constraints for BR-E2,
  `version`, `created_at`, `updated_at`, `deleted_at`);
- a partial unique index on `(subject_id, lower(btrim(name))) WHERE deleted_at IS NULL`;
- a `forbid_hard_delete` trigger.

## 6. Test plan

| Test | Kind | Covers |
|---|---|---|
| `exams/domain/exam_test.go` | unit | BR-E1 normalization, BR-E2 ranges |
| `exams/app/usecase/exams_test.go` | unit (fakes) | S02-1–S02-6 |
| `exams/adapter/in/http/exams_api_test.go` | `httptest` + contract | S02-1–S02-6 |
| `studies/app/usecase/subjects_test.go` (extended) | unit | S02-7 |
| `exams/adapter/out/postgres/exam_repo_test.go` | integration | S02-6, S02-8 |

## 7. Amendments

- 2026-10-23: a subject delete racing an exam create had no database guard, so both could commit. Migration `0011_guard_subject_exams.{up,down}.sql` (between slice 03's 0010 and the later slices) mirrors Spec 16's `guard_subject_notes`: a `BEFORE UPDATE OF deleted_at` trigger on `subjects` and a `BEFORE INSERT OR UPDATE` trigger on `exams` take one advisory lock (`studies.exams.refs`), so the two writes serialize. The subject delete then fails with `subject_in_use` (409 `in_use`) when an alive exam exists, and the exam write fails with `exam_subject_not_found` (404 `not_found` on `subjectId`) when the subject is gone. The 409 message from the database path no longer names notes. This renumbers slice 05's media migration to `0012` and slice 06a's attempts migration to `0013`.
