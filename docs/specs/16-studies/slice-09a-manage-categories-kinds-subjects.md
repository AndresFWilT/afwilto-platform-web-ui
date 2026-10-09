# Slice 09a — Write path I: categories, note kinds, subjects, delete dialogs

> Status: **Approved 2026-10-08** (owner chat; the 09a/09b split was also approved)
> Parent: `../16-studies.md` §11 Slice 09, split into **09a** (this slice) and **09b**
> (the note editor). The order is unchanged.
> Covers: AC-F11, AC-F12 (the `/studies/kinds` page), AC-F13; FR-0, FR-1, FR-2, FR-7
> and BR-DEL1/2, BR-CAT1..4, BR-KIND1, BR-SUB1 as UI behavior.
> Backend: none. Slices 02–04 already serve every endpoint used here.

## 1. Functional specification

The owner can build the knowledge base from the UI:

- **`/studies/categories`:** manage the category tree. It shows the same tree as the
  library, plus actions to create a root or a child, edit (rename, recolor, move
  through the parent picker) and delete.
- **`/studies/kinds`:** list the alive note kinds with their `noteCount`, create,
  rename and delete them.
- **Subjects:**
  - created from the library, with a "New subject" button and a dialog that offers
    a category picker;
  - edited from the subject page (name, description, category move);
  - deleted from the subject page.
- **Delete dialogs** for categories, subjects and kinds use the design-system
  `Dialog`. On a 409 `in_use` they explain what blocks the delete (AC-F11).
- **Navigation:** the studies navbar gains "Categories" and "Kinds".
- The library's empty state gains a "Create a category" action linking to
  `/studies/categories`.

**Non-goals (09b or later):**
- No note create, edit or delete, no editor, no unsaved-changes guard, no
  stale-version UX. Those are Slice 09b, AC-F7..F9.
- No drag-and-drop moves. Moves happen only through the parent picker.
- No restore or trash UI (parent §1.3).
- No backend change.
- No optimistic updates. Every successful write refetches the affected list.

## 2. Business rules

### 2.1 Port and errors

- **New port methods** (`IStudiesService`, domain language):
  - `createCategory({ name, color, parentId })`;
  - `updateCategory(id, patch)`. `patch` is `{ name?, color?, parentId? }`. In
    `parentId`, **absent** means unchanged and `null` means move to the root.
  - `deleteCategory(id)`;
  - `listKinds(): NoteKind[]`, `createKind(name)`, `renameKind(id, name)`,
    `deleteKind(id)`;
  - `createSubject({ categoryId, name, description })`;
  - `updateSubject(id, patch)`. `patch` is `{ categoryId?, name?, description? }`,
    and `description: null` clears it.
  - `deleteSubject(id)`.

  Create and update return the stored entity; delete returns nothing.
- **Typed domain errors**, so pages never see HTTP:
  - **`StudiesValidationError`** `{ violations: [{ field, rule, message }] }`, from a
    422.
  - **`StudiesConflictError`** `{ field, rule: 'duplicate_name' | 'in_use' |
    'stale_version', message }`, from a 409.
  - **`StudiesNotFoundError`**, from a 404 on a write: the target was deleted
    meanwhile.
  - **Anything else** → a plain `Error` with the API message (as in Slice 07).

  The in-memory adapter throws the same classes, with the backend's field, rule and
  message, for every rule listed in §2.3. The shared behavioral suite proves this.
- **Backend parity of the in-memory adapter** (amended after review). It mirrors
  studies-mngr's handler and use-case order:
  - `parentId` / `categoryId` must be a UUID, checked first. Otherwise:
    `format`, "… must be a UUID".
  - Checks stop at the first failure, so a 422 carries one violation, with the name
    checked before color or description.
  - An empty PATCH is a 422 on `body` (`required`), raised before the id is looked
    up. This mirrors OpenAPI `minProperties: 1`.
  - `in_use` messages carry the use case's counts, e.g. "category has 2 subcategories;
    move or delete them first". Children are checked before subjects.
  - Names are trimmed like Go `strings.TrimSpace`, which strips U+0085 and keeps
    U+FEFF.
  - Ids are case-insensitive on writes.

  The client mirrors (§2.2) use the same `trimSpace`.

### 2.2 Client-side validation (mirrors, before any request)

