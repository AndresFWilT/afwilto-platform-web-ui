# Slice 07 — MFE skeleton + shell/homepage integration + read path

> Status: **Approved 2026-10-08** (owner chat; decisions D-1..D-3 accepted as written)
> Parent: `../16-studies.md` §11 Slice 07 (AC-F1..F4, §9.1, §9.2)
> Backend: none. Slices 01–06 already serve every endpoint this slice reads.

## 1. Functional specification

The new remote `afwilto-studies-web-ui` (`studies`, :3008) is mounted by the shell at
`/studies/*` and shows the knowledge base **read-only**:

- **Library** (`/studies`): the category tree, with each category's color chip and its
  subjects.
- **Subject** (`/studies/subjects/:subjectId`): the description and the sortable list of
  note summaries.
- **Note** (`/studies/notes/:noteId`): the title, kind, tags and dates, plus the
  content as **plain source text** (see D-1).
- **Tag view** (`/studies/tags/:tag`): notes carrying the tag across subjects. AC-F4
  needs a target for tag chips, and this page is read-only.

Integration:
- the shell gains the remote, its `/studies/*` route and the type declaration;
- the root homepage gains a live "Studies" card;
- the design-system `BaseLayout` default nav gains a "Studies" link;
- compose gains a `studies` service (:3008), and `scripts/smoke.sh` probes it.

**Non-goals (owned by later slices):**
- No Markdown rendering: no KaTeX, Shiki, Mermaid, sanitizer or internal-link handling
  (Slice 08, AC-F5/F6/F10/F14). No Markdown dependency is added in this slice.
- No "Related in slab" section (Slice 08, AC-F10).
- No writes at all: no forms, editor, delete dialogs, `/categories` or `/kinds` pages,
  and no `descendantsOf` (Slice 09). Those routes fall to the in-app "Not found".
- No backend, contract or database change.
- No persistence of the tree's expand/collapse state.
- No i18n. The UI is in English, like certifications.

## 2. Business rules

- **Hexagon (parent §9.2):** pages never call `fetch`. All I/O goes through
  `useServices().studiesService`, typed by the `IStudiesService` port. The port speaks
  domain language and no HTTP type crosses it.
- **Port (read-only, YAGNI):**
  - `listCategories(): Category[]`
  - `listSubjects(): Subject[]` (all alive subjects; the library groups them by
    `categoryId` on the client, so it needs one call)
  - `getSubject(id): Subject | null`
  - `listSubjectNotes(subjectId, sort): NoteSummary[]`
  - `getNote(id): Note | null`
  - `listNotesByTag(tag, sort): TaggedNoteSummary[]`

  `sort` is `{ field: 'title' | 'createdAt' | 'updatedAt', order: 'asc' | 'desc' }`.
  Field shapes mirror the OpenAPI schemas, without the envelope.
- **Errors (as certifications Slice 06):**
  - `getSubject` / `getNote` on a 404 → `null`. This is a valid empty result, and the
    page shows an `EmptyState` ("Subject not found" / "Note not found").
  - `listSubjectNotes` on a 404 → `null` as well, which the page treats the same way.
  - Every other non-2xx → `Error` with the API's message (`details[].message` joined
    by `; `, or `error.message`, or `Request failed (<status>)`). The page shows a
    design-system `Alert`. HTTP status codes never leak past the adapter.
  - A failure inside the remote never breaks the shell (`ErrorBoundary` in `App` and
    per route).
- **DI swap:** `VITE_API_URL` set → `StudiesHttpAdapter` over
  `FetchHttpClient(VITE_API_URL)`; unset → `InMemoryStudiesAdapter` with a small seed,
  for offline dev. The value includes the `/api/v1` prefix:
  `http://localhost:8084/api/v1`, matching the certifications convention.
- **Category tree (AC-F2):** `buildCategoryTree(flat)` is pure.
  - It nests by `parentId`.
  - At every level, children are sorted by name, case-insensitive (`localeCompare` with
    `sensitivity: 'base'`), with ties broken by `id`.
  - An empty input gives `[]`. Input order never changes the output.
  - A node whose `parentId` is not in the list is treated as a root, so it is never
    dropped. The API never sends one, but the function stays total.
