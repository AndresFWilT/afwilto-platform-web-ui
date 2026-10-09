# Spec 16 — Studies (full-stack module: `afwilto-studies-web-ui` + `afwilto-studies-mngr`)

> Status: **Approved 2026-10-07** (owner chat — all open questions OQ-1..OQ-8 resolved, no
> further changes requested; implementation authorized slice by slice)
> Owner: afwilto · Created: 2026-10-07
> Revision 4 (2026-10-08): Slice 09 split into 09a / 09b. The order is unchanged
> (owner chat).
> Revision 3 (2026-10-07, Slice 01 review): added `GET /categories/{id}` and
> `GET /note-kinds/{id}` (FR-0 / AC-B6 require a by-id read that returns 404 after a
> delete) and the `method_not_allowed` (405) error code, so router fallbacks also use
> the JSON error envelope.
> Revision 2 (2026-10-07): owner answers to OQ-1..OQ-5 folded in. Categories are now
> hierarchical, note kinds became a managed resource, deletion is logical everywhere,
> and notes are sortable by date and by title (see §13).
> Depends on: `00-system-architecture.md`, `01-shared-packages.md`, `02-shell-host.md`,
> `10-docker-compose-platform.md`, `11-certifications-journey.md` (backend precedent),
> `backend/CLAUDE.md` (microservice manifesto)

---

## 0. Context — what this module builds on

| Inherited decision | Source | Consequence here |
|---|---|---|
| Shell host :3000 + Module Federation remotes, `exposes: { './App' }`, shared singletons `react`/`react-dom`/`react-router-dom` | Spec 00, 02 | New remote `studies` at **:3008**, owning `/studies/*` |
| Frontend hexagon: pages → `useServices()` → port → adapter; composition root `di/container.ts`; HTTP + InMemory adapters | Spec 00 §1.4, Spec 11 §10 | Same shape as `afwilto-certifications-web-ui` |
| `@afwilto/design-system` (dark theme, Tailwind v4 tokens, Table/Dialog/Toast/Tag/Select/Textarea/EmptyState…) | Spec 01, commit `617a85b` | UI is built from existing components. The Markdown renderer stays **in the app** because its dependencies are heavy and it has a single consumer. |
| Go service layout `cmd/` + `internal/<ctx>/{domain, app/port/{in,out}, app/usecase, adapter/{in,out}}`, stdlib `net/http`, pgx v5, golang-migrate, slog, `MIGRATE_ON_START` | `backend/CLAUDE.md` §11.4, Spec 11 §9 | `afwilto-studies-mngr` copies the certifications skeleton |
| Envelope `{ "data": … }`, `{ "data", "meta" }` on lists, `{ "error": { code, message, details? } }` | Spec 11 §8.1 | Same conventions |
| Categories are explicit CRUD resources with a persisted hex color | certifications `category-management.md` | Same, plus a parent/child hierarchy (FR-1) |
| Single `docker compose up -d`, network `afwilto`, internal-only DBs | Spec 10 | New services: `studies-db`, `studies-mngr`, `studies` |
| No auth, single user | Spec 00 §10 | Same |
| Ports in use: frontends 3000–3007; backends 8080–8083, 8085–8091 | `docker-compose.yml` (verified 2026-10-07) | **MFE :3008, API :8084** |

**Positioning vs. slab.** `slab` is the *practical* side: projects per subject, with
code-defined routes such as `/slab/ud/operative-systems/round-robin`. `studies` is the
*knowledge* side: summaries, cheat sheets and notes. Studies links **to** slab, and the
reverse direction stays code-defined in slab (FR-6).

---

## 1. Product Vision

### 1.1 Purpose

Studies is a personal knowledge base. Categories form a tree; each subject belongs to a
category and holds many notes written in Markdown. Notes support math formulas,
multi-language code snippets and Mermaid diagrams.

Example: **TI → Cloud → AWS** (categories) → **AWS Certified Cloud Practitioner**
(subject) → **Storage, Compute, Networking, Security** (notes).

### 1.2 MVP scope

1. Hierarchical categories (tree, CRUD, name + color).
2. Note kinds as a managed resource (CRUD), seeded with Summary / Cheat sheet / Notes.
3. Subjects (CRUD) that belong to any category node, each with an optional
   description.
4. Notes (CRUD), each with a title, kind, Markdown content, tags and slab links.
   Notes are sortable by title, creation date and last-update date.
5. Markdown rendering: GFM, KaTeX math, Shiki syntax highlighting, Mermaid diagrams.
6. Tags shared across subjects, with a per-tag view of matching notes from every
   subject.
7. Links from notes to slab pages.
8. Logical deletion everywhere: a delete is an `UPDATE`, never a SQL `DELETE`
   (FR-0).

### 1.3 Non-goals (MVP)

- **No version history.** An edit overwrites the stored content (owner decision
  2026-10-07). History is planned for later (§12).
- **No draw.io.** Mermaid is the only diagram format. draw.io is planned (§12).
- **No full-text search.** Navigation is by the category tree or by tag. Search is
  planned (§12), and the schema must not block it.
- **No restore / trash UI.** Deleted rows stay in the database and can be recovered
  by SQL. A trash UI is planned (§12).
- No file or image uploads. Markdown may reference external `https:` images only.
- No slab → studies links driven by data. Slab keeps linking by code, as it does today.
- No dead-link validation of slab paths, because slab routes live in code and there
  is no catalog API.