| Field | Rule (as the backend) | Message shown |
|---|---|---|
| category `name` | trimmed, 1–60 chars, no control characters | "Name is required" / "At most 60 characters" / "Name cannot contain control characters" |
| category `color` | `^#[0-9A-Fa-f]{6}$`, sent uppercase | "Use a hex color like #22D3EE" |
| kind `name` | trimmed, 1–40 chars, no control characters | same pattern, with 40 |
| subject `name` | trimmed, 1–120 chars, no control characters | same pattern, with 120 |
| subject `description` | ≤ 2000 chars; blank means `null` | "At most 2000 characters" |

- **Server-side rules:** `duplicate_name`, `not_found`, `max_depth` and `cycle` are
  only known by the server. The page maps them onto fields:
  - `name` ← `duplicate_name` (409), for example "A sibling category with this name
    already exists";
  - `parentId` ← `max_depth`, `cycle`, `not_found`;
  - `categoryId` ← `not_found`.

  The message is the API's own.
- **Behavior on error:**
  - A field error keeps the dialog open with the user's input intact. The message is
    tied to its control through `aria-describedby`, and tests assert that link.
  - A 404 on an edit or rename means the target was deleted meanwhile. The dialog
    shows "It was already deleted.", Save is disabled, and the page refetches.
    (Amended after review.)
  - A conflict or validation error without a known field shows an `Alert` inside the
    dialog.
  - A network failure shows a toast and keeps the dialog open.

### 2.3 Categories page (AC-F13)

- **Tree:** the tree from `buildCategoryTree` (Slice 07), every node expanded. Each
  node shows its color chip, name and `subjectCount`, plus "Add child", "Edit" and
  "Delete" buttons whose `aria-label` names the category.
- **Hidden "Add child":** for a depth-5 node, because the server would answer
  `max_depth`.
- **"New root category"** opens the same form with no parent.
- **Form dialog:** name, color, and **parent picker**.
- **Color field** (amended 2026-10-09 at the owner's request; the first version had no
  real picker). As in the certifications `ColorField`, copied and not shared, it
  pairs:
  - a native color picker (`<input type="color">`, labelled "Pick color"). Choosing a
    color writes it to the text field in uppercase.
  - the `#RRGGBB` text field ("Color"). A valid value typed there moves the picker; an
    invalid one leaves the picker on `#000000` and shows the validation message on
    Save.

  A new category starts with `#22D3EE`, so it can be saved without touching the
  color. Editing starts from the stored color.
- **Parent picker:** a `Select` whose options are "— Root —" plus every category,
  labelled by `path` and ordered by path.
  - When editing, it **excludes the category itself and all its descendants** (pure
    `descendantsOf(tree, id)`, which returns a `Set` of ids including `id`).
  - It also excludes any parent at a depth where the moved subtree would exceed
    depth 5. The rule is `depth(parent) + height(subtree) ≤ 5`, computed by the pure
    `subtreeHeight(tree, id)`.
  - The server stays authoritative: `max_depth` and `cycle` from the API are still
    mapped onto `parentId`.
- **Edit sends a minimal patch:** only the fields that changed. An unchanged form
  sends nothing and just closes. `parentId: null` is sent only when moving to the
  root.
- **After a successful create, edit or delete,** the tree refetches and a success
  toast shows "Category created" / "updated" / "deleted".

### 2.4 Kinds page (AC-F12, first half)

- **List:** alive kinds, alphabetical as the API returns them, each with its
  `noteCount`.
- **Create:** an inline form with a name field and an "Add kind" button. The field
  clears on success.
- **Rename:** a per-row "Rename" opens a dialog prefilled with the current name.
  Saving with the same name trimmed closes the dialog without a request.
- **Delete:** a per-row "Delete" opens a confirmation dialog.

### 2.5 Subjects

- **"New subject" on the library** opens a dialog with:
  - a category picker (by path, required). The first option is the placeholder
    "Choose a category"; an empty choice shows "Pick a category";
  - name;
  - description (`Textarea`).

  On success it navigates to the new subject's page.
- **The subject page** gains "Edit" and "Delete" buttons. Edit opens the same dialog
  prefilled and sends a minimal patch. Changing the category is a move. After an
  edit the page refetches.
- **Deleting a subject** navigates to `/studies` with a toast "Subject deleted".

### 2.6 Delete dialogs (AC-F11)

- **The confirmation text names the item**, e.g. "Delete category “Cloud”?". Delete
  is logical, but there is no restore UI, so the text says "This cannot be undone
  from the app."