- **Library (AC-F3):**
  - Every node starts expanded. Its toggle button (`aria-expanded`) hides or shows
    its children and subjects.
  - Each node shows a color chip (`style.backgroundColor = color`), its name and
    `subjectCount`.
  - Subjects are listed under their category, sorted by name case-insensitively. Each
    subject shows `noteCount` and links to `/studies/subjects/:id`.
  - No categories → `EmptyState` "No categories yet". There is no create button,
    because writes arrive in Slice 09.
- **Subject page (AC-F4):**
  - It shows the category path, the name and the description, or nothing when the
    description is `null`.
  - Each list row shows the title (linking to the note), a kind badge, tag chips (each
    linking to `/studies/tags/:tag`) and `updatedAt` as a date.
  - No notes → `EmptyState` "No notes yet".
- **Sort selector (AC-F4):** design-system `Select`, with options mapped to the URL
  query `?sort=&order=`:

  | Label | `sort` | `order` |
  |---|---|---|
  | A–Z (default) | `title` | `asc` |
  | Z–A | `title` | `desc` |
  | Recently updated | `updatedAt` | `desc` |
  | Recently created | `createdAt` | `desc` |
  | Oldest first | `createdAt` | `asc` |

  - The default writes no params, so `/studies/subjects/x` means A–Z.
  - A query pair that matches no option (`?sort=size`, or `?sort=title` without
    `order`) falls back to A–Z silently. The UI never surfaces the API's 422.
  - Changing the option updates the URL with `replace`, so it survives a reload.
- **Note page (D-1):**
  - A header with the title, kind badge, tag chips (linking to the tag view), the
    subject (a link back) and the created/updated dates.
  - The subject lookup is best-effort. If it fails, the note still renders without
    the back link, and no `Alert` is shown (added after review, finding L4).
  - The content is shown verbatim in a `<pre>` with `whitespace-pre-wrap`, as **text**,
    so nothing in it is interpreted. Slice 08 replaces this with `MarkdownView`.
- **Tag view:**
  - The `:tag` param is sent as-is, and the API normalizes it.
  - Each row shows the title (linking to the note), kind, subject name and category
    path with the category color chip. The same sort selector and URL rules apply.
  - An unknown tag gives an empty list → `EmptyState` "No notes tagged “<tag>”".
  - An invalid tag (API 422) shows the `Alert` with the API message.
- **Dates** are shown with `Intl.DateTimeFormat('en', { dateStyle: 'medium' })` in the
  viewer's timezone. Tests use noon-UTC timestamps, so the date is the same in every
  timezone.

## 3. Acceptance criteria

Parent criteria covered: **AC-F1, AC-F2, AC-F3, AC-F4.**

Slice-specific criteria:
- **S07-1** (AC-F1) The shell route `/studies` and `/studies/anything` mount the
  `studies` remote. `remotes.ts` exports `StudiesApp`. The shell `vite.config.ts`
  registers `studies` with `VITE_REMOTE_STUDIES_URL ??
  'http://localhost:3008/remoteEntry.js'`.
- **S07-2** (AC-F1) The root homepage renders exactly five product cards, including
  "Studies" (`status: 'live'`, `to: '/studies'`). The `BaseLayout` default nav contains
  "Studies" → `/studies`.
- **S07-3** (AC-F2) `buildCategoryTree`:
  - `[]` → `[]`;
  - `TI > Cloud > AWS` nests at depths 1/2/3;
  - children `b`, `A`, `c` come out as `A`, `b`, `c`;
  - every permutation of a 5-node input gives the same tree;
  - an orphan becomes a root.
- **S07-4** (AC-F3) With the in-memory adapter seeded `TI > Cloud > AWS`, plus a
  subject "AWS Certified Cloud Practitioner" under `AWS`, `/studies` renders:
  - every category name with its color chip;
  - the subject as a link to `/studies/subjects/<id>`.

  Collapsing `TI` hides `Cloud`, `AWS` and the subject. Expanding it shows them again.
- **S07-5** (AC-F3) An empty adapter → "No categories yet". A failing adapter → an
  `Alert` with its message, and the layout navbar still renders.
- **S07-6** (AC-F4) The subject page shows the description and one row per note, with
  title, kind badge, tags and updated date. Clicking a tag chip navigates to
  `/studies/tags/<tag>`.
