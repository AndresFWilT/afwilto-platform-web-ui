# Spec — Category management UI (`afwilto-certifications-web-ui`)

**Status:** Draft (proposed 2026-09-28)
**App (bounded context):** `frontend/apps/afwilto-certifications-web-ui`
**Also touches:** `backend/afwilto-certifications-mngr` — see its own spec,
`docs/specs/category-management.md` in that repo, for the API/DB contract this
UI consumes. **This spec assumes that backend spec is implemented first** (or
in lockstep): the port/adapter changes below depend on the new
`POST/PATCH/DELETE /categories` endpoints and the changed `GET /categories`
and certification-create/update behavior.
**Supersedes:** `frontend/docs/specs/11-certifications-journey.md` §10.3 (port
contract, `listCategories`-only) and §12.4 (hash-derived timeline color).

## Problem & goal

Today, `CertificationForm.tsx`'s category field is a free-text `<input
list="category-suggestions">` (HTML `datalist` autocomplete) — typing a brand
new value and saving silently creates that category server-side. There is no
color: `TimelinePage`/`TimelineCanvas` derive a display color by hashing the
category `id` through a fixed 8-color palette
(`src/domain/timeline/categoryColor.ts`).

**Goal:** the category field becomes a real `<Select>` populated from the
categories the backend already knows about, with a "+ Add new category" entry
that navigates to a dedicated form. That form (and a lightweight list view)
gives full CRUD over categories, each with a required, user-chosen hex color
that is then used everywhere a category renders — replacing the hashed
palette.

## Non-goals

- No inline "create category" modal inside the certification form — it's a
  full navigation to a separate route (matches what was asked: "redirect the
  person to a new form").
- No drag-and-drop reordering, no category hierarchy browser/tree UI beyond
  the existing flat "path" text (`TI / Cloud / AWS`) already supported by
  `CategoryPath`.
- No optimistic UI / undo for delete. A delete is a confirm-then-await-then-
  refresh flow, consistent with how certification delete already works
  (check `CertificationDetailPage.tsx`'s existing delete confirmation pattern
  and reuse it).
- No changes to `packages/design-system` (shared DS). The hex color input is
  app-local (see "Color input" below) since it has exactly one consumer today
  — promoting it to the shared DS is a follow-up if a second app needs it.

## Port contract changes (`src/application/ports/ICertificationJourneyService.ts`)

1. Rename `CategoryInUse` → `Category` (the type now represents *every*
   category, not only ones in use — the old name would be misleading). Add
   `color`:

   ```ts
   export interface Category {
     id: string
     path: string
     normalizedPath: string
     color: string // '#RRGGBB', uppercase
     count: number  // live (non-deleted) certifications referencing it; 0 is valid
   }
   ```

   Every reference to `CategoryInUse` in the codebase (`CertificationForm`,
   `CertificationFormPage`, `CertificationEditPage`, and their tests) is
   renamed to `Category` as part of this change — a plain rename, not a
   behavior change, so it's safe to do as one mechanical pass before the new
   behavior lands.

2. New command types:

   ```ts
   export interface CreateCategoryCommand {
     path: string
     color: string
   }
   export interface UpdateCategoryCommand {
     path?: string
     color?: string
   }
   ```

3. New service methods:

   ```ts
   createCategory(cmd: CreateCategoryCommand): Promise<Category>
   updateCategory(id: string, patch: UpdateCategoryCommand): Promise<Category>
   deleteCategory(id: string): Promise<void>
   ```

   `listCategories(): Promise<Category[]>` keeps its name and signature; only
   its return shape changes (adds `color`, and now includes zero-count
   categories).

## Adapters

### `CertificationHttpAdapter.ts`

- `WireCategory` gains `color: string` (required, not optional — the backend
  always sends it post-migration).
- `mapCategory` maps `color` straight through (already-validated hex from the
  server; no client-side re-validation needed for display).
- `listCategories()`: unchanged call shape (`GET /categories`), new fields
  flow through `mapCategory`.
- `createCategory(cmd)`: `POST /categories` with `{ path: cmd.path, color:
  cmd.color }`, map the returned envelope through `mapCategory` (+ `count`,
  which is `0` for a fresh category).
- `updateCategory(id, patch)`: `PATCH /categories/${id}` with whichever of
  `{path, color}` is present in `patch` (mirror the existing
  `buildUpdatePatch.ts` "only include defined keys" convention already used
  for certification updates).
- `deleteCategory(id)`: `DELETE /categories/${id}`, no body, resolve on `204`.
- All three reuse the existing `translateError(e)` helper so a 422 from the
  backend (e.g. `"a category with this path already exists"`,
  `"category is used by 3 certification(s)"`) surfaces as a plain `Error`
  with that message, exactly like every other mutation in this adapter — the
  UI layer doesn't need new error-handling code.

### `InMemoryCertificationAdapter.ts`

Mirrors the backend's rules server-side tests don't otherwise catch here
(same principle already documented at the top of this file for certification
updates — "without this the fake is more permissive than the real adapter"):

- Seed categories with a `color` per fixture (pick from the current
  hash-derived palette values so existing fixture-driven tests/screenshots
  don't visually change).
- `createCategory`: reject a normalized-path collision with the same message
  wording the backend uses (`'a category with this path already exists'`);
  validate hex format (`/^#[0-9A-Fa-f]{6}$/`) with the same message
  (`'color must be a 6-digit hex value like #22D3EE'`).