- **On 204:** the dialog closes and the success flow runs.
- **On 409 `in_use`,** the dialog stays open, the delete button is disabled, and the
  dialog shows an `Alert` with the parent spec's text:

  | Entity | Text |
  |---|---|
  | Category | "Move or delete its subcategories and subjects first." |
  | Subject | "Move or delete its notes first." |
  | Kind | "Change or delete the notes using this kind first." |

- **On 404:** "It was already deleted." The list refetches.
  - **Subject page:** a refetch there would unmount the dialog, so the message stays
    and closing the dialog navigates to `/studies`. (Amended after review.)
- **Never** `window.confirm` / `alert` / `prompt`. A test enforces this with a spy.

### 2.7 Kind picker data (AC-F12, second half, groundwork)

`listKinds()` is the only source of kinds. Slice 09b's editor uses it to offer alive
kinds only, preselecting the first in alphabetical order (FR-7). No editor ships here.

## 3. Acceptance criteria

Parent criteria covered: **AC-F11, AC-F13**, and the `/studies/kinds` half of
**AC-F12**.

- **S09a-1** Behavioral suite, run against both adapters, for every new port method:
  - happy paths;
  - each server rule raises the typed error with its field and rule:
    `duplicate_name`, `in_use`, `not_found` (parent, category), `max_depth`, `cycle`;
  - `parentId: null` moves a category to the root, while an absent `parentId` leaves
    it in place;
  - `description: null` clears it;
  - deletes are logical: the item disappears from lists and its name can be reused.
- **S09a-2** HTTP adapter:
  - method, path and body for each call, with the patch keeping
    `parentId: null`/`description: null` and omitting absent keys;
  - 422 → `StudiesValidationError` with every violation;
  - 409 → `StudiesConflictError`, one per rule;
  - 404 on a write → `StudiesNotFoundError`;
  - 204 → resolves `undefined`.
- **S09a-3** Pure helpers:
  - `descendantsOf` returns self plus all descendants, and only self for a leaf;
  - `subtreeHeight` is 1 for a leaf and 3 for `TI` in `TI > Cloud > AWS`;
  - `validateName(value, max)` and `validateColor` follow the §2.2 table.
- **S09a-4** (AC-F13) The parent picker:
  - on create, lists "— Root —" plus every path;
  - on editing `Cloud`, excludes `Cloud` and `AWS`, and keeps `TI`, `Math`, root;
  - in a 5-deep chain, excludes depths that would overflow, and still offers the
    current parent.
- **S09a-5** Category create:
  - valid input → a request with `color` uppercased, the tree refetches, and a
    toast shows;
  - a client-side invalid name or color → field messages and no request;
  - a server `duplicate_name` → the message under Name, with the dialog and the input
    kept.
- **S09a-6** Category edit sends a minimal patch:
  - rename only → `{ name }`;
  - move to root → `{ parentId: null }`;
  - unchanged → no request.
  - A server `cycle` / `max_depth` shows under Parent.
- **S09a-7** (AC-F11) Delete category:
  - success → it leaves the tree;
  - `in_use` → the subcategories text, the button disabled, the dialog open;
  - 404 → "already deleted" and a refetch.

  The same three cases apply to subject and kind, each with its own text.
  `window.confirm` is never called.
- **S09a-8** (AC-F12) The kinds page:
  - lists names with counts;
  - creates (the field clears), renames (a same-name save sends no request) and
    deletes;
  - a `duplicate_name` message shows on create and on rename.
- **S09a-9** Subjects:
  - creating from the library navigates to the new page;
  - editing name and description updates the header;
  - moving the category updates the path shown;
  - a blank description is sent as `null`;
  - deleting navigates to `/studies` with a toast.
- **S09a-10** Routes and nav:
  - `categories` and `kinds` are child routes, before `*`;
  - the navbar shows Home · Studies · Categories · Kinds;
  - the library's empty state links to `/studies/categories`.
- **S09a-11** Every earlier test stays green, including the S07/S08 route-table
  test, which is updated for the two new routes. Typecheck is clean, and `build` and
  `build:check` pass, so AC-F14 is unaffected.
- **S09a-12** **Manual (§8):** in the shell, against the real API:
  1. Build `TI > Cloud > AWS`.
  2. Try to delete `TI` → in-use message.
  3. Move `AWS` to the root.
  4. Rename a kind.
  5. Create, edit and delete a subject.

  The demo data stays as it is.

## 4. Contract delta — none