- **S07-7** (AC-F4) Sort: given the parent AC-B16 fixture (Compute / Networking /
  Storage with the d1–d3 dates), each of the five options lists the notes in the
  parent's expected order and writes the table's `sort` / `order` to the URL.
  - Rendering at `?sort=updatedAt&order=desc` preselects "Recently updated", which
    proves the choice survives a reload.
  - `?sort=size` renders A–Z.
- **S07-8** The note page renders the header and the content verbatim. Content
  `<script>alert(1)</script>` appears as text, and no `script` element exists in the
  DOM. Unknown id → "Note not found".
- **S07-9** Unknown subject id → "Subject not found". An unknown in-app path, e.g.
  `/studies/kinds` in this slice, → "Not found" inside the studies layout.
- **S07-10** The tag view at `/studies/tags/iam` lists notes from two subjects, each
  with its subject name and category path. An unknown tag → empty state.
- **S07-11** **LSP:** one behavioral suite runs against **both** adapters. The HTTP
  adapter runs over a stubbed `IHttpClient` that replays contract-shaped responses.
  The suite covers:
  - list and get round trips;
  - `null` on 404 for `getSubject`, `getNote` and `listSubjectNotes`;
  - every sort option, using the AC-B16 fixture;
  - the tag view carries `subject` and `category`;
  - an unknown tag gives `[]`.
- **S07-12** HTTP adapter specifics:
  - query-string building (`sort` / `order` omitted for the default, and `tag`
    URL-encoded);
  - envelope unwrap;
  - the error-translation table: `details` joined, `message`, bare status.
- **S07-13** The build emits `dist/remoteEntry.js` for `studies`. These suites stay
  green:
  - `pnpm --filter afwilto-studies-web-ui test` and `typecheck`;
  - the shell, homepage and design-system tests.
- **S07-14** `docker compose up -d studies` serves `:3008/remoteEntry.js` with a
  revalidating `Cache-Control`. `scripts/smoke.sh` probes `:3008` in its remoteEntry
  and cache loops. In the browser, `localhost:3000/studies` renders the real data from
  `studies-mngr`. This check is manual and is recorded in §8 of this file.

## 4. Contract delta — none

## 5. Database changes — none

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| domain (pure) | `test/categoryTree.test.ts` | S07-3 |
| adapters | `test/StudiesService.behavioral.test.ts` | S07-11 (both adapters) |
| adapters | `test/StudiesHttpAdapter.test.ts` | S07-12 |
| app / routes | `test/App.test.tsx` | route table, S07-9, ErrorBoundary isolation |
| pages (RTL + in-memory) | `test/LibraryPage.test.tsx` | S07-4, S07-5 |
| pages | `test/SubjectPage.test.tsx` | S07-6, S07-7 |
| pages | `test/NotePage.test.tsx` | S07-8 |
| pages | `test/TagPage.test.tsx` | S07-10 |
| shell | `afwilto-shell-web-ui/test/AppRoutes.test.tsx` | S07-1 |
| shell | `afwilto-shell-web-ui/test/federation.test.ts` | S07-1 (remote registration in `vite.config.ts`, type declaration, `StudiesApp`) |
| homepage | `afwilto-homepage-web-ui/test/HomePage.test.tsx` | S07-2: the cards, and the nav link through the `BaseLayout` default nav that the homepage renders |

Commands: `pnpm --filter afwilto-studies-web-ui test`, the same filter with
`typecheck` and `build`, and `pnpm -r test` for the regression check.

## 7. Implementation notes

- Scaffold copied from `afwilto-certifications-web-ui`, with the same versions of
  React 19, react-router-dom 7, Vite 8, Tailwind v4, `@module-federation/vite`, Vitest
  and RTL. The federation `name` is `studies`, `exposes: { './App' }`, with shared
  singletons `react`, `react-dom` and `react-router-dom`. Port 3008 uses `strictPort`.
- `main.tsx` mounts `App` under `/studies/*` in standalone mode, so links behave the
  same as in the shell.
- `App` owns `ErrorBoundary`, `ServiceProvider` (overridable `value` for tests) and
  `ToastProvider`. Routes are lazy, each wrapped in `ErrorBoundary` + `Suspense`.
- `StudiesLayout` = `BaseLayout` with the nav Home · Studies.
- Layout under `src/`:
  - `application/ports/IStudiesService.ts`;
  - `domain/categoryTree.ts`;
  - `infrastructure/adapters/{http,memory}`;
  - `di/`;
  - `hooks/`, one per page query;
  - `pages/{Library,Subject,Note,Tag}`;
  - `pages/shared/{SortSelect,TagChip,KindBadge,ColorChip}`;
  - `router/`, `layouts/`.