- No slab links on subjects or categories; slab links belong to notes only.
- No autosave, no real-time collaboration, no auth, no multi-user.
- No WYSIWYG editor. The MVP has a source editor with a live preview.
- No changes to the slab MFEs or the slab backends.

---

## 2. Functional Requirements

### FR-0 Logical deletion (applies to every entity)

- Every `DELETE /api/v1/...` endpoint performs `UPDATE … SET deleted_at = now()`.
  No code path issues a SQL `DELETE`.
- A deleted row is invisible to the API:
  - `GET` by id → 404;
  - excluded from every list, count, tree and tag view;
  - its name or title is freed for reuse, because uniqueness applies to alive rows
    only.
- A row cannot be deleted while alive rows depend on it (BR-DEL1). The API never
  cascades a delete.
- A row cannot reference a deleted row. Creating or editing with a deleted parent,
  category, subject or kind returns 422.
- Ids are UUIDs and are case-insensitive on input. The API always returns them in
  lowercase.
- Text input: a single-line name or title rejects control characters (422, rule
  `format`). Multi-line content rejects NUL only, since Postgres `text` cannot store
  it.
- Guarantee: a `BEFORE DELETE` trigger on every table raises an error. This makes the
  rule hold even for hand-written SQL, not only by convention (AC-B24).

### FR-1 Categories (hierarchical)

- Fields:
  - `name`: 1–60 chars.
  - `color`: `#RRGGBB`, stored uppercase.
  - `parentId`: nullable; null means a root category.
- Read-only computed fields:
  - `path`: display form built from the names, for example `"TI / Cloud / AWS"`.
  - `depth`: 1 for a root.
- Maximum depth is **5**.
- Name uniqueness (case-insensitive, trimmed) is enforced among alive **siblings**.
  Root categories are siblings of each other.
- Edit can rename, recolor or **move** a category by changing `parentId`. Its whole
  subtree moves with it. A move is rejected if:
  - the new parent is the category itself or one of its descendants (`cycle`); or
  - the moved subtree would end up deeper than 5 levels (`max_depth`).
- Delete is logical (FR-0) and is allowed only when the category has no alive child
  categories and no alive subjects.
- List: `GET /categories` returns every alive category as a **flat** list with
  `parentId`, `path`, `depth` and `subjectCount` (alive subjects directly in that
  category). The frontend builds the tree.

### FR-2 Subjects

- Fields:
  - `categoryId`: required; must reference an alive category at any depth.
  - `name`: 1–120 chars; unique case-insensitive among alive subjects of the same
    category.
  - `description`: optional plain text, ≤ 2000 chars.
- Operations:
  - Create.
  - Edit, including moving the subject to another category.
  - List, filterable by `categoryId` (direct members only). Each item carries its
    alive-note count.
  - Get.
  - Logical delete, allowed only when the subject has no alive notes.

### FR-3 Notes

- Fields:
  - `subjectId`.
  - `title`: 1–200 chars; unique case-insensitive among alive notes of the same
    subject.
  - `kindId`: required; must reference an alive kind (FR-7).
  - `content`: Markdown, 0–200,000 chars.
  - `tags` (FR-5).
  - `slabLinks` (FR-6).
  - `version`, `createdAt`, `updatedAt`.
- Operations:
  - Create.
  - Get, including `content`.
  - Edit, including moving the note to another subject through `subjectId`.
  - Logical delete.
- The per-subject list returns **summaries without `content`**.
- **Sorting** (owner decision OQ-1):
  - `sort` ∈ `title | createdAt | updatedAt`; `order` ∈ `asc | desc`.
  - Default is `title asc`.
  - Ties break by `title asc`, then `id asc`, so the order is always deterministic.
  - The frontend exposes the sort as a selector and keeps it in the URL query.

### FR-4 Markdown rendering

| Feature | Authoring syntax | Renderer |
|---|---|---|
| GFM | tables, `- [ ]`, strikethrough, autolinks | `remark-gfm` |
| Inline / block math | `$…$`, `$$…$$` | `remark-math` + `rehype-katex` |
| Code | fenced with a language, e.g. ` ```go ` | Shiki, lazy-loaded |
| Diagrams | fenced ` ```mermaid ` | `mermaid`, lazy-loaded, `securityLevel: 'strict'` |
| Internal links | `[Round Robin](/slab/ud/operative-systems/round-robin)` | router `<Link>` (no full page reload) |

- **Supported Shiki languages (bundled set):** `go, typescript, tsx, javascript, jsx,
  python, java, csharp, c, cpp, rust, php, sql, bash, shell, powershell, yaml, json,
  toml, dockerfile, hcl, html, css, markdown, diff, plaintext`. An unknown or missing
  language renders as plain monospace text, without an error.
- **Invalid Mermaid:** the block renders an inline error box with the error message
  and the original source. The rest of the note still renders.
- **Invalid KaTeX:** the formula renders as raw source in the error color
  (`throwOnError: false`). The rest of the note still renders.
- Every code block has a "copy" button.

### FR-5 Tags

