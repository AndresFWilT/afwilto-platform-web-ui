# Slice 02 — Category tree CRUD

> Status: Approved 2026-10-07 (module-spec approval covers the roadmap slices)
> Parent: `../16-studies.md` §11 Slice 02 (FR-0, FR-1, BR-DEL1/2, BR-CAT1..4)

## 1. Functional specification

Hierarchical categories, end to end in `afwilto-studies-mngr`:

- domain value objects and the hierarchy policy;
- use cases: create, get, list, update (rename / recolor / move), logical delete;
- the pgx repository, with a recursive CTE for `path` and `depth`;
- HTTP handlers for `GET/POST /api/v1/categories` and
  `GET/PATCH/DELETE /api/v1/categories/{id}`;
- migration `0002_create_categories`, including its no-delete trigger.

**Non-goals:**
- Subjects do not exist yet; the `subjects` table lands in Slice 04. Until then:
  - `subjectCount` is always `0`;
  - the "alive subjects" half of BR-DEL1 is not checked.

  Slice 04 completes both (parent AC-B6, AC-B7) and must add their tests.
- No restore endpoint (parent §1.3).
- No frontend changes.

## 2. Business rules (from the parent spec)

- **Category name:**
  - trimmed;
  - 1–60 characters (runes);
  - unique case-insensitively among alive siblings, where roots count as siblings of
    each other.
- **Color:** matches `^#[0-9A-Fa-f]{6}$` after trimming, stored uppercase.
- **Depth** is at most 5. On a move, `depth(newParent) + height(subtree) ≤ 5`.
- **No cycles:** a category cannot be placed under itself or a descendant.
- **References:** `parentId` must reference an alive category.
- **Delete:**
  - logical (`deleted_at`);
  - 409 `in_use` while alive child categories exist;
  - afterwards the category 404s and its name is free again among its siblings.
- **Ordering:**
  - lists are ordered by path **segment by segment**, case-insensitive, in byte order
    (`COLLATE "C"`);
  - a parent always comes before its children, and siblings are alphabetical;
  - ties break by `id`.
- **Malformed ids:** an id in the path that is not a UUID → 404 (never a 500).
- **Malformed `parentId`:** a `parentId` in the body that is not a UUID → 422, field
  `parentId`, rule `format`.

## 3. Acceptance criteria

Parent criteria covered: AC-B1, AC-B2, AC-B3, AC-B4, AC-B5, AC-B6 (child-category part),
AC-B7 (with `subjectCount = 0`), AC-B8 (the `parentId` part), and AC-B24 for the
`categories` table.

Slice-specific criteria:
- **S02-1** `PATCH` with an empty object `{}` → 422, field `body`, rule `required`.
- **S02-2** `PATCH {"parentId": null}` moves the category to the root. A `PATCH` that
  omits `parentId` keeps the current parent.
- **S02-3** A body over `MAX_BODY_BYTES` → 413 `payload_too_large`. This holds whether
  the size is declared in `Content-Length` or streamed, and even when a valid JSON
  value comes first. Invalid JSON, or trailing data after the JSON value → 422, field
  `body`, rule `json`. The same rules apply to POST and PATCH.
- **S02-4** Every response of every category endpoint conforms to `api/openapi.yaml`.
  This covers 200, 201, 204, 404, 409, 413 and 422.
- **S02-5** `PATCH` and `DELETE` on a deleted category → 404.
- **S02-6** Ids are case-insensitive. An id in upper or mixed case (in the path or in
  `parentId`) behaves exactly like its lowercase form, including the cycle check.
  Responses always return lowercase ids.
- **S02-7** A category name containing a control character (`unicode.IsControl`,
  including NUL) → 422, field `name`, rule `format`. User input never yields a 500.
- **S02-8** The tree's integrity is enforced by the database itself, not only by the
  use cases. A `BEFORE INSERT OR UPDATE OF parent_id, deleted_at` trigger on
  `categories`:
  - takes a transaction-scoped advisory lock, which serializes structural changes;
  - rejects a parent that is missing or deleted (→ 422 `parentId` `not_found`);
  - rejects a cycle (→ 422 `parentId` `cycle`);
  - rejects a depth over 5 (→ 422 `parentId` `max_depth`);
  - rejects a logical delete while alive subcategories exist (→ 409 `in_use`).

  The same checks run on a manual SQL restore (`deleted_at` set back to NULL).
  Recursive queries are bounded, so even a corrupted tree cannot make them loop.

## 4. OpenAPI contract delta

None. Every endpoint used here has been in the contract since v0.1.0.

## 5. Database changes

`0002_create_categories.{up,down}.sql` exactly as parent §6, plus the
`categories_no_delete` trigger.
`0003_guard_category_tree.{up,down}.sql`: the S02-8 tree-guard trigger. Later
migrations shift by one relative to the numbering shown in parent §6 (note kinds
become `0004`, and so on).

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| domain | `category_test.go`, `hierarchy_test.go` | name and color tables, cycle and depth tables |
| use case (fakes) | `usecase/category_test.go` | create, update and move, delete, not-found and conflict paths |
| postgres (testcontainers) | `postgres/category_repo_test.go` | CTE path and depth, ordering, sibling uniqueness including roots, AC-B5 (child row untouched), ancestors and height, trigger |
| HTTP (fakes) | `http/categories_api_test.go` | status codes, error bodies, S02-1..5, contract conformance |

## 7. Implementation notes

- Errors:
  - `domain.ConflictError{Field, Rule, Message}` → 409 `conflict`.
  - `domain.ValidationError` → 422.
  - `domain.ErrNotFound` → 404.
- Duplicate names are detected by the partial unique index (SQLSTATE `23505`); the
  repository maps the error to `ConflictError{name, duplicate_name}`. The fake
  repository mirrors that rule.
- `CategoryHierarchyPolicy` is a pure function: it takes the ancestor chain (root →
  new parent) and the moved subtree's height.
