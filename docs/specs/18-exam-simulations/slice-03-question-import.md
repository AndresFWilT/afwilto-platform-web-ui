# Slice 03 — Question import: JSON, dry run and apply

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-2, FR-3, FR-4 (JSON only), BR-Q1–Q3, BR-C1, BR-C2,
> BR-I1, BR-E3 (exam half), AC-1–AC-9 · Repo: `backend/afwilto-studies-mngr`

## 1. Functional specification

1. **Canonical schema.**
   - `frontend/docs/specs/18-exam-simulations/questions.schema.json` and `examples/` move to
     `api/questions.schema.json` and `api/examples/`.
   - The spec folder keeps a `README.md` that points to the new location (parent header).
   - The backend embeds the schema with `go:embed` and compiles it once at startup with
     `santhosh-tekuri/jsonschema/v6`, which becomes a direct dependency.
2. **Import endpoint.**
   - `POST /api/v1/exams/{id}/questions/import?dryRun=true|false[&primary=<name>]` takes a
     `multipart/form-data` `file`.
   - In this slice only `.json` is accepted, detected from the first non-space byte `{`. A
     `.zip` or any other file → 422, field `file`, rule `file_type`; slice 05 enables zip.
   - A JSON file larger than 10 MiB → 413 `payload_too_large`.
3. **Pipeline.** The stages run in order and stop at the first failing stage. Each stage
   collects **all** of its errors.

   | # | Stage | Error path / rule |
   |---|---|---|
   | 1 | Parse | `$`, rule `json` |
   | 2 | JSON Schema | JSON-pointer paths from the validator, converted to `questions[3].options` style, rule `schema` |
   | 3 | Semantics: BR-Q1/Q2 again in the domain, which also guards any non-HTTP path; BR-Q3 key uniqueness within the file; BR-C1 (existing + new classifications ≤ 2); BR-C2 primary single-valued | the BR rules |
   | 4 | Media | in this slice, **any** `media:` reference → `media_missing` |
4. **Inference** (parent FR-3), as domain functions:
   - `Fold(name)` applies NFKD, removes combining marks, lowercases, trims and collapses inner
     whitespace;
   - `Slug(name)` is `Fold`, then every run of non-`[a-z0-9]` becomes `-`, then the ends are
     trimmed;
   - `Levenshtein(a, b)` runs on folded names; the warning fires at distance ≤ 2 or on an
     equal slug;
   - `LargestRemainder(total, shares)` returns integer quotas that sum to `total`. Ties go to
     the lowest index, which is the category order of first appearance.
   - `StemFingerprint(stem)` is the hex `sha256` of `Fold(stem)`.
   - Primary resolution:
     1. the exam already has a primary → use it;
     2. otherwise the `primary` query parameter, matched by `Fold`;
     3. otherwise the first classification, in order of first appearance, that every question
        uses with ≤ 1 value;
     4. otherwise no primary is set, and the report says `primary: null` with a warning.
5. **Upsert and diff.**
   - **Matching.** Questions are matched by `key` among the exam's alive questions.
   - **Outcome per question.** A question is `unchanged` when its stored canonical form (stem,
     options in order, explanation, difficulty, folded category set, origin, source) equals the
     incoming one; otherwise it is `update`. A key with no match is `create`.
   - **Duplicate stems.** `duplicateStems` lists `create` items whose fingerprint equals an alive
     question with a different key.
6. **Apply.**
   - Runs in one transaction.
   - Creates the classifications and categories first, then the questions, options and
     category links.
   - Recomputes the inferred weights.
   - Returns 200 with the report, or 422 with the report and nothing written.
7. **Weights.** With `weightMode=inferred`, the weights are recomputed by `LargestRemainder`
   over the alive classified questions after every apply. The rule is in a domain function and
   is reused by slice 04.
8. **Exam half of BR-E3.** Deleting an exam with alive questions → 409 `in_use`.