- **Format:** lowercase kebab-case, matching `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–40 chars.
- **Normalization before validation:** trim, lowercase, and replace internal
  whitespace with `-`. For example, `" Cloud Security "` becomes `cloud-security`.
- A note has 0–10 distinct tags. Duplicates left after normalization are collapsed.
- Tags are created **implicitly** the first time they are attached. They are not a
  managed resource because they carry no data beyond their name.
- Removing a tag from a note is logical: the `note_tags` row gets `deleted_at`.
  Re-adding the tag revives that row.
- `GET /tags` returns only the tags with at least one alive link to an alive note,
  together with their counts.
- The tag view lists every alive note carrying the tag, across all subjects. Each item
  shows its subject and the category path.

### FR-6 Slab links (studies → slab, notes only)

- A note has 0–10 `slabLinks`, each shaped `{ label, path }`:
  - `label`: 1–80 chars.
  - `path`: must match `^/slab(/[a-z0-9-]+)+$`.
- Example (owner, OQ-3): a note titled "B-Tree" in the Data Structures subject links
  to the lab where the tree was implemented: `{ "label": "B-Tree lab", "path":
  "/slab/ud/<subject>/<project>" }`.
- The note view renders these links as router links in a "Related in slab" section.
- Inline Markdown links whose `href` starts with a single `/` navigate client-side.
  This applies to any internal route, not only slab. External links open in a new
  tab with `rel="noopener noreferrer"`.

### FR-7 Note kinds (owner decision OQ-2)

- Fields: `name`, 1–40 chars, unique case-insensitive among alive kinds.
- Operations: create, rename, list (alive kinds with `noteCount`), logical delete.
- Logical delete is allowed only when no alive note uses the kind.
- The migration seeds three kinds with fixed UUIDs: **Summary**, **Cheat sheet**,
  **Notes**. They behave like any other kind afterwards: they can be renamed or
  deleted when unused.
- The note editor's kind picker shows alive kinds only. A new note preselects the
  first kind in alphabetical order.

---

## 3. Business Rules

| ID | Rule | Error |
|---|---|---|
| BR-DEL1 | Delete is blocked while alive dependents exist: a category with alive child categories or alive subjects, a subject with alive notes, or a kind used by alive notes | 409 `conflict`, rule `in_use` |
| BR-DEL2 | References must point to alive rows (`parentId`, `categoryId`, `subjectId`, `kindId`) | 422 `validation_failed`, rule `not_found` on that field |
| BR-CAT1 | Category name is unique among alive siblings (case-insensitive, trimmed) | 409 `conflict`, rule `duplicate_name` |
| BR-CAT2 | Category color matches `^#[0-9A-Fa-f]{6}$` and is stored uppercase | 422 `validation_failed` |
| BR-CAT3 | Depth ≤ 5. On a move, `depth(newParent) + height(subtree) ≤ 5` | 422 `validation_failed`, field `parentId`, rule `max_depth` |
| BR-CAT4 | A category cannot become its own ancestor | 422 `validation_failed`, field `parentId`, rule `cycle` |
| BR-KIND1 | Kind name is unique among alive kinds | 409 `conflict`, rule `duplicate_name` |
| BR-SUB1 | Subject name is unique among alive subjects of its category | 409 `conflict`, rule `duplicate_name` |
| BR-NOTE1 | Note title is unique among alive notes of its subject | 409 `conflict`, rule `duplicate_name` |
| BR-NOTE2 | `content` is at most 200,000 characters | 422 `validation_failed` |
| BR-NOTE3 | An edit must send the `version` it read; a mismatch is rejected. This prevents silent overwrites from a stale tab, since there is no history. | 409 `conflict`, rule `stale_version` |
| BR-NOTE4 | Every successful edit increments `version` by 1 and sets `updatedAt` | — |
| BR-TAG1 | Tags follow the FR-5 normalization and format; at most 10 per note | 422 `validation_failed`, field `tags[i]` |
| BR-LINK1 | Slab links follow the FR-6 format; at most 10 per note | 422 `validation_failed`, field `slabLinks[i].path` |

---

## 4. Acceptance Criteria

Backend criteria are prefixed B, frontend criteria F. Each criterion maps to at least
one test (§10).

**Categories**
- **AC-B1** `POST /categories {"name":"TI","color":"#ff9900"}` returns 201 with
  `color: "#FF9900"`, `parentId: null`, `path: "TI"`, `depth: 1`, and a `Location`
  header.
- **AC-B2** Creating `Cloud` under `TI` and then `AWS` under `Cloud` gives `AWS` the
  path `"TI / Cloud / AWS"` and depth 3.
  - A second `Cloud` under a different parent → 201.
  - `"cloud"` under `TI` → 409 `duplicate_name`.
  - A root `"ti"` → 409 `duplicate_name`.
- **AC-B3** Depth limit:
  - Creating a child of a depth-5 category → 422, field `parentId`, rule `max_depth`.
  - Moving a subtree of height 2 under a depth-4 category → 422 `max_depth`.
- **AC-B4** Cycles: moving `TI` under `AWS` (its descendant), or under itself → 422,
  field `parentId`, rule `cycle`.
- **AC-B5** Renaming `Cloud` to `Cloud Computing` changes `AWS`'s path to
  `"TI / Cloud Computing / AWS"` without any write to the `AWS` row.
- **AC-B6** `DELETE /categories/{id}`:
  - with an alive child or an alive subject → 409 `in_use`;
  - when empty → 204. Afterwards the row still exists with `deleted_at` set,
    `GET` → 404, the category is absent from `GET /categories`, and its name can be
    reused among its siblings.
- **AC-B7** `GET /categories` returns alive categories only, ordered by `path`
  ascending (case-insensitive). Each item carries `subjectCount`, which counts alive
  direct subjects.
