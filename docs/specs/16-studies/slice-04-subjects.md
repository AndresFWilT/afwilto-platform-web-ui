# Slice 04 — Subjects CRUD

> Status: Approved 2026-10-08 (module-spec approval covers the roadmap slices)
> Parent: `../16-studies.md` §11 Slice 04 (FR-0, FR-1, FR-2, BR-DEL1/2, BR-SUB1)

## 1. Functional specification

Subjects, end to end in `afwilto-studies-mngr`:

- domain value objects `SubjectName`, `SubjectDescription` and aggregate `Subject`;
- use cases: create, get, list (optional `categoryId` filter), update (rename /
  re-describe / move to another category), logical delete;
- the pgx repository;
- HTTP handlers for `GET/POST /api/v1/subjects` and
  `GET/PATCH/DELETE /api/v1/subjects/{id}`;
- migration `0005_create_subjects`, including its no-delete trigger and the guards;
- completion of the Slice 02 category work that waited for subjects:
  `subjectCount` becomes real and deleting a category with alive subjects is blocked.

**Non-goals:**
- Notes do not exist yet (Slice 05). Until then:
  - `noteCount` is always `0`;
  - the "alive notes" half of BR-DEL1 for subjects is not checked, so every delete of an
    alive subject succeeds.

  Slice 05 completes both (parent AC-B13 first bullet, AC-B14 `noteCount`) and must
  add their tests.
- No restore endpoint (parent §1.3).
- No frontend changes.

## 2. Business rules

- **Subject name:** trimmed; 1–120 characters (runes); no control characters
  (`unicode.IsControl`), rule `format`; unique case-insensitively among alive subjects
  of the same category (BR-SUB1).
- **Description:** optional plain text, at most 2000 characters (runes). Multi-line is
  allowed; only NUL is rejected (rule `format`). An empty string is stored as `null`.
- **`categoryId`:** required on create; must reference an alive category at any depth,
  non-leaf included (AC-B12). A missing or deleted category → 422, field
  `categoryId`, rule `not_found` (BR-DEL2, AC-B8). A `categoryId` that is not a UUID →
  422, rule `format`.
- **Update (`PATCH`, merge-patch):**
  - at least one of `categoryId`, `name`, `description` must be present, else 422,
    field `body`, rule `required`;
  - `description: null` clears the description; `name: null` or `categoryId: null` →
    422, rule `required` on that field;
  - moving checks name uniqueness in the target category (409 `duplicate_name`).
- **List:** `GET /subjects` is ordered by `lower(name)` in byte order (`COLLATE "C"`),
  ties by `id`. `?categoryId=X` returns only alive direct members of `X`; a well-formed
  `X` that is unknown or deleted yields an empty list (a valid empty result, not an
  error); a malformed `X` → 422, field `categoryId`, rule `format`.
- **Read model:** each subject carries `category` `{id, name, color, path}` (alive
  category, path derived by the recursive CTE) and `noteCount`.
- **Delete:** logical; afterwards the subject 404s and its name is free again in its
  category.
- **Category delete (completes BR-DEL1 / AC-B6):** a category with alive subjects →
  409 `in_use`, even when it has no child categories.
- **Malformed path ids:** an id in the path that is not a UUID → 404.

## 3. Acceptance criteria

Parent criteria covered: AC-B6 (alive-subject part), AC-B7 (`subjectCount` real),
AC-B8 (`categoryId` part), AC-B11, AC-B12, AC-B13 (unused subject → 204 logical),
AC-B14 (category filter; `noteCount` stays 0), AC-B24 for the `subjects` table.

Slice-specific criteria:
- **S04-1** `POST {"categoryId":C,"name":"Networking"}` → 201 with `Location`; the
  body has `category` with the category's `path`, `description: null`, `noteCount: 0`.
- **S04-2** The same name in two different categories → both 201; the same name
  (any case) in one category → 409, field `name`, rule `duplicate_name`.
- **S04-3** A subject can be created in a category that has children (AC-B12).
- **S04-4** `categoryId` of an unknown or deleted category, on create or on move →
  422 `categoryId` `not_found`.
- **S04-5** `PATCH` moves a subject to another category; its `category` reflects the
  new one. Moving onto a clashing name → 409 `duplicate_name`.
- **S04-6** `PATCH {}` → 422 `body` `required`; `PATCH {"description":null}` clears
  it; `PATCH {"name":null}` → 422 `name` `required`.
- **S04-7** Name > 120 runes → 422 `max_length`; description > 2000 runes → 422
  `max_length`; control char in the name or NUL in the description → 422 `format`.
- **S04-8** `GET /subjects?categoryId=X` returns only direct members of `X` (not those
  of its descendants); unknown `X` → empty list; malformed `X` → 422 `format`.
- **S04-9** `DELETE` of an alive subject → 204; afterwards `GET`, `PATCH`, `DELETE` →
  404, the list omits it, the name is reusable, and the row remains with
  `deleted_at`.
- **S04-10** `GET /categories` reports `subjectCount` = number of alive subjects
  directly in each category; a deleted subject is not counted.
- **S04-11** `DELETE /categories/{id}` with an alive subject → 409 `in_use`; after
  that subject is deleted → 204.
- **S04-12** The database enforces S04-11 and S04-4 itself, even against concurrent
  requests: a `BEFORE UPDATE OF deleted_at` trigger on `categories` rejects deleting a
  category with alive subjects (`category_in_use`), and a
  `BEFORE INSERT OR UPDATE` trigger on `subjects` rejects a missing or deleted
  category (`subject_category_not_found`). Both take the same transaction-scoped
  advisory lock as the category-tree guard, so they serialize.
- **S04-13** Body-size, JSON, id-case and contract-conformance rules from S02-3,
  S02-4, S02-6 apply to every subject endpoint.
- **S04-14** `DELETE FROM subjects` is rejected with SQLSTATE `23001`; the static
  guard (S01-2) stays green.

## 4. OpenAPI contract delta

None. Every endpoint used here has been in the contract since v0.1.0.

## 5. Database changes

`0005_create_subjects.{up,down}.sql`: the table exactly as parent §6, the
`subjects_no_delete` trigger, the `subjects_guard_category` trigger (S04-12), and the
`categories_guard_subjects` trigger on `categories` (S04-12). Later migrations shift
by one relative to parent §6 numbering (notes become `0006`).

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| domain | `subject_test.go` | name and description tables, boundaries |
| use case (fakes) | `usecase/subjects_test.go`, `usecase/categories_test.go` | create / move / delete paths, not-found, conflicts, category delete blocked by subjects |
| postgres (testcontainers) | `postgres/subject_repo_test.go`, `category_repo_test.go` | uniqueness per category, ordering, filter, category ref + path, `subjectCount`, triggers (S04-12, S04-14) |
| HTTP (fakes) | `http/subjects_api_test.go` | status codes, error bodies, S04-1..13, contract conformance |

## 7. Implementation notes

- `SubjectRepository` is a new out-port. The category delete use case also takes it
  (`CountAliveInCategory`) to produce the friendly 409 before the trigger does.
- The fakes link to each other (`FakeSubjectRepo` resolves category refs through
  `FakeCategoryRepo`; the latter counts subjects) so use-case and API tests exercise
  the real cross-aggregate rules.
- The subject read model reuses the category repository's recursive `aliveTree` query
  for `category.path`.