**Non-goals:** zip files and media (slice 05); the bank list, get and delete, and category
editing (slice 04).

## 2. Report shape (`ImportReport`)

```json
{ "dryRun": true, "applied": false,
  "counts": { "create": 3, "update": 0, "unchanged": 0, "invalid": 0 },
  "keys":   { "create": ["…"], "update": [], "unchanged": [] },
  "errors": [ { "path": "questions[3].options", "rule": "correct_count", "message": "…" } ],
  "primary": "Dominio",
  "newClassifications": [ { "name": "Dominio" }, { "name": "Servicio" } ],
  "newCategories": [ { "classification": "Dominio", "name": "Alto rendimeinto",
                       "similarTo": ["Alto rendimiento"] } ],
  "weightsAfter": [ { "category": "Alto rendimiento", "percent": 46, "mode": "inferred" } ],
  "duplicateStems": [ { "key": "td-…", "existingKey": "wz-…" } ],
  "media": { "referenced": 0, "inZip": 0, "missing": [], "unused": [] },
  "preview": [ /* up to 5 Question objects, as they would be stored */ ],
  "warnings": [ "…" ] }
```

## 3. Acceptance criteria

The parent's AC-1 to AC-9 apply, plus these:

- **S03-1** The schema test: every file in `api/examples/*.json` (`moto-images.json` excluded,
  since its media is checked in slice 05) passes stages 1–3, and the 10 negative mutations from
  the spec-draft check are each rejected at stage 2.
- **S03-2** `LargestRemainder` table test:
  - (100, [5,3,3]) → [46,27,27];
  - (65, [30,26,24,20]) → [19,17,16,13];
  - (10, [1,1,1]) → [4,3,3];
  - (7, [0,0,5]) → [0,0,7];
  - (0, [1,2]) → [0,0].
- **S03-3** `Fold`: "  Alto   Rendimiento " = "alto rendimiento" and "Señales" → "senales".
  `Slug("Amazon S3 / Glacier")` = "amazon-s3-glacier".
- **S03-4** In a file of 4 questions where the second and fourth share `key` "x", the error is
  at `questions[3].key`, rule `duplicate_key`.
- **S03-5** An exam that already has 2 classifications receives a file that introduces "Nivel"
  → `too_many_classifications` at `questions[i].categories` for the first question that uses
  it.
- **S03-6** On a first import with `primary=Servicio`, where a question lists 2 services → that
  question gets `primary_single_valued`. Without `primary`, "Dominio" is chosen by the default
  rule and the import passes.
- **S03-7** A `.zip` upload → 422 rule `file_type`. A JSON larger than 10 MiB → 413.
- **S03-8** A dry run never writes. A row-count snapshot of all exams tables is equal before
  and after.
- **S03-9** `DELETE /exams/{id}` with alive questions → 409 `in_use`.

## 4. Database changes

`0010_create_questions.{up,down}.sql`, with every table guarded by a `forbid_hard_delete`
trigger:

- `exam_classifications` (`exam_id`, `name`, `position` 0/1, `weight_mode`, `deleted_at`),
  with a unique index on `(exam_id, fold_name)` among alive rows;
- `exam_categories` (`classification_id`, `key`, `name`, `fold_name`, `weight_percent`,
  `pace_questions`, `pace_minutes`, `deleted_at`), with a unique index on
  `(classification_id, fold_name)` among alive rows;
- `questions` (`exam_id`, `key`, `type`, `stem`, `explanation`, `difficulty`, `source_kind`,
  `source_name`, `origin jsonb`, `stem_fingerprint`, `version`, timestamps, `deleted_at`),
  with a unique index on `(exam_id, key)` among alive rows and an index on
  `(exam_id, stem_fingerprint)`;
- `question_options` (`question_id`, `position`, `text`, `image`, `alt`, `correct`,
  `rationale`). Rows are replaced on update by marking the old set deleted.