- **AC-B8** `parentId` or `categoryId` pointing to an unknown or deleted category →
  422, rule `not_found`.

**Note kinds**
- **AC-B9** A fresh database lists exactly `Cheat sheet`, `Notes`, `Summary` (alphabetical).
  - Creating `Lab report` → 201.
  - Creating `lab report` → 409 `duplicate_name`.
  - Renaming → 200.
- **AC-B10** Deleting a kind:
  - used by an alive note → 409 `in_use`;
  - unused → 204, logical (the row remains with `deleted_at`).
  - Using a deleted kind's id in a note create → 422, field `kindId`, rule
    `not_found`.

**Subjects**
- **AC-B11** Two subjects named `"Networking"` in different categories → both 201.
  The same name in the same category → 409 `duplicate_name`.
- **AC-B12** A subject can attach to a non-leaf category, e.g. `TI` while `TI` has
  children → 201.
- **AC-B13** `DELETE /subjects/{id}` with one alive note → 409 `in_use`. After that
  note is deleted → 204 (logical).
- **AC-B14** `GET /subjects?categoryId=X` returns only alive direct members of `X`,
  each with `noteCount` counting alive notes only.

**Notes**
- **AC-B15** `POST /subjects/{id}/notes` with title `"Storage"` and content containing
  `$$E=mc^2$$`, a ` ```go ` block and a ` ```mermaid ` block → 201. `GET /notes/{id}`
  then returns:
  - `content` byte-for-byte identical;
  - `version: 1`;
  - `kind: {id, name}`.
- **AC-B16** List items have no `content` field. Sorting example — given
  - `Compute` (created d1, updated d3),
  - `Networking` (created d3, updated d1),
  - `Storage` (created d2, updated d2):

  | Query | Order |
  |---|---|
  | none (default) | Compute, Networking, Storage |
  | `sort=title&order=desc` | Storage, Networking, Compute |
  | `sort=updatedAt&order=desc` | Compute, Storage, Networking |
  | `sort=createdAt&order=desc` | Networking, Storage, Compute |
  | `sort=createdAt&order=asc` | Compute, Storage, Networking |
  | `sort=size` | 422 |

- **AC-B17** Stale version:
  1. `PATCH /notes/{id}` with `version: 1` → 200, `version: 2`.
  2. A second PATCH that still sends `version: 1` → 409 `stale_version`, and the
     stored content is unchanged.
- **AC-B18** Content of exactly 200,000 characters → 201. Content of 200,001
  characters → 422.
- **AC-B19** `DELETE /notes/{id}` → 204. The row remains with `deleted_at` set. The
  note then:
  - 404s on `GET`;
  - disappears from subject lists, tag views and counts;
  - frees its title for reuse in that subject.
- **AC-B20** Tag normalization and validation:
  - `[" Cloud Security ", "cloud-security", "IAM"]` is stored as
    `["cloud-security", "iam"]`.
  - `"bad_tag!"` → 422, field `tags[0]`.
  - 11 tags → 422.
- **AC-B21** Removing and re-adding a tag:
  1. A PATCH that drops `iam` from a note sets `deleted_at` on that `note_tags` row
     (the row stays), and the note no longer appears in `GET /notes?tag=iam`.
  2. A PATCH that re-adds `iam` revives the same row by setting `deleted_at` back to
     null.
- **AC-B22** `GET /tags` counts only alive links of alive notes. `GET /notes?tag=iam`
  returns alive notes from every subject; each item carries its `subject {id, name}`
  and `category {id, name, color, path}`.
- **AC-B23** Slab link paths:
  - `/slab/ud/operative-systems` → accepted.
  - `/finance`, `https://x.com/slab/a`, `/slab/` → 422, field `slabLinks[i].path`.

**Platform & enforcement**
- **AC-B24** Hard deletes are blocked at two levels:
  - Integration test: `DELETE FROM <table>` against each of `categories`,
    `note_kinds`, `subjects`, `notes`, `tags`, `note_tags` raises an error.
  - Static test: no `DELETE` statement appears in `internal/studies/adapter/out/postgres`.
- **AC-B25** `docker compose up -d` brings up `studies-db` (healthy) and then
  `studies-mngr`.
  - `curl :8084/healthz` → 200.
  - `/readyz` → 200 when the DB answers, 503 otherwise.
  - `scripts/smoke.sh` probes `:8084/healthz`.
- **AC-B26** The domain-purity test fails if any file under `internal/studies/domain`
  imports `net/http`, `pgx` or `database/sql`.

**Frontend**
- **AC-F1** The shell route `/studies/*` mounts the `studies` remote. The root
  homepage shows a live "Studies" product card linking to `/studies`.
- **AC-F2** The pure `buildCategoryTree(flat)` turns the flat list into a nested tree:
  - children are sorted by name, case-insensitive;
  - an empty list gives an empty tree;
  - order of the input does not change the output.
- **AC-F3** The `/studies` library:
  - renders the category tree with expand/collapse;
  - shows each category's color chip and its subjects;
  - shows an empty state when there are no categories.
- **AC-F4** The subject page shows the description and the notes list (title, kind
  badge, tags, updated date).
  - A sort selector offers: A–Z, Z–A, Recently updated, Recently created, Oldest
    first. The choice is kept in the URL query and survives a reload.
  - Clicking a tag chip navigates to `/studies/tags/:tag`.
