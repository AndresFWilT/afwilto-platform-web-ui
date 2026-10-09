# Slice 06 — Tags + slab links

> Status: Approved 2026-10-08 (module-spec approval covers the roadmap slices)
> Parent: `../16-studies.md` §11 Slice 06 (FR-0, FR-5, FR-6, BR-TAG1, BR-LINK1)

## 1. Functional specification

Tags and slab links on notes, end to end in `afwilto-studies-mngr`:

- domain value objects `TagSet` (with the normalization function) and `SlabLink`;
- notes now carry `tags` and `slabLinks` on create, edit and read;
- `GET /api/v1/tags`, `GET /api/v1/notes?tag=` and the `?tag=` filter of
  `GET /api/v1/subjects/{id}/notes`;
- migration `0007_create_tags` (`tags`, `note_tags`, both with the no-delete trigger);
- removal of the temporary Slice 05 rejection (`not_implemented`) of `tags`,
  `slabLinks` and `?tag=`.

**Non-goals:**
- Tags are not a managed resource: no create, rename or delete endpoint. They appear
  when first attached.
- No dead-link validation of slab paths (parent §1.3): only the format is checked.
- No frontend changes.

## 2. Business rules

- **Tag normalization (FR-5):** trim, lowercase, then every run of whitespace becomes
  one `-`. The result must match `^[a-z0-9]+(-[a-z0-9]+)*$` and be 1–40 characters.
  - `" Cloud Security "` → `cloud-security`; `"IAM"` → `iam`.
  - `"bad_tag!"`, `"-a"`, `"a--b"`, `""`, `"   "` and 41 characters are invalid.
- **Tag set:** duplicates left after normalization collapse; at most 10 distinct tags
  (BR-TAG1). Violations:
  - an invalid tag → 422, field `tags[i]` (`i` = index in the request list), rule
    `required` (empty after trim) or `format`, or `max_length`;
  - more than 10 distinct → 422, field `tags`, rule `max_items`.
- **Tag order:** a note's `tags` are always returned sorted by name (byte order). A
  set has no insertion order.
- **Slab links (FR-6, BR-LINK1):** 0–10 per note, each `{label, path}`:
  - `label`: trimmed, 1–80 characters, no control characters;
  - `path`: matches `^/slab(/[a-z0-9-]+)+$`;
  - violations → 422, field `slabLinks[i].label` or `slabLinks[i].path`, rule
    `required` / `max_length` / `format`; more than 10 → field `slabLinks`, rule
    `max_items`. Order is preserved; duplicates are allowed.
- **Create:** `tags` and `slabLinks` are optional (absent or `null` = none).
- **Edit:** `tags` / `slabLinks`, when present, replace the whole set / list; absent
  means unchanged; `null` → 422, rule `required`. Sending only `tags` or `slabLinks`
  counts as an edit (version + 1).
- **Unlinking (FR-5, AC-B21):** removing a tag from a note stamps `deleted_at` on its
  `note_tags` row; re-adding it clears `deleted_at` on the same row. No row is ever
  removed.
- **`GET /tags`:** tags with at least one alive link to an alive note, each with
  `count` = number of such notes; ordered by name (byte order). Deleted notes and
  unlinked tags do not count.
- **`GET /notes?tag=T`:** `tag` is required (missing or blank → 422, field `tag`, rule
  `required`) and normalized like a tag (invalid → 422, field `tag`, rule `format`).
  Returns alive notes carrying `T` from every subject, as summaries (no content), each
  with `subject {id, name}` and `category {id, name, color, path}`. `sort` / `order`
  work as in Slice 05. An unknown tag yields an empty list.
- **`GET /subjects/{id}/notes?tag=T`:** same normalization and errors, restricted to
  that subject; its items do not carry `subject` / `category`.

## 3. Acceptance criteria

Parent criteria covered: AC-B19 (tag views and counts), AC-B20, AC-B21, AC-B22,
AC-B23, AC-B24 for `tags` and `note_tags` (all tables now).

Slice-specific criteria:
- **S06-1** AC-B20: `[" Cloud Security ", "cloud-security", "IAM"]` is stored and
  returned as `["cloud-security", "iam"]`; `"bad_tag!"` at index 0 → 422 `tags[0]`
  `format`; eleven distinct tags → 422 `tags` `max_items`; eleven entries that
  normalize to ten distinct tags → 201.
- **S06-2** AC-B21: a `PATCH` dropping `iam` stamps `deleted_at` on that `note_tags`
  row (the row stays) and the note leaves `GET /notes?tag=iam`; a `PATCH` re-adding it
  revives the same row (same `created_at`, `deleted_at` null again).
- **S06-3** AC-B22: `GET /tags` counts alive links of alive notes only (a deleted note
  and an unlinked tag are excluded; a tag with no alive notes is absent).
  `GET /notes?tag=iam` returns notes from several subjects with `subject` and
  `category`.
- **S06-4** AC-B23: `/slab/ud/operative-systems` accepted; `/finance`,
  `https://x.com/slab/a`, `/slab/`, `/slab` and `/slab/UPPER` → 422
  `slabLinks[i].path` `format`; empty label → 422 `slabLinks[i].label` `required`;
  eleven links → 422 `slabLinks` `max_items`.
- **S06-5** A tags-only or slabLinks-only `PATCH` bumps the version and leaves the
  other fields untouched; `tags: null` → 422 `tags` `required`.
- **S06-6** The `?tag=` query: raw `" IAM "` finds notes tagged `iam`; blank → 422
  `required`; `bad_tag!` → 422 `format`; unknown tag → `200` empty list.
- **S06-7** Concurrent attaches of the same new tag by two notes both succeed and share
  one `tags` row (name is unique).
- **S06-8** `DELETE FROM tags` and `DELETE FROM note_tags` are rejected with SQLSTATE
  `23001`; the static guard stays green.
- **S06-9** Slab links are stored as a JSON array on the note and round-trip in order;
  list summaries never include `slabLinks`.
- **S06-10** Every response conforms to `api/openapi.yaml` (200, 201, 422), including
  the optional `subject` / `category` of tag-view items.

## 4. OpenAPI contract delta

None.

## 5. Database changes

`0007_create_tags.{up,down}.sql`: `tags` and `note_tags` exactly as parent §6, with a
`BEFORE DELETE` trigger on each. Tag ids are generated by the database
(`gen_random_uuid()`); they are never exposed.

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| domain | `tag_test.go`, `slab_link_test.go` | normalization table, set rules, link table |
| use case (fakes) | `usecase/notes_test.go` | create / replace / clear / revive, tag views, counts |
| postgres (testcontainers) | `postgres/note_repo_test.go`, `postgres/tag_repo_test.go` | row revival, counts, concurrency, triggers, JSONB round-trip |
| HTTP (fakes) | `http/notes_api_test.go`, `http/tags_api_test.go` | S06-1..10, contract conformance |

## 7. Implementation notes

- `Note` carries `Tags` and `SlabLinks`; `NoteRepository.Get` loads both so an edit
  that does not touch them keeps them. `Create` and `Update` write the note and its
  tag links in one transaction.
- Tag attach: `INSERT … ON CONFLICT (name) DO UPDATE` for the tag, then
  `INSERT … ON CONFLICT (note_id, tag_id) DO UPDATE SET deleted_at = NULL` for the
  link; links outside the new set are stamped `deleted_at`.
- Summaries load tags with an `array_agg` subquery, so lists stay one query.
- A new `TagQuery` out-port serves `GET /tags`.