- `question_categories` (`question_id`, `category_id`, `deleted_at`).

## 5. Test plan

| Test | Kind | Covers |
|---|---|---|
| `exams/domain/fold_test.go`, `apportion_test.go`, `question_test.go`, `infer_test.go` | unit | S03-2, S03-3, BR-Q1/Q2, primary resolution |
| `exams/adapter/in/http/schema_test.go` | unit | S03-1 |
| `exams/app/usecase/import_test.go` | unit (fakes) | AC-1–AC-9, S03-4–S03-6 |
| `exams/adapter/in/http/import_api_test.go` | `httptest` + contract | S03-7, report shape |
| `exams/adapter/out/postgres/import_repo_test.go` | integration | AC-2, AC-4 atomicity, AC-8, S03-8, S03-9 |

## 6. Amendments

Fixes from the phase-1 independent review. Each one changes or pins behaviour the slice left open.

- 2026-10-23, schema stage bounds (H2). Before the JSON Schema runs, a `questions` array of more than 2,000 items is one error (rule `schema`, path `questions`, message names `maxItems` 2,000 and the actual count), and the schema is not run, so a 10 MiB file of `{}` items cannot build millions of errors. Any report holds at most 200 errors; when more were found, `warnings` gains "N more errors not shown" (N is the number left out) and `counts.invalid` still counts every invalid question.
- 2026-10-23, NUL bytes (H3). Stage 3 gains the rule `invalid_text`: any string of the file (key, stem, explanation, option text, image, alt, rationale, category and classification names, origin, source) that contains U+0000 is an error at that string's path (`questions[3].stem`, `questions[3].options[1].text`, `questions[3].categories` for a name), because Postgres text cannot store it. If the database still refuses a text value on apply (SQLSTATE 22021 or 22P05), the apply answers 422 with a report whose single error is `invalid_text` at `$`, never a 500. The rule joins the module spec's error-rule table in the slice 03 row and the OpenAPI `ErrorDetail.rule` list.
- 2026-10-23, `origin.number` (M2). The schema accepts `1.0` and `1e3` as integers, and so does the decoder. A value that is an integer but does not fit a 64-bit signed integer (for example `1e30`) is a stage-2 error at `questions[i].origin.number`, rule `schema`, never a decode error at `$`.
- 2026-10-23, `origin.number` cap (phase-2 H). `origin.number` is a whole number from 1 to 1,000,000: the schema gets `"maximum": 1000000` (both copies of `questions.schema.json`, byte-identical), so a file with `3000000000` fails stage 2 at `questions[i].origin.number` with rule `schema`, and stage 3 (`ValidateQuestion`, for callers that bypass the schema) reports the same path with rule `range`. Reason: the bank browser sorts by `(origin->>'number')::int`, and one stored value above 2^31-1 made every list of that exam answer 500. The browser also casts to `bigint`, so a row stored before this cap cannot break the list. This supersedes the 64-bit wording of the M2 entry above for values above 1,000,000 (they now fail the schema, still with rule `schema` at the same path).
- 2026-10-23, default primary (M3), a reading of §1.4 step 3 and FR-3.1. A classification qualifies when **no question lists more than one value in it**. A question with no value in it is unclassified (FR-3.3) and does not disqualify it, but the file must use the classification in at least one question. Among the qualifying ones the first in order of first appearance wins. Example: `q1 {Servicio: [S]}`, `q2 {Dominio: [A]}` → both qualify, `Servicio` is chosen, `q2` is unclassified in it.
- 2026-10-23, snapshot reads (M1). Reading the bank (classifications, questions and the exam summary) happens in one `REPEATABLE READ, READ ONLY` transaction, so a concurrent import cannot show half of itself.
- 2026-10-23, S03-8 is checked with a checksum of every exams-context row, including `deleted_at` and `version`, instead of a row count: a dry run that only flipped a flag or a version would pass a count.