- **AC-F5** The note view renders:
  - a KaTeX element for `$$E=mc^2$$`;
  - a Shiki-highlighted `go` block with a copy button;
  - an SVG for a valid ` ```mermaid ` block;
  - an inline error box for an invalid Mermaid block, while the rest of the note
    still renders.
- **AC-F6** XSS: rendering `<script>alert(1)</script>`, `<img src=x
  onerror=alert(1)>` and `[x](javascript:alert(1))` produces no `<script>` element,
  no `on*` attribute and no `javascript:` href in the DOM.
- **AC-F7** The editor shows the source (CodeMirror, Markdown mode) next to a live
  preview at widths ≥ 1024px, and as tabs below that. `Ctrl/Cmd+S` saves.
- **AC-F8** Navigating away with unsaved changes asks for confirmation through the
  design-system `Dialog`, never a native `confirm()`.
- **AC-F9** A save that returns 409 `stale_version`:
  - shows a toast;
  - keeps the user's text in the editor;
  - offers "Reload latest" (discards local edits, after a confirmation) and "Copy my
    text".
- **AC-F10** "Related in slab" renders each link as a router link. Clicking one
  changes the URL to the slab path without a full page reload.
- **AC-F11** Delete dialogs for a category, a subject or a kind show the 409 `in_use`
  explanation ("Move or delete its subcategories and subjects first", "…its notes
  first", "…notes using this kind first").
- **AC-F12** `/studies/kinds` lists, creates, renames and deletes kinds. The note
  editor's kind picker offers alive kinds only.
- **AC-F13** The parent picker in the category form shows paths (`TI / Cloud`). When
  editing, it excludes the category itself and its descendants.
- **AC-F14** Shiki and Mermaid load in separate lazy chunks. The library and subject
  pages do not import them.

---

## 5. Domain Model (`internal/studies/domain`)

```
Category (aggregate)       NoteKind (aggregate)   Subject (aggregate)      Note (aggregate)
  id, parentId?,             id, name,              id, categoryId,          id, subjectId, kindId,
  name, color: HexColor,     deletedAt?             name, description?,      title, content: MarkdownContent,
  deletedAt?                                        deletedAt?               tags: TagSet, slabLinks: []SlabLink,
                                                                             version, timestamps, deletedAt?
```

- Every aggregate exposes `Delete(now)`, which sets `deletedAt`. There is no remove
  operation anywhere in the domain.
- **Value objects** validate in their constructors: `CategoryName`, `HexColor`, `Tag`,
  `TagSet`, `SlabLink`, `MarkdownContent`, `SortSpec`. Each has a `Rehydrate*`
  counterpart for persisted data.
- **`CategoryHierarchyPolicy`** is a pure domain service. Given the ancestor chain of
  the new parent and the height of the moved subtree, it returns `cycle`, `max_depth`
  or ok. It is the main TDD target for BR-CAT3 and BR-CAT4.
- **Cross-aggregate rules** (BR-DEL1, BR-DEL2) are checked in use cases through
  repository ports.
- **Out-ports:** `CategoryRepository` (including `AncestorIDs`, `SubtreeHeight`),
  `NoteKindRepository`, `SubjectRepository`, `NoteRepository` (`Update` takes
  `expectedVersion` and returns `ErrStaleVersion`), `TagQuery`, `Clock`,
  `IDGenerator` (UUID v7).

---

## 6. Database (PostgreSQL 17)

```sql
-- 0001_forbid_hard_delete
CREATE FUNCTION forbid_hard_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'hard delete is forbidden on %; set deleted_at instead', TG_TABLE_NAME
        USING ERRCODE = 'restrict_violation';
END $$;