- `updateCategory`: same path-collision check against a *different* id; same
  color validation.
- `deleteCategory`: reject with `` `category is used by ${n} certification(s)` ``
  when any non-deleted certification's `category.id` matches; otherwise
  remove it from the in-memory category list.
- `certificationJourneyService.create`/`update` (already in this adapter) must
  now resolve `categoryPath` against the in-memory category list and throw
  `'category does not exist — create it first'` when it doesn't match any
  existing normalized path — replacing today's `buildCategory(path)`
  auto-creation helper, which is deleted.

## UI changes

### `CertificationForm.tsx` — category field

Replace the free-text `<input list="category-suggestions">` block with:

- A `<Select>` (existing DS atom) whose options are `categories` (now typed
  `Category[]`), `value`/label = `path`, plus one trailing option (visually
  separated, e.g. a `<hr/>`-like DS convention or an "＋ Add new category"
  styled option) that, on selection, does **not** set the field — it instead
  calls a new `onRequestNewCategory` prop.
- `CertificationFormPage`/`CertificationEditPage` pass
  `onRequestNewCategory={() => navigate('/categories/new', { state: { returnTo: location.pathname } })}`
  — the `state.returnTo` lets the new-category page send the user back to
  where they started (create vs. edit) after saving, and the just-created
  category should come back **pre-selected** in the form (see route flow
  below), so the round trip doesn't lose the rest of the in-progress form —
  this is the one place where returning to a fresh, empty
  `CertificationFormPage` would be a real regression (the user was mid-way
  through filling out a certification).
- Validation (`errs.category`) is unchanged: still "Category is required",
  now checked against a selected value instead of trimmed free text.

**Preserving in-progress form state across the round trip:** the simplest
option consistent with this app's existing state management (no global store,
plain `useState` + router) is to have `CertificationFormPage` persist its
current `values` to `sessionStorage` (keyed by route, e.g.
`certifications:new-form-draft`) right before navigating to
`/categories/new`, and restore + clear it on mount if present. This is
call-out-worthy as the one piece of new client-side persistence in this
change; it's `sessionStorage`, per-tab, and only ever holds a draft that's
either resumed or abandoned (tab close) — never sensitive data.

### New route: `/categories/new` — `CategoryFormPage`

- New file `src/pages/Categories/CategoryFormPage.tsx`, added to
  `src/router/routes.tsx`'s `childRoutes` as `{ path: 'categories/new', element:
  withSuspense(CategoryFormPage) }` (and lazy-imported like every other page
  there).
- Fields: **Path** (text input, same placeholder convention as today's
  category field: `"e.g. Cloud / AWS"`) and **Color**.
- **Color input** (per the confirmed decision: free hex, not a fixed
  palette): a small local component, `src/pages/Categories/ColorField.tsx`,
  pairing a native `<input type="color">` (gives a real OS/browser color
  picker) with a text `<input>` showing/accepting the `#RRGGBB` value
  directly, two-way bound. Client-side validates
  `/^#[0-9A-Fa-f]{6}$/` before enabling submit, mirroring the backend's rule
  so a bad value never round-trips to a 422 toast.
- On submit: `createCategory({ path, color })`; on success, navigate back to
  `state.returnTo ?? '/certifications/new'` — restoring the draft (see above)
  with `categoryPath` set to the new category's path so it shows pre-selected.
- On cancel: navigate back to `returnTo` (or `..` if none), draft untouched.

### New route: `/categories` — `CategoryListPage`

Full CRUD needs a place to see, edit (recolor/rename), and delete existing
categories — the select-dropdown's "add new" entry only covers create.

- New file `src/pages/Categories/CategoryListPage.tsx`, route `{ path:
  'categories', element: withSuspense(CategoryListPage) }`.
- Reachable from `CertificationsLayout`'s nav (wherever "Timeline" is already
  a nav link — add "Categories" alongside it; check
  `src/layouts/CertificationsLayout.tsx` for the exact nav-link list to
  extend).
- Table (reuse the DS `Table` organism, same as `JourneyListPage`): columns
  **Color** (a small swatch, `background-color: category.color`), **Path**,
  **In use** (the `count` field — render as plain text; `0` is a valid,
  visible value, not hidden), **Actions** (Edit, Delete).
- Edit opens an inline form or a `Dialog` (DS molecule, already used
  elsewhere in this app) with the same Path + Color fields as create,
  pre-filled; submits via `updateCategory(id, patch)`.
- Delete: `Dialog`-based confirm (reuse the same confirm pattern
  `CertificationDetailPage.tsx` already uses for certification delete). On a
  422 `in_use` rejection, show the backend's message verbatim via the
  existing toast (`"category is used by 3 certification(s)"`) rather than a
  generic failure — the message is already precise, no need to re-derive the
  count client-side.

