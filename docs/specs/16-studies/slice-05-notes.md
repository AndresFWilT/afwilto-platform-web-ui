# Slice 05 — Notes CRUD + version guard + sorting

> Status: Approved 2026-10-08 (module-spec approval covers the roadmap slices)
> Parent: `../16-studies.md` §11 Slice 05 (FR-0, FR-3, BR-DEL1/2, BR-NOTE1..4)

## 1. Functional specification

Notes, end to end in `afwilto-studies-mngr`:

- domain value objects `NoteTitle`, `MarkdownContent`, `SortSpec` and aggregate `Note`;
- use cases: create (in a subject), get, list a subject's notes (sorted), update
  (optimistic version guard, move to another subject), logical delete;
- the pgx repository;
- HTTP handlers for `GET/POST /api/v1/subjects/{id}/notes` and
  `GET/PATCH/DELETE /api/v1/notes/{id}`;
- migration `0006_create_notes`, including its no-delete trigger and the guards;
- completion of the work that waited for notes:
  - `noteCount` of subjects and note kinds becomes real;
  - deleting a subject or a kind with alive notes is blocked (BR-DEL1);
  - creating or editing a note with a deleted subject or kind is rejected (BR-DEL2).

**Non-goals (Slice 06 owns them):**
- Tags and slab links. The `tags` and `slabLinks` fields exist in the contract and in
  every response, but in this slice:
  - responses always carry `tags: []` and `slabLinks: []`;
  - a request that sends a non-empty `tags` or `slabLinks` is rejected with 422, rule
    `not_implemented`, so data is never silently dropped; an empty array is accepted;
  - the `?tag=` filter of `GET /subjects/{id}/notes` is rejected the same way;
  - `GET /api/v1/notes` and `GET /api/v1/tags` are not routed yet.
- No version history (parent §1.3); an edit overwrites.
- No frontend changes.

## 2. Business rules

- **Title:** trimmed; 1–200 characters (runes); no control characters
  (`unicode.IsControl`), rule `format`; unique case-insensitively among alive notes of
  the same subject (BR-NOTE1, 409 `duplicate_name`, field `title`).
- **Content:** Markdown, 0–200,000 characters (runes), stored byte-for-byte (no
  trimming, no newline normalization). Only NUL is rejected (rule `format`). Over the
  limit → 422, rule `max_length` (BR-NOTE2). Omitted on create means `""`.
- **References (BR-DEL2):**
  - the `{id}` subject of `POST /subjects/{id}/notes` that is unknown or deleted → 404;
  - `kindId` unknown or deleted → 422, field `kindId`, rule `not_found`;
  - `subjectId` on an edit that is unknown or deleted → 422, field `subjectId`, rule
    `not_found`;
  - an id in a body that is not a UUID → 422, rule `format`; a missing `kindId` on
    create → 422, rule `required`.
- **Version guard (BR-NOTE3, BR-NOTE4):**
  - `PATCH` requires `version` (integer ≥ 1); missing or < 1 → 422, field `version`,
    rule `required` / `min`;
  - a `version` that differs from the stored one → 409, field `version`, rule
    `stale_version`, and nothing is written;
  - every successful edit increments `version` by 1 and sets `updatedAt`;
  - the guard is in the `UPDATE` itself (`WHERE id=$1 AND version=$2 AND deleted_at IS
    NULL`), so two concurrent edits that read the same version cannot both win.
- **Edit fields:** at least one of `title`, `kindId`, `subjectId`, `content` besides
  `version`, else 422, field `body`, rule `required`. `null` for any of them → 422,
  rule `required` on that field. Moving to another subject checks title uniqueness
  there (409 `duplicate_name`).
- **Sorting (FR-3):**
  - `sort` ∈ `title | createdAt | updatedAt` (default `title`), `order` ∈ `asc | desc`
    (default `asc`); anything else → 422, field `sort` / `order`, rule `enum`;
  - `title` compares case-insensitively in byte order (`COLLATE "C"`);
  - ties break by `title asc` (case-insensitive), then `id asc`.
- **List items** carry no `content`; they carry `kind {id, name}`, `tags`, `version`
  and timestamps.
- **Delete:** logical; afterwards the note 404s, leaves lists and counts, and its
  title is free again in the subject. Delete does not need a `version`.
- **BR-DEL1 completion:** a subject with an alive note → 409 `in_use`; a note kind
  used by an alive note → 409 `in_use`.