-- 0002_create_categories
CREATE TABLE categories (
    id         uuid PRIMARY KEY,
    parent_id  uuid REFERENCES categories(id),
    name       text NOT NULL,
    color      char(7) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT cat_name_len  CHECK (char_length(name) BETWEEN 1 AND 60),
    CONSTRAINT cat_color_fmt CHECK (color ~ '^#[0-9A-F]{6}$'),
    CONSTRAINT cat_not_self  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE UNIQUE INDEX categories_sibling_name_alive_ux
    ON categories (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
    WHERE deleted_at IS NULL;
CREATE INDEX categories_parent_alive_ix ON categories (parent_id) WHERE deleted_at IS NULL;
CREATE TRIGGER categories_no_delete BEFORE DELETE ON categories
    FOR EACH ROW EXECUTE FUNCTION forbid_hard_delete();

-- 0003_create_note_kinds (+ seed: Summary, Cheat sheet, Notes with fixed UUIDs)
CREATE TABLE note_kinds (
    id         uuid PRIMARY KEY,
    name       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT kind_name_len CHECK (char_length(name) BETWEEN 1 AND 40)
);
CREATE UNIQUE INDEX note_kinds_name_alive_ux ON note_kinds (lower(name)) WHERE deleted_at IS NULL;
-- + no-delete trigger

-- 0004_create_subjects
CREATE TABLE subjects (
    id          uuid PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES categories(id),
    name        text NOT NULL,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz,
    CONSTRAINT sub_name_len CHECK (char_length(name) BETWEEN 1 AND 120),
    CONSTRAINT sub_desc_len CHECK (description IS NULL OR char_length(description) <= 2000)
);
CREATE UNIQUE INDEX subjects_cat_name_alive_ux
    ON subjects (category_id, lower(name)) WHERE deleted_at IS NULL;
-- + no-delete trigger

-- 0005_create_notes
CREATE TABLE notes (
    id          uuid PRIMARY KEY,
    subject_id  uuid NOT NULL REFERENCES subjects(id),
    kind_id     uuid NOT NULL REFERENCES note_kinds(id),
    title       text NOT NULL,
    content     text NOT NULL DEFAULT '',
    slab_links  jsonb NOT NULL DEFAULT '[]',
    version     integer NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz,
    CONSTRAINT note_title_len   CHECK (char_length(title) BETWEEN 1 AND 200),
    CONSTRAINT note_content_len CHECK (char_length(content) <= 200000),
    CONSTRAINT note_links_array CHECK (jsonb_typeof(slab_links) = 'array')
);
CREATE UNIQUE INDEX notes_subject_title_alive_ux
    ON notes (subject_id, lower(title)) WHERE deleted_at IS NULL;
CREATE INDEX notes_subject_alive_ix ON notes (subject_id) WHERE deleted_at IS NULL;
CREATE INDEX notes_kind_alive_ix    ON notes (kind_id)    WHERE deleted_at IS NULL;
-- + no-delete trigger

-- 0006_create_tags
CREATE TABLE tags (
    id   uuid PRIMARY KEY,
    name text NOT NULL UNIQUE,
    CONSTRAINT tag_fmt CHECK (name ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(name) <= 40)
);
CREATE TABLE note_tags (
    note_id    uuid NOT NULL REFERENCES notes(id),
    tag_id     uuid NOT NULL REFERENCES tags(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    PRIMARY KEY (note_id, tag_id)
);
CREATE INDEX note_tags_tag_alive_ix ON note_tags (tag_id) WHERE deleted_at IS NULL;
-- + no-delete triggers on both
```

| Decision | Choice | Why / alternative rejected |
|---|---|---|
| Logical delete | `deleted_at timestamptz` + partial unique indexes `WHERE deleted_at IS NULL` | The owner described a "showable" flag. A timestamp gives the same behavior (showable ⇔ `deleted_at IS NULL`) and also records *when* the row was deleted, which a boolean loses. Same convention as certifications. |
| Delete guarantee | `BEFORE DELETE` trigger on every table, plus a static test on the adapter | Enforced by code, not by convention: the rule holds even for a hand-written `psql` session. `TRUNCATE` (a statement-level operation, not row-level) is deliberately **not** blocked, so integration tests and admin resets keep working. Migration downs use `DROP`, which is unaffected. |
| Category tree | adjacency list (`parent_id`) + recursive CTE for `path`/`depth` | A rename is one row update (AC-B5). A materialized path string, as in certifications, was rejected because renaming or moving a node would rewrite every descendant. `ltree` was rejected as an extension dependency for a tree with at most 5 levels. |
| Sibling uniqueness for roots | `COALESCE(parent_id, nil-uuid)` in the unique index | `NULL`s are distinct in unique indexes, so without the coalesce two roots named `TI` would both be allowed. |
| Cycle / depth checks | in the domain policy, not in the DB | It is pure and testable. Single-user write concurrency makes a DB-level guard unnecessary. |
| Note kinds | table + seeded rows | The owner wants kinds under CRUD (OQ-2). A `CHECK` enum cannot be edited at runtime. |
| Content storage | Markdown in `text` | Markdown is portable, diffable, exportable and ready for search. JSONB blocks were rejected because they couple the data to one editor's schema. |
| Slab links | `jsonb` on `notes` | A value-object list owned by the note and never queried on its own. |
| Tags | `tags` + `note_tags` with `deleted_at` | Cross-subject views and counts become indexed joins. Unlinking a tag is logical, as FR-0 requires. |
| Concurrency | `version` integer, `UPDATE … WHERE id=$1 AND version=$2 AND deleted_at IS NULL` | A cheap guard against silent overwrites, since there is no history. |
| Future search | none now | Adding a generated `tsvector` (`english`) column and a GIN index is a single migration. |

---

## 7. REST API (Contract-First, `backend/afwilto-studies-mngr/api/openapi.yaml`)

**Conventions** are the same as Spec 11 §8.1.

**Error codes** form a closed set:

| Code | Status | `details[0].rule` values |
|---|---|---|
| `validation_failed` | 422 | includes `not_found`, `max_depth`, `cycle` |
| `not_found` | 404 | — (also unknown routes) |
| `method_not_allowed` | 405 | — (known route, wrong method; `Allow` header set) |
| `conflict` | 409 | `duplicate_name`, `in_use`, `stale_version` |
| `payload_too_large` | 413 | — (request body > 1 MiB) |
| `internal` | 500 | — |

| Method & path | Purpose | Success |
|---|---|---|
| `GET /healthz`, `GET /readyz` | liveness / readiness | 200 / 503 |
| `GET /api/v1/categories` | flat alive list with `parentId`, `path`, `depth`, `subjectCount` | 200 |
| `POST /api/v1/categories` | create | 201 |
| `GET /api/v1/categories/{id}` | one alive category (404 when deleted, FR-0) | 200 |
| `PATCH /api/v1/categories/{id}` | rename / recolor / move | 200 |
| `DELETE /api/v1/categories/{id}` | logical delete (BR-DEL1) | 204 |
| `GET /api/v1/note-kinds` | alive kinds + `noteCount` | 200 |
| `POST /api/v1/note-kinds` | create | 201 |
| `GET /api/v1/note-kinds/{id}` | one alive kind (404 when deleted, FR-0) | 200 |
| `PATCH /api/v1/note-kinds/{id}` | rename | 200 |
| `DELETE /api/v1/note-kinds/{id}` | logical delete (BR-DEL1) | 204 |
| `GET /api/v1/subjects?categoryId=` | list + `noteCount` | 200 |
| `POST /api/v1/subjects` | create | 201 |
| `GET /api/v1/subjects/{id}` | detail (with `category {id, name, color, path}`) | 200 |
| `PATCH /api/v1/subjects/{id}` | edit / move | 200 |
| `DELETE /api/v1/subjects/{id}` | logical delete (BR-DEL1) | 204 |
| `GET /api/v1/subjects/{id}/notes?sort=&order=&tag=` | note summaries | 200 |
| `POST /api/v1/subjects/{id}/notes` | create note | 201 |
| `GET /api/v1/notes?tag=&sort=&order=` | cross-subject notes by tag (`tag` required in MVP) | 200 |
| `GET /api/v1/notes/{id}` | full note | 200 |
| `PATCH /api/v1/notes/{id}` | edit; `version` **required** | 200 |
| `DELETE /api/v1/notes/{id}` | logical delete | 204 |
| `GET /api/v1/tags` | in-use tags + counts | 200 |

```yaml
Category:     { id, parentId: uuid|null, name, color, path, depth, subjectCount }
NoteKind:     { id, name, noteCount }
NoteSummary:  { id, subjectId, title, kind: {id, name}, tags: string[], createdAt, updatedAt, version,
                subject?: {id, name}, category?: {id, name, color, path} }   # subject/category only on /notes?tag=
Note:         NoteSummary + { content: string, slabLinks: SlabLink[] }
SlabLink:     { label: string, path: string }
CreateCategoryRequest: { name, color, parentId? }
UpdateCategoryRequest: { name?, color?, parentId? }        # absent ≠ null: parentId:null moves to root
CreateNoteRequest:     { title, kindId, content?, tags?, slabLinks? }
UpdateNoteRequest:     { version (required), title?, kindId?, content?, tags?, slabLinks?, subjectId? }
```

Lists are not paginated in the MVP, because the data is personal-scale: tens of
categories and subjects, hundreds of notes. `meta.totalItems` is still returned, so
pagination can be added later without breaking clients.

---

## 8. Backend — `backend/afwilto-studies-mngr` (Go, :8084)

The service mirrors Spec 11 §9.1, with the bounded context `internal/studies/`.

**Environment:**
- `PORT=8084`
- `DATABASE_URL`
- `ALLOW_ORIGINS=http://localhost:3000,http://localhost:3008`
- `MIGRATE_ON_START=true`
- `MAX_BODY_BYTES=1048576`

There is no `STORAGE_DIR`, because the MVP has no uploads. The Dockerfile is the same
as certifications: multi-stage to distroless/static, with the healthcheck binary.

---

## 9. Frontend — `frontend/apps/afwilto-studies-web-ui` (:3008, remote `studies`)

### 9.1 Routes (relative to `/studies`)

| Path | Page |
|---|---|
| `` | Library: category tree → subjects |
| `categories` | Manage categories (tree, create/edit/move/delete) |
| `kinds` | Manage note kinds |
| `subjects/:subjectId` | Subject: description + sortable notes list |
| `subjects/:subjectId/notes/new` | Note editor (create) |
| `notes/:noteId` | Note view (rendered) |
| `notes/:noteId/edit` | Note editor (edit) |
| `tags/:tag` | Notes with this tag, across subjects |

Routes use UUIDs. Readable slugs are planned for later (§12).

### 9.2 Structure

```
src/
├── application/ports/IStudiesService.ts     # domain-language port (no HTTP types)
├── domain/categoryTree.ts                   # buildCategoryTree, descendantsOf (pure, AC-F2/F13)
├── infrastructure/adapters/http/StudiesHttpAdapter.ts   # @afwilto/http-client, VITE_API_URL
├── infrastructure/adapters/memory/InMemoryStudiesAdapter.ts
├── di/container.ts
├── features/markdown/
│   ├── MarkdownView.tsx      # react-markdown + remark-gfm/math + rehype-sanitize + rehype-katex
│   ├── CodeBlock.tsx         # lazy Shiki, copy button, fallback monospace
│   ├── MermaidBlock.tsx      # lazy mermaid, strict, error box
│   └── sanitizeSchema.ts     # allowlist (pure, unit-tested)
├── features/editor/NoteEditor.tsx            # CodeMirror 6 (markdown) + MarkdownView preview
└── pages/…, router/…, App.tsx (owns providers)
```

### 9.3 Rendering pipeline & security (MANDATORY)

**Pipeline order:** `remark-parse → remark-gfm → remark-math → remark-rehype →
rehype-sanitize (custom schema) → rehype-katex`.

**Rules:**
- Code and Mermaid fences are intercepted by the `code` component **after**
  sanitization. Their output therefore comes from trusted libraries working on
  text-only input.
- Raw HTML in Markdown is **not** enabled: no `rehype-raw`.
- Mermaid runs with `securityLevel: 'strict'`.
- KaTeX runs with `trust: false`.
- Allowed URL protocols: `http`, `https`, `mailto`, and relative paths.
- Images: `https` only.

AC-F6 is the test that guards these rules.

### 9.4 New dependencies (this remote only)

- Markdown: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex`
  (CSS), `rehype-sanitize`.
- Highlighting and diagrams: `shiki`, `mermaid`. Both are dynamically imported
  (AC-F14).
- Editor: `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`, plus
  `@codemirror/language-data` for fenced code.

---

## 10. Testing Strategy (TDD)

**Backend unit (domain)**
- Every value-object constructor:
  - tag normalization table;
  - slab-path accept/reject table;
  - hex color;
  - content limit at the boundary (200,000 / 200,001).
- `CategoryHierarchyPolicy` table: self, direct child, deep descendant, sibling,
  depth exactly 5, depth 6.
- `SortSpec` parsing.
- `Note.Update` version increment.
- `Delete(now)` sets `deletedAt` on every aggregate.

**Backend use cases (with fakes)**
- BR-DEL1 for each entity, BR-DEL2, BR-CAT1, BR-SUB1, BR-NOTE1, BR-NOTE3.

**Backend adapters**
- pgx repositories against a real Postgres (testcontainers or the compose DB, as in
  certifications). Reset between tests with `TRUNCATE … CASCADE`, which is allowed.
  Covers:
  - partial unique indexes, including root-sibling uniqueness;
  - the recursive `path` CTE;
  - the stale-version `UPDATE`;
  - `note_tags` revival;
  - the delete triggers (AC-B24).
- HTTP handlers via `httptest`, asserting status codes and the error body shape for
  every AC-B*.
- A static test that scans the postgres adapter source for `DELETE` (AC-B24).

**Frontend unit**
- `buildCategoryTree` / `descendantsOf` (AC-F2, F13).
- `sanitizeSchema` with the XSS cases (AC-F6).
- Mirrors of tag normalization and slab-link validation.
- HTTP adapter mapping from error code and rule to a domain error.

**Frontend components (Vitest + RTL, InMemory adapter)**
- AC-F3..F5 and AC-F7..F13.
- Mermaid and Shiki are mocked at the module boundary in jsdom. One real render is
  covered by a Playwright smoke test if one is available; otherwise a manual check is
  recorded in the slice.

Exact commands are recorded per repo once scaffolded (`go test ./...`,
`pnpm --filter afwilto-studies-web-ui test`).

---

## 11. Roadmap — vertical slices (`docs/specs/16-studies/slice-NN-*.md`)

| # | Slice | Covers |
|---|---|---|
| 01 | Contract & skeleton: service, health, compose (`studies-db`, `studies-mngr`), OpenAPI v0.1.0, `forbid_hard_delete()` migration, smoke | AC-B25, B26 |
| 02 | Category tree CRUD (policy, recursive path, logical delete, triggers) | AC-B1..B8, AC-B24 (categories) |
| 03 | Note kinds CRUD + seed | AC-B9, B10 |
| 04 | Subjects CRUD | AC-B11..B14 |
| 05 | Notes CRUD + version guard + sorting | AC-B15..B19 |
| 06 | Tags + slab links | AC-B20..B23, AC-B24 (all tables) |
| 07 | MFE skeleton + shell/homepage integration + read path (tree, subject list with sort, plain Markdown view) | AC-F1..F4 |
| 08 | Rich rendering: KaTeX, Shiki, Mermaid, sanitization, internal links | AC-F5, F6, F10, F14 |
| 09a | Write path I: category/kind/subject forms and delete dialogs | AC-F11, F12 (kinds page), F13 |
| 09b | Write path II: note editor, unsaved guard, conflict UX, kind picker | AC-F7..F9, F12 (editor picker) |

Each slice must end green and pass review by an independent instance before the next
one starts.

---

## 12. Future Features (not in MVP)

1. Version history (`note_revisions`, diff, restore). Owner priority.
2. draw.io diagrams: embedded editor, stored as `.drawio.svg` through a `FileStorage`
   port that reuses the certifications `fsstore` adapter. Owner priority.
3. Full-text search: generated `tsvector` column with the `english` config and a GIN
   index. Owner: a plus.
4. Trash UI: list and restore logically deleted items.
5. Image uploads (screenshots) through `FileStorage`.
6. Export a subject or the whole base as `.md` files / zip, compatible with Obsidian.
7. Readable slug URLs, note-to-note links and backlinks, manual note ordering.
8. Autosave with debounce.

---

## 13. Decisions log

| # | Question | Decision (2026-10-07) |
|---|---|---|
| OQ-1 | Note order inside a subject | Sortable by title, creation date and last-update date, ascending or descending. Default is title A–Z (FR-3). |
| OQ-2 | Note `kind` | A managed resource with CRUD and logical delete, seeded with Summary / Cheat sheet / Notes (FR-7). |
| OQ-3 | Where slab links live | On notes only. Example: a "B-Tree" note links to its slab lab (FR-6). |
| OQ-4 | Category shape | Hierarchical: adjacency list, max depth 5, subjects allowed on any level (FR-1). |
| OQ-5 | Delete semantics | Always logical, for every entity including tag links. Hard deletes are blocked by DB triggers (FR-0). |
| OQ-6 | Maximum category depth | 5 levels (owner confirmed) |
| OQ-7 | May subjects attach to non-leaf categories? | Yes (owner confirmed) |
| OQ-8 | When deleting a parent with alive children, block or cascade the logical delete? | Block with `in_use` (owner confirmed). Cascading would hide whole subtrees with one click, and there is no restore UI. |