- The in-memory adapter reproduces the backend's sort with its tie-break (`title asc`,
  then `id asc`), and normalizes the tag query the way the backend does.
- `.env.development` / `.env.production` set
  `VITE_API_URL=http://localhost:8084/api/v1`. `Dockerfile.mfe` bakes it at build time,
  as for certifications. CORS is already open for :3000 and :3008 (Slice 01 compose).
- `pnpm-lock.yaml` is updated by `pnpm install`. No new third-party package is added
  beyond what certifications already uses.

### Decisions (defaults; confirm on approval)

- **D-1** In this slice the note body is the raw Markdown source in a `<pre>`. Real
  rendering comes with sanitization in Slice 08, so no half-safe Markdown renderer is
  shipped in between. *Alternative:* `react-markdown` + GFM now, which moves part of
  Slice 08's security surface forward without its AC-F6 guard.
- **D-2** The tag view (`tags/:tag`) ships here, because the tag chips required by
  AC-F4 need a target. *Alternative:* the chips link to a "Not found" page until a
  later slice.
- **D-3** Every tree node starts expanded. *Alternative:* collapsed below the roots.

## 8. Verification record

**2026-10-08**

- **Red phase.** Before any implementation, 98 studies tests, 5 shell tests and
  3 homepage tests failed on their assertions. The failures were stub
  `not implemented` errors or missing elements, never import errors.
- **Green phase.** `pnpm -r --no-bail test` passes with every package green:
  - studies: 99 tests in 8 files;
  - shell: 29 tests (5 new);
  - homepage: 9 tests;
  - design-system: 46 tests;
  - the other apps are unchanged and green.
- **Static checks.** `typecheck` is clean for studies, shell, homepage and
  design-system. `pnpm --filter afwilto-studies-web-ui build` emits
  `dist/remoteEntry.js`.
- **Compose.** `docker compose up -d --build studies-mngr studies shell afwilto-home`
  succeeds. `scripts/smoke.sh` reports, for `:3008`:
  - `remoteEntry.js` → 200;
  - `index.html` and `remoteEntry.js` both revalidate (`no-cache`);
  - `studies-mngr /healthz` → 200.
- **Wiring, checked over HTTP:**
  - the served studies bundle contains `http://localhost:8084/api/v1`;
  - `Origin: http://localhost:3000` gets `Access-Control-Allow-Origin` back;
  - the served shell bundle references `localhost:3008/remoteEntry.js`;
  - the served homepage contains the Studies card;
  - `localhost:3000/studies/subjects/x` → 200 (SPA fallback).
- **Browser check.** Browser automation was unavailable, so the owner ran it
  (see below). Demo rows were not seeded, because deletes are logical-only and the
  rows would stay forever.
- **Shared components.** `ColorChip`, `KindBadge`, `TagChip` / `TagList` and
  `DateText` live together in `pages/shared/chips.tsx`, rather than in one file each
  as §7 listed. The sort vocabulary is in `pages/shared/sortOptions.ts`.
- **Independent review.** A fresh instance reviewed the slice and ran mutation tests.
  - It found no user-facing bug, no contract mismatch and no architecture violation.
  - It found that several criteria were covered only vacuously (M1–M7): breaking the
    code still left all 99 tests green. Each gap now has a test.
  - Low findings fixed:
    - **L1:** `useAsync` keys each result by its deps, so no stale frame renders
      under new deps.
    - **L2:** the in-memory category order uses the backend's `chr(1)` path key.
    - **L4:** the note page survives a failed subject lookup.
  - **L3 accepted:** the in-memory "byte order" compares UTF-16 code units, not
    UTF-8 bytes. They differ only for titles mixing U+E000–U+FFFF with astral
    characters, which is negligible at personal scale.
  - **Mutation re-check.** The reviewer's 14 mutations plus one control are
    re-applied to the final code by a scratch script, and each now fails at least one
    test. Final count: 132 studies tests green, typecheck clean.
- **Browser check (owner, 2026-10-08).** `localhost:3000/studies` against the real,
  empty `studies-mngr` shows the studies navbar, the "Studies" header and the
  "No categories yet" empty state. This closes S07-14.
