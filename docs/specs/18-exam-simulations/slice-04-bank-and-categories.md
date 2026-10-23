# Slice 04 — Bank and category editing

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-1 (classification and category editing), BR-C3–C5,
> §6 bank endpoints · Repo: `backend/afwilto-studies-mngr`

## 1. Functional specification

1. **The bank browser.**
   - `GET /api/v1/exams/{id}/questions?category=<categoryId>&origin=<set>&difficulty=&q=&unclassified=true`
     returns `QuestionSummary` items `{id, key, type, stemExcerpt, categories[{classification,
     name}], difficulty, origin, version, updatedAt}`. `stemExcerpt` is the first 200 characters
     of the stem with Markdown syntax stripped.
   - `meta.totalItems` is included.
   - Filters combine with AND. `q` is a case-insensitive substring match on the stem.
   - Sorting is `origin.set`, then `origin.number`, then `key`.
2. **`GET /api/v1/questions/{id}`** returns the full `Question`: options in stored order,
   correct flags, rationales and explanation.
3. **`DELETE /api/v1/questions/{id}`** is a logical delete. With `weightMode=inferred`, it
   recomputes the inferred weights.
4. **Exam edit** extends `PATCH /api/v1/exams/{id}` with:
   - `classifications: [{id, name?}]`, to rename;
   - `primaryClassificationId?`, to swap primary and secondary. Allowed only when every alive
     question has ≤ 1 category in the new primary (BR-C2), and resets `weightMode` to
     `inferred`.
   - `weights: [{categoryId, percent}]`, which must cover **every** alive category of the
     primary. It sets `weightMode=manual` (BR-C3).
   - `weightMode: "inferred"`, which drops manual weights and recomputes.
   - `categories: [{id, name?, paceQuestions?, paceMinutes?}]`, to rename and set pace
     (BR-C4). `null` clears the pace pair.
   - All of these are applied atomically together with the exam fields, under the exam
     `version`.
5. **Merge.** `POST /api/v1/exams/{id}/categories/merge` with `{from, into}`:
   - the links move to `into`; a question that already had both keeps one link;
   - `from` is deleted logically;
   - the weights are recomputed when inferred. When manual, `into` absorbs `from`'s percent;
   - the exam `version` increments.
6. **Renames are checked against existing names.** Renaming a category or classification to the
   folded name of another alive one in the same scope → 409 `duplicate_name`.

## 2. Acceptance criteria

- **S04-1** The filters on a fixture of 6 questions:
  - `category=VPC` returns the 3 VPC questions;
  - `origin=Timed Set 3` returns its 2 questions, ordered by number;
  - `unclassified=true` returns the 1 question with no primary category.
- **S04-2** `GET /questions/{id}` returns the options in stored order with `correct` flags.
  After `DELETE`, it returns 404, the question is missing from the list, and the inferred
  weights are updated.
- **S04-3** `weights` that sum to 99 → 422 `weights_sum`. `weights` that skip one alive
  category → 422 `weights_sum` with the missing category id.
- **S04-4** Manual 30/26/24/20 is saved, then `weightMode:"inferred"` is sent: the weights
  return to the question shares.
- **S04-5** `paceQuestions:10` without `paceMinutes` → 422 `pace_pair`.
- **S04-6** Merging "Storage" into "Amazon S3":
  - a question that had both ends with one link to "Amazon S3";
  - "Storage" disappears from `GET /exams/{id}`;
  - with manual weights 10 + 20, "Amazon S3" ends at 30.
- **S04-7** Merging categories of different classifications, or a deleted category →
  422 `merge_scope`.
- **S04-8** Swapping the primary when some question has 2 categories in the would-be primary
  → 422 `primary_single_valued`, listing up to 10 question keys.
- **S04-9** A rename to an existing name that differs only in accents ("Senales" vs "Señales")
  → 409 `duplicate_name`.

## 3. Database changes

None. The tables come from slice 03. Merges and renames are `UPDATE`s only.

## 4. Test plan

| Test | Kind | Covers |
|---|---|---|
| `exams/domain/weights_test.go` | unit | S04-3, S04-4, merge weight math |
| `exams/app/usecase/bank_test.go`, `exam_edit_test.go` | unit (fakes) | S04-1–S04-9 |
| `exams/adapter/in/http/bank_api_test.go` | `httptest` + contract | response shapes |
| `exams/adapter/out/postgres/bank_repo_test.go` | integration | filters, merge link dedupe |
