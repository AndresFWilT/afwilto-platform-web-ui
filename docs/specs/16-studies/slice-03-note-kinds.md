# Slice 03 — Note kinds CRUD + seed

> Status: Approved 2026-10-08 (module-spec approval covers the roadmap slices)
> Parent: `../16-studies.md` §11 Slice 03 (FR-0, FR-7, BR-DEL1, BR-KIND1)

## 1. Functional specification

Note kinds as a managed resource, end to end in `afwilto-studies-mngr`:

- domain value object `NoteKindName` and aggregate `NoteKind`;
- use cases: create, get, list, rename, logical delete;
- the pgx repository;
- HTTP handlers for `GET/POST /api/v1/note-kinds` and
  `GET/PATCH/DELETE /api/v1/note-kinds/{id}`;
- migration `0004_create_note_kinds`, including its no-delete trigger and the seed.

**Non-goals:**
- Notes do not exist yet; the `notes` table lands in Slice 05. Until then:
  - `noteCount` is always `0`;
  - the "used by an alive note" half of BR-DEL1 is not checked, so every delete of an
    alive kind succeeds.

  Slice 05 completes both (parent AC-B10 first bullet, and the `kindId` `not_found`
  check on note create) and must add their tests.
- No restore endpoint (parent §1.3).
- No frontend changes.

## 2. Business rules (from the parent spec)

- **Kind name:**
  - trimmed;
  - 1–40 characters (runes);
  - no control characters (`unicode.IsControl`), rule `format`;
  - unique case-insensitively among alive kinds (BR-KIND1).
- **Seed:** the migration inserts three kinds with fixed UUIDs, in this order:
  - `00000000-0000-7000-8000-000000000001` **Summary**
  - `00000000-0000-7000-8000-000000000002` **Cheat sheet**
  - `00000000-0000-7000-8000-000000000003` **Notes**

  They behave like any other kind afterwards: they can be renamed or deleted.
- **Delete:** logical; afterwards the kind 404s and its name is free again.
- **Ordering:** `GET /note-kinds` is ordered by `lower(name)` in byte order
  (`COLLATE "C"`), ties by `id`.
- **Rename to the same name** (same case or different case, same kind) → 200; the
  uniqueness check ignores the kind itself.
- **Malformed ids:** an id in the path that is not a UUID → 404 (never a 500).

## 3. Acceptance criteria

Parent criteria covered: AC-B9, AC-B10 (unused → 204 logical; the deleted-kind
`kindId` half waits for Slice 05), AC-B24 for the `note_kinds` table.

Slice-specific criteria:
- **S03-1** A fresh database lists exactly `Cheat sheet`, `Notes`, `Summary`, with the
  fixed ids above and `noteCount = 0`.
- **S03-2** `POST {"name":"Lab report"}` → 201 with `Location`; `POST {"name":"lab
  report"}` → 409, field `name`, rule `duplicate_name`.
- **S03-3** `PATCH {"name":"Lab"}` → 200. `PATCH` with a missing or blank name → 422,
  field `name`, rule `required`. A name over 40 runes → 422, rule `max_length`. A name
  with a control character → 422, rule `format`.
- **S03-4** Renaming a kind to the name of another alive kind → 409 `duplicate_name`.
  Renaming to a deleted kind's name → 200.
- **S03-5** `DELETE` of an alive kind → 204. Afterwards `GET`, `PATCH` and `DELETE` of
  it → 404, the list omits it, and a new kind may reuse its name. The row remains in
  the table with `deleted_at` set.
- **S03-6** A body over `MAX_BODY_BYTES` → 413; invalid JSON or trailing data → 422,
  field `body`, rule `json` (same decode helper as categories).
- **S03-7** Every response of every note-kind endpoint conforms to
  `api/openapi.yaml` (200, 201, 204, 404, 409, 413, 422).
- **S03-8** Ids are case-insensitive in the path; responses return lowercase ids.
- **S03-9** `DELETE FROM note_kinds` is rejected by the database (SQLSTATE `23001`);
  the static guard from S01-2 stays green.

## 4. OpenAPI contract delta

None. Every endpoint used here has been in the contract since v0.1.0.

## 5. Database changes

`0004_create_note_kinds.{up,down}.sql`: the table exactly as parent §6, the
`note_kinds_no_delete` trigger, and the seed.

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| domain | `note_kind_test.go` | name table: trim, empty, 40/41 runes, control chars |
| use case (fakes) | `usecase/note_kinds_test.go` | create, duplicate, rename (self / other / deleted name), delete, not-found |
| postgres (testcontainers) | `postgres/note_kind_repo_test.go` | S03-1 seed, ordering, partial unique index, logical delete row remains, S03-9 trigger |
| HTTP (fakes) | `http/note_kinds_api_test.go` | status codes, error bodies, S03-2..8, contract conformance |

## 7. Implementation notes

- Mirrors the category slice: same error types, same `decodeJSON` / `pathID`
  helpers, same fake-repository style (a `FakeNoteKindRepo` in `testsupport`).
- The seed ids are version-7-shaped constants so they sort before generated ids.