### Timeline — replacing hash-derived color

- `TimelinePage.tsx` and `TimelineCanvas.tsx` currently call
  `categoryColor(cert.category.id)`. Replace both call sites with
  `cert.category.color` (now present on every certification response, per
  the backend spec's `categoryDTO` change) — direct field read, no function
  call.
- Delete `src/domain/timeline/categoryColor.ts` and its export from
  `src/domain/timeline/index.ts` — it becomes dead code once both call sites
  are gone. Delete its test file too (check `test/timeline.domain.test.ts` for
  a `categoryColor` suite and remove just that suite, keeping any unrelated
  `assignLanes` tests in the same file intact).
- `TimelineCanvas.tsx`'s fallback `'#a78bfa'` for a certification with no
  category stays as-is (a certification always has a category post-Spec-11
  BR-CAT1, so this is dead-but-harmless defensive code — out of scope to
  remove here).

### `JourneyListPage.tsx`

- The existing category column (`row.category?.path ?? '—'`) gains a small
  color swatch next to the path text (matching the Timeline's visual
  language), reading `row.category?.color`.

## DI / container

No change needed in `src/di/container.ts` beyond the two adapters already
implementing the extended `ICertificationJourneyService` — the container
just wires whichever adapter, unchanged.

## Acceptance criteria

1. Opening the certification create form shows a `<Select>` for Category
   (not a free-text field) populated with every category from
   `listCategories()`, including ones with `count: 0`.
2. Selecting "+ Add new category" navigates to `/categories/new`; the
   in-progress form values (name, status, dates, etc. already typed) are
   unaffected when the user returns.
3. Submitting the new-category form with a valid path and a valid hex color
   creates the category, returns the user to the certification form, and the
   new category is pre-selected in the dropdown.
4. Submitting the new-category form with an invalid hex (e.g. `"blue"` or
   `"#ABC"`) is blocked client-side with an inline error, before any network
   call.
5. Submitting a path that collides with an existing category (case/spacing-
   insensitive, matching `CategoryPath` normalization) shows the backend's
   `"a category with this path already exists"` message via toast; the user
   stays on the form with their input intact.
6. `/categories` lists every category with a visible color swatch, its path,
   and its live-certification count (including `0`).
7. Editing a category's color from `/categories` updates the swatch on that
   page immediately and is reflected on the Timeline and Journey list for any
   certification in that category, without needing a full page reload
   (react-query/fetch-on-mount revalidation, or a manual refetch after the
   mutation resolves — either is acceptable, but stale data after a same-
   session edit is not).
8. Deleting an unused category (`count: 0`) removes it from `/categories`
   immediately.
9. Attempting to delete a category with `count > 0` shows the backend's
   `in_use` message and the category remains listed.
10. The Timeline and Journey list no longer call `categoryColor()` anywhere
    (verified by its deletion — a grep for `categoryColor` after the change
    returns no matches in `src/`).
11. Typing a brand-new, never-created category path directly into a
    certification create/update is no longer possible — because the field is
    a `<Select>`, there is no text box to type into. (Contrast with today's
    datalist, which allowed exactly this.)

## Testing plan (TDD)

- `test/CertificationHttpAdapter.test.ts`: extend with `createCategory`,
  `updateCategory`, `deleteCategory` cases (success + each error path from
  the backend spec's AC 2, 3, 8, 9, 11, 12), plus updated `mapCategory`
  assertions for the new `color` field.
- `test/InMemoryCertificationAdapter.behavioral.test.ts`: same coverage
  against the in-memory fake, plus a case proving `create`/`update` on a
  certification now rejects an unknown `categoryPath` (mirrors backend
  AC-13/15).
- New `test/CategoryForm.test.tsx` (or colocated with the page): renders the
  create form, asserts client-side hex validation (AC-4), asserts submit
  calls `createCategory` with the trimmed path and normalized (uppercase)
  color.
- New `test/CategoryListPage.test.tsx`: renders with a fixture category list,
  asserts the swatch color is applied as a style, asserts the delete-confirm
  dialog surfaces the `in_use` message from a rejected `deleteCategory` call
  without removing the row.
- Update `test/timeline.page.test.tsx` / `test/front-timeline.test.tsx` (check
  exact file holding Timeline color assertions) to assert
  `cert.category.color` renders directly, and delete any test asserting the
  old hash-based `categoryColor()` behavior.
- Update `test/App.test.tsx` and `src/router/routes.tsx`'s route list
  assertions (if any) for the two new routes.
- Run with the project's existing command: `pnpm vitest run` (`npm test` /
  `vitest run` per `package.json`).

## Open questions

None outstanding — color-input style (free hex) and scope (full CRUD) were
confirmed by the app owner before this document was written. One
implementation-level judgment call is flagged inline above (the
`sessionStorage` draft-persistence approach for the create-form round trip)
as the one new piece of client-side state this change introduces; flag it in
review if a different mechanism (e.g. lifting form state to the route via
`location.state`) is preferred.
