# Slice 09a-2 — Category actions in the library, category view, clickable breadcrumbs

> Status: **Approved 2026-10-09**. In chat the owner chose "actions in the library
> tree" and "category view" for the breadcrumb (AskUserQuestion). The details marked
> *(author)* below are implementation choices made within those options.
> Parent: `../16-studies.md` §9.1, FR-1, FR-2; follows `slice-09a-manage-categories-kinds-subjects.md`.
> Backend: none.

## 1. Problem

The owner reported two gaps:
- **Creating or editing a category** was only reachable through the URL or the navbar
  link, which hides in the hamburger menu below 768px. The library, the main
  screen, had no way to do it.
- **The subject page's category path** ("TI / Cloud / AWS") was plain text, so there
  was no way back up to a category level.

## 2. Functional specification

- **Library (`/studies`):**
  - The header gains **"New category"** (root) next to "New subject".
  - Every tree node gains the same actions as `/studies/categories`:
    - "+ Child" (`aria-label` "Add child to X"), hidden at depth 5;
    - "Edit" ("Edit X");
    - "Delete" ("Delete X").

    They open the existing `CategoryFormDialog` and `DeleteDialog`. On success the
    library refetches and the same toasts show.
  - Each category name becomes a link to its category view *(author)*.
  - The empty state's "Create a category" opens the New category dialog instead of
    linking away *(author)*.
- **Category view (`/studies/categories/:categoryId`, new route):**
  - **Breadcrumb:** `Studies / TI / Cloud`. "Studies" links to `/studies`, each
    ancestor links to its own view, and the current category is plain text with
    `aria-current="page"`.
  - **Header:** color chip and name, plus "+ Child" (hidden at depth 5), "Edit",
    "Delete" and "New subject". "New subject" preselects this category *(author)*.
  - **"Subcategories" section:** direct alive children, each a link to its view with
    its subject count.
  - **"Subjects" section:** direct alive subjects, each a link with its note count.
  - **Empty case:** both lists empty → "No subcategories or subjects yet".
  - **Unknown or deleted id:** "Category not found".
  - **Deleting** the viewed category navigates to its parent's view, or to
    `/studies` for a root, with the toast *(author)*. `in_use` shows the usual
    explanation.
- **Subject page:** the category path becomes the same breadcrumb, `Studies / TI /
  Cloud / AWS`, where every category segment links to its view. After a move it
  shows the new path.
- **Shared code:**
  - Category actions (buttons plus dialogs) are extracted once
    (`useCategoryActions`) and used by the library, the management page and the
    category view.
  - The breadcrumb is one component, `CategoryBreadcrumb`, built from the flat
    category list.

- **Refetch behavior** (amended after review). Pages that reload after an action keep
  the previous data on screen until the new data arrives (`useReloadable`), and their
  dialogs sit in one fixed slot. As a result:
  - open dialogs, including their "It was already deleted." message, survive the
    refetch;
  - expand state and focus are kept;
  - the library never flashes back to a skeleton.
- **Subject page breadcrumb** (amended after review). The breadcrumb refetches the
  category list whenever the subject's category changes. If the category is still
  unknown, it falls back to the path text.

**Non-goals:**
- No changes to the design-system Navbar. Its hamburger behavior and `NavLink`
  active state stay as they are.
- No category view for tag pages or note pages. The note page keeps its subject
  link.
- No new port methods: `listCategories` + `listSubjects` are enough.

## 3. Acceptance criteria

- **S09a2-1** Library header "New category" opens "New category" with parent
  "— Root —". Saving shows the new root in the tree with the toast "Category created".
- **S09a2-2** Library node actions:
  - "Add child to AWS" preselects `TI / Cloud / AWS`;
  - "Edit Cloud" → renaming updates the tree;
  - "Delete TI" → in-use text;
  - deleting an empty category removes it;
  - no "Add child" on a depth-5 node.
- **S09a2-3** The library empty state's "Create a category" button opens the dialog.
- **S09a2-4** A library category name links to `/studies/categories/<id>`.
- **S09a2-5** Category view for `Cloud`:
  - the breadcrumb "Studies" → `/studies` and "TI" → `/studies/categories/<ti>`;
  - "Cloud" is not a link and has `aria-current="page"`;
  - Subcategories lists AWS with "1 subject", linking to its view;
  - Subjects lists Azure with "1 note", linking to the subject.
- **S09a2-6** Category view actions:
  - "New subject" preselects the category, and creating lands on the new subject;
  - Edit renames the heading;
  - Delete in use shows the in-use text;
  - deleting an empty child category navigates to the parent view, and deleting an
    empty root navigates to `/studies`.
- **S09a2-7** Category view of an unknown id shows "Category not found". A category
  with no children or subjects shows "No subcategories or subjects yet".
- **S09a2-8** The subject page breadcrumb is `Studies / TI / Cloud / AWS`. Each
  category segment links to its view, and clicking "Cloud" navigates there. After
  moving the subject to Math it reads `Studies / Math`.
- **S09a2-9** The route table has `categories/:categoryId` right after `categories`.
  The AC-F14 static guard also forbids `pages/Category` from importing
  `features/markdown`. Every earlier test stays green, and typecheck and
  `build:check` pass.
- **S09a2-10** **Manual (§6):**
  1. From the library, create `TI > Cloud > AWS` without leaving the page.
  2. Open a subject and climb the breadcrumb level by level.

## 4. Contract / database delta — none

## 5. Test plan

| File | Covers |
|---|---|
| `test/LibraryActions.test.tsx` | S09a2-1..4 |
| `test/CategoryPage.test.tsx` | S09a2-5..7 |
| `test/SubjectPage.test.tsx` / `test/SubjectWrite.test.tsx` (updated) | S09a2-8 |
| `test/App.test.tsx`, `test/lazyBoundaries.test.ts` (updated) | S09a2-9 |

## 6. Verification record

**2026-10-09**

- **Red phase.** 23 tests failed before implementation.
- **Green.** 442 tests passed, typecheck was clean, and `build:check` passed.
- **Author mutations.** 11 of 12 killed. The survivor was equivalent: it showed that
  a categories refetch was redundant for the tested flows, so it was removed.
- **Independent review.** It found 2 correctness bugs and 3 low-severity ones, plus 3
  vacuous criteria.
  - **F1:** the parent view still listed a just-deleted child.
  - **F2:** on the category view, a gone-dialog was remounted and lost its message.
  - **F3:** "New subject" was not preselected for an id in different letter case.
  - **F4:** the subject breadcrumb lost its path after moving into a category created
    after the page loaded. This is exactly where the earlier "equivalent" removal was
    wrong under concurrent changes, so the refetch is back, keyed on the category id.
  - **F5:** the library re-skeletoned on every action and lost expand state.
  - **M1–M3** were vacuous: count labels matched with `toContain`, the "only one
    list" case was untested, and the case-insensitive id was untested.

  All are fixed, with tests that were red first. Final count: 449 tests green, and 13
  mutations (the review findings plus the author's set) are all killed.
- **S09a2-10 manual check (owner, 2026-10-09).** Confirmed working ("Si funciona"):
  creating the tree from the library, and climbing the breadcrumb.