- **Malformed path ids:** 404.

## 3. Acceptance criteria

Parent criteria covered: AC-B10 (in-use half), AC-B13 (in-use half), AC-B14
(`noteCount`), AC-B15, AC-B16, AC-B17, AC-B18, AC-B19 (the list-and-count parts; tag
views arrive in Slice 06), AC-B24 for the `notes` table.

Slice-specific criteria:
- **S05-1** AC-B15 exactly: content with `$$E=mc^2$$`, a ` ```go ` block and a
  ` ```mermaid ` block round-trips byte for byte, `version: 1`, `kind: {id, name}`;
  the response has `slabLinks: []`, `tags: []`, `Location`.
- **S05-2** AC-B16 sort table, verbatim, plus `order=bogus` → 422 `order` `enum`.
- **S05-3** AC-B17: first `PATCH` with `version: 1` → 200 `version: 2`; second with
  `version: 1` → 409 `stale_version`, content unchanged.
- **S05-4** AC-B18: 200,000 characters → 201; 200,001 → 422. The HTTP body limit
  (`MAX_BODY_BYTES`, 1 MiB by default) still applies first and yields 413. The API
  tests run with a 512-byte limit, so the character boundary is proven in the domain,
  use-case and repository tests, and the API tests prove the 413 path.
- **S05-5** AC-B19: `DELETE` → 204, row remains with `deleted_at`; `GET`, `PATCH`,
  `DELETE` → 404; title reusable; the subject's `noteCount` drops.
- **S05-6** Same title (any case) in one subject → 409 `duplicate_name`; in two
  subjects → both 201.
- **S05-7** `noteCount` of a subject and of a kind counts alive notes only.
- **S05-8** Deleting a subject or a kind with an alive note → 409 `in_use`; after the
  note is deleted → 204.
- **S05-9** Create with a deleted kind → 422 `kindId` `not_found`; edit moving to a
  deleted subject → 422 `subjectId` `not_found`; create in a deleted subject → 404.
- **S05-10** `PATCH` with only `version` → 422 `body` `required`; missing `version` →
  422 `version` `required`.
- **S05-11** A non-empty `tags` / `slabLinks` / `?tag=` → 422 `not_implemented`;
  empty arrays are accepted.
- **S05-12** The database enforces the references itself, also under concurrency: a
  `BEFORE INSERT OR UPDATE` trigger on `notes` rejects a missing or deleted subject or
  kind (`note_subject_not_found`, `note_kind_not_found`); `BEFORE UPDATE OF
  deleted_at` triggers on `subjects` and `note_kinds` reject a delete while alive notes
  exist (`subject_in_use`, `kind_in_use`). All take one shared advisory lock.
- **S05-13** Body-size, JSON, id-case and contract-conformance rules from S02-3,
  S02-4, S02-6 apply to every note endpoint.
- **S05-14** `DELETE FROM notes` is rejected with SQLSTATE `23001`.

## 4. OpenAPI contract delta

None.

## 5. Database changes

`0006_create_notes.{up,down}.sql`: the table exactly as parent §6, `notes_no_delete`,
the `notes_guard_refs` trigger and the `subjects_guard_notes` /
`note_kinds_guard_notes` triggers. Tags move to `0007` (Slice 06).

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| domain | `note_test.go` | title and content tables (200,000 / 200,001), `SortSpec` parsing, version increment, delete |
| use case (fakes) | `usecase/notes_test.go`, `subjects_test.go`, `note_kinds_test.go` | create / edit / move / stale / delete, BR-DEL1, BR-DEL2 |
| postgres (testcontainers) | `postgres/note_repo_test.go` | uniqueness, sorting, stale-version `UPDATE`, counts, triggers, byte-exact content |
| HTTP (fakes) | `http/notes_api_test.go` | status codes, error bodies, S05-1..13, contract conformance |

## 7. Implementation notes

- `NoteRepository.Update` takes `expectedVersion`; a zero-row result is resolved into
  `ErrNotFound` (row not alive) or a `stale_version` conflict (row alive, other
  version). `Delete` is separate and version-free.
- The subject-delete and kind-delete use cases take the note repository
  (`CountAliveBySubject`, `CountAliveByKind`) for the friendly 409; the triggers are
  the guarantee.
- Fakes link as in Slice 04 (`FakeNoteRepo` resolves kinds and subjects, and feeds
  their `noteCount`).