## 5. Database changes — none

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| pure | `test/categoryTree.test.ts` (extended), `test/validation.test.ts` | S09a-3 |
| adapters | `test/StudiesWrites.behavioral.test.ts` (new; the read suite is unchanged) | S09a-1 |
| adapters | `test/StudiesHttpAdapter.test.ts` (extended) | S09a-2 |
| pages | `test/CategoriesPage.test.tsx` | S09a-4..7 |
| pages | `test/KindsPage.test.tsx` | S09a-7 (kind), S09a-8 |
| pages | `test/SubjectWrite.test.tsx` | S09a-7 (subject), S09a-9 |
| app | `test/App.test.tsx`, `test/LibraryPage.test.tsx` (updated) | S09a-10 |

`test/support/contractApi.ts` gains the write routes, so the HTTP leg of the shared
behavioral suite runs against contract-shaped 201/200/204/409/422/404 responses.

## 7. Implementation notes

- **Files:**
  - `application/errors.ts`, for the typed errors;
  - `domain/categoryTree.ts`, gaining `descendantsOf` and `subtreeHeight`;
  - `domain/validation.ts`;
  - `pages/Categories/{CategoriesPage,CategoryFormDialog,ColorField}.tsx`;
  - `pages/Kinds/KindsPage.tsx`;
  - `pages/Subject/SubjectFormDialog.tsx`;
  - `pages/shared/{DeleteDialog,useMutation}.tsx`.
- **No new dependencies.** Forms use component state, as certifications does. No
  form library is added.
- **The in-memory adapter becomes writable,** with UUID v7-like ids from
  `crypto.randomUUID()` and timestamps from an injectable clock for deterministic
  tests. It keeps deleted rows with a `deletedAt` and filters them, mirroring FR-0.
  The offline dev seed is unchanged.

### Slice 09b preview (spec to follow after 09a)

The note editor on `subjects/:id/notes/new` and `notes/:id/edit` covers:
- CodeMirror 6 with a live `MarkdownView` preview;
- the tags and slab-links editors;
- the kind picker;
- `Ctrl/Cmd+S`;
- note delete;
- the unsaved-changes guard (AC-F8);
- the stale-version flow (AC-F9).

There is one decision to bring to the owner then. The shell uses a declarative
`BrowserRouter`, so react-router's `useBlocker` is unavailable. The guard can
intercept in-app link clicks and `beforeunload`, but not the browser's back button,
unless the shell moves to a data router. That would be a shell change outside this
module.

## 8. Verification record

**2026-10-09**

- **Red phase.** 115 tests failed before any implementation.
- **Green.** 418 studies tests pass. The rest of the workspace is unchanged and green,
  typecheck is clean, and `build:check` passes (AC-F14 is unaffected).
- **Author mutations.** 25 mutations, all killed.
- **Independent review.** A fresh instance found no high-severity bug.
  - **Fixed, with tests that were red first:**
    - **A1:** the subject "already deleted" dialog was unmounted by a refetch.
    - **A2:** an edit of a deleted target only toasted.
    - **A3:** Save was disabled when the category list failed to load.
    - **B4–B8:** in-memory parity with the backend (§2.1): `in_use` messages with
      counts, an empty PATCH → 422 `body`, one violation at a time, UUID format
      first, Go-style trimming.
    - **C9–C15:** criteria with no test or only a vacuous one, namely field
      association, kind and subject 404 refetch, name reuse after delete, the depth-5
      boundary on a move, the create-mode depth filter, deleted notes left out of
      counts, case-insensitive write ids, the network toast, and the failed-delete
      message.
  - **Limit noted.** The HTTP leg of the shared suite runs on top of the in-memory
    store. It proves the transport round trip, not the parity, which is why parity is
    pinned to the backend's literal messages and order.
- **Mutation re-check.** 45 mutations: the author's 25, the reviewer's 14 survivors,
  and 6 parity probes. All are killed.
- **Deployment note.** A tab opened before a redeploy fails lazy routes with "Failed to
  fetch dynamically imported module", because the old chunk hashes are gone; a reload
  fixes it. The owner declined a dedicated handler (2026-10-09): it is expected cache
  behavior, and no change was made.
- **Color picker amendment (2026-10-09).** Five tests were red first. The suite is
  green at 423, and 3 mutations are killed: the picker not writing uppercase, the
  picker ignoring a typed hex, and no default color.
- **S09a-12 manual check:** _pending, owner._
