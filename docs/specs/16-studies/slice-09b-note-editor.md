# Slice 09b — Write path II: note create / edit / delete, editor, unsaved guard, conflicts

> Status: **Approved 2026-10-09** (owner chat). Two decisions were already
> taken in chat (AskUserQuestion, 2026-10-09):
> - **D-1:** the unsaved-changes guard covers in-app links, Cancel and tab
>   close/reload, but **not** the browser Back button. The shell is not changed.
> - **D-2:** the editor can move a note to another subject.
>
> Parent: `../16-studies.md` §11 Slice 09b. Covers FR-3, FR-5, FR-6 (input side), FR-7
> (kind picker), AC-F7, AC-F8, AC-F9, and AC-F12 (picker half).
> Backend: none. Slices 05–06 serve every note endpoint.

## 1. Functional specification

- **Create:** the subject page gains a **"New note"** button that opens
  `/studies/subjects/:subjectId/notes/new`.
- **Edit:** the note page gains **"Edit"**, which opens `/studies/notes/:noteId/edit`.
- **Delete:** the note page also gains **"Delete note"** (design-system `Dialog`). On
  success it returns to the subject page with a toast.
- **Note editor** (one page for both routes):
  - **Title** (`Input`).
  - **Kind** (`Select`): alive kinds, alphabetical. A new note preselects the first
    one (FR-7).
  - **Subject** (`Select`, edit only): every alive subject, labelled
    `<category path> — <subject>`. Changing it moves the note (D-2). A new note
    always belongs to the subject in its URL.
  - **Tags:** a tag input. Enter or a comma adds the normalized tag as a removable
    chip. At most 10.
  - **Slab links:** rows of label + path, which can be added and removed. At most 10.
  - **Content:** a CodeMirror 6 source editor in Markdown mode with a live
    **preview** that reuses `MarkdownView` (Slice 08).
    - At **≥ 1024px** the editor and preview sit side by side.
    - Below 1024px they show as two tabs, **Write** and **Preview** (AC-F7).
  - **Layout and clicks** (amended 2026-10-09 after the owner's browser check):
    - **Cause:** the shell and this remote ship separate Tailwind builds on the same
      page. Responsive display utilities (`hidden lg:block`, `lg:hidden`) therefore
      lose to the other build's `.hidden` / `.flex`, depending on stylesheet order.
      As a result the preview stayed hidden on desktop and the tabs stayed visible.
    - **Fix:** the layout is chosen in JS with `matchMedia('(min-width: 1024px)')`.
      Desktop renders both panes and no tabs; narrow screens render the tabs and only
      the active pane.
    - **Pane headings:** each pane has a visible heading, **Markdown** or **Preview**,
      so the two are never confused.
    - **Rule for this remote:** never pair a base utility with a responsive override
      of the same property (display, flex-direction, grid columns) in one
      `className`. A static test enforces it (`test/twoTailwindBuilds.test.ts`).
      Viewport-dependent layout uses `useMediaQuery` or inline styles instead. Three
      more spots were fixed for this: the editor field grid, the subject page note
      rows, and the slab-link rows.
    - **Clicks:** the whole editor box takes focus on click. Before, only the first
      line did, so clicking the empty box of a new note did nothing.
  - **Save** (button or **Ctrl/Cmd+S**) and **Cancel**.

**Non-goals:**
- No autosave and no local drafts (parent §1.3).
- No version history.
- No Back-button guard (D-1).
- No WYSIWYG. Toolbar buttons are not part of this slice.
- No image upload.
- No editing of tags as a managed resource (FR-5).
- No change to the shell, the design system or the backend.

## 2. Business rules

### 2.1 Port and errors

- **New port methods:**
  - `createNote(subjectId, { title, kindId, content, tags, slabLinks }): Note`
  - `updateNote(id, { version, ...patch }): Note`, where `patch` contains only the
    fields that changed;
  - `deleteNote(id)`.
- **Error translation:**
  - **Create:** an unknown subject → `StudiesNotFoundError`, because the backend
    answers 404 for the addressed subject.
  - **Edit:** a 409 on `version` → `StudiesConflictError` with rule `stale_version`.
  - Every other 422/409 maps as in Slice 09a.
- **In-memory parity with studies-mngr.** The order of checks and the messages
  mirror the backend.
  - **Create:**
    1. title, content, tags, slab links;
    2. the subject (404);
    3. the kind (`kindId` `not_found`, "note kind does not exist");
    4. the title must be unique among alive notes of the subject (409 `title`
       `duplicate_name`).
  - **Update:**
    1. `version` is required and ≥ 1;
    2. `kindId` / `subjectId` must be UUIDs;
    3. an empty patch → 422 `body`;
    4. the note must exist (404);
    5. a `version` mismatch → 409 `stale_version`, "the note was changed since you
       read it; reload and re-apply your edit";
    6. then the fields, in the backend order (title → content → tags → slab links →
       kind → subject), then title uniqueness.

    A successful update sets `version + 1` and `updatedAt = now`.
  - **Delete:** logical. An unknown id → 404.

### 2.2 Client-side validation (mirrors, before any request)

| Field | Rule | Message |
|---|---|---|
| title | Go-trimmed, 1–200 characters, no control characters | "Title is required" / "At most 200 characters" / "Title cannot contain control characters" |
| content | ≤ 200,000 characters, no NUL | "At most 200,000 characters" / "Content cannot contain NUL characters" |
| a tag being added | FR-5 normalization; result must match `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–40 characters | "Tags are lowercase words joined by dashes (max 40 characters)" |
| tag count | ≤ 10 distinct; a duplicate is silently merged | "At most 10 tags" |
| slab link label | Go-trimmed, 1–80 characters, no control characters | "Label is required" / "At most 80 characters" / "Label cannot contain control characters" |
| slab link path | `^/slab(/[a-z0-9-]+)+$` | "Use a path like /slab/ud/operative-systems" |

The tag normalization mirror is pure (`domain/tags.ts`) and matches the backend table
from Slice 06. The server stays authoritative. Its messages land under the matching
field:
- `title`;
- `tags` / `tags[i]`, shown under Tags;
- `slabLinks[i].label` and `slabLinks[i].path`, shown on that row;
- `kindId`;
- `subjectId`.

### 2.3 Saving

- **Create:** sends `createNote` and navigates to `/studies/notes/:id` with the toast
  "Note created".
- **Edit:** sends the **version it loaded** plus only the changed fields. An
  unchanged form sends nothing and goes back to the note. Success navigates to the
  note with the toast "Note saved".
- **While a save is in flight,** Save is disabled and a second Ctrl/Cmd+S does
  nothing.
- **Ctrl/Cmd+S** saves from anywhere in the editor page, including inside CodeMirror,
  and prevents the browser's "save page" dialog.

**Amendments after review (2026-10-09):**
- **A tag typed but not yet added belongs to the form.** It makes the form dirty,
  Save commits it, and if it is invalid it blocks the save with its message.
- **Save stays latched after a success** until the navigation lands. React Router
  navigates inside a transition and the target route is lazy, so without the latch a
  second Ctrl/Cmd+S would re-create the note or send a stale version.
- **Tags compare as a set.** Removing a tag and adding it back is not a change.
- **A 404 on create** says "The subject was deleted."
- **A server `tags[i]` error** shows once, under Tags.
- **Removing a link row** clears the row-indexed errors, so they never land on the
  wrong row.

### 2.4 Stale version (AC-F9)

On a 409 `stale_version`:
- a toast shows "This note changed since you opened it";
- the editor keeps every field the user typed;
- a banner (`Alert`) offers two actions:
  - **"Reload latest":** a design-system `Dialog` asks "Discard your edits and load
    the latest version?". On confirm, the form is replaced with the server's current
    note and its new `version`.
  - **"Copy my text":** copies the current content to the clipboard, then shows
    "Copied" or "Copy failed".
- After a reload, saving again uses the new version.
- **Reload is not undoable** (amended after review). The replace from "Reload
  latest" stays out of the undo history, so Ctrl+Z cannot bring back the discarded
  text, and the cursor is kept where possible.
- **A failed reload** (network or 5xx) shows its message and keeps the user's text.

### 2.5 Unsaved-changes guard (AC-F8, D-1)

- **Dirty** means the form differs from what was loaded, or from the empty new-note
  state. A successful save clears it.
- **While dirty,** the guard intercepts:
  - **In-app links:** a click on any same-document `<a href>` whose target is
    another route (the navbar, breadcrumbs, links in the preview). The click is
    stopped in the capture phase and a design-system `Dialog` asks "Discard unsaved
    changes?":
    - **"Keep editing"** closes the dialog;
    - **"Discard"** navigates to the intended target.
  - **Cancel:** the same dialog.
  - **Tab close / reload:** a `beforeunload` listener, so the browser shows its own
    prompt. That prompt is the browser's, not `window.confirm`.
- **Never** `window.confirm` / `alert` / `prompt`.
- **Not covered:** the browser Back and Forward buttons (D-1). This is stated in
  §1, not hidden.

### 2.6 Delete (note)

- The note page's **"Delete note"** opens `Delete note “<title>”?` and returns to its
  subject page with the toast "Note deleted".
- **404:** "It was already deleted."; closing returns to the subject page.
- Notes are never `in_use`.

### 2.7 Lazy loading (AC-F14 extended)

CodeMirror loads only on the editor routes. Library, subject, category, tag and note
**view** pages never import `features/editor`. The static guard and `build:check`
gain this rule: no `@codemirror/*` in the static closure of those roots.

## 3. Acceptance criteria

Parent criteria covered: **AC-F7, AC-F8, AC-F9**, and the picker half of **AC-F12**.

- **S09b-1** Behavioral suite, run against both adapters, for `createNote` /
  `updateNote` / `deleteNote`:
  - happy paths, including version + 1, `updatedAt`, a move, and tags normalized and
    sorted;
  - every rule in §2.1 with its field, rule and backend message;
  - deletes are logical: the note leaves lists, counts and tag views, and its title
    is free again.
- **S09b-2** HTTP adapter:
  - `POST /subjects/{id}/notes`, `PATCH /notes/{id}` and `DELETE /notes/{id}`;
  - bodies keep absent keys absent;
  - 404 on create → `StudiesNotFoundError`;
  - 409 `stale_version` → `StudiesConflictError`.
- **S09b-3** Pure mirrors: the title, content and slab-link validators, and the tag
  normalization table (Slice 06 cases), including the 10-tag cap with duplicate
  merging.
- **S09b-4** (AC-F7) The editor:
  - title, kind (first alphabetical preselected on create), tags, slab links, a
    source editor labelled "Markdown source", and a preview showing the rendered
    content as it is typed;
  - **≥ 1024px** (`matchMedia`): both panes side by side under "Markdown" /
    "Preview" headings, with no tabs. **Below 1024px:** Write/Preview tabs, with
    both panes kept mounted and the inactive one `hidden`, so the editor's undo
    history and cursor survive a tab switch (amended after review);
  - **Ctrl+S and Cmd+S** both save.
- **S09b-5** Create:
  - a valid form posts the trimmed title, the kind, the content, the normalized
    tags and the links;
  - it lands on the note view with the toast;
  - an invalid title, tag or link shows its message and sends nothing;
  - a server `title` duplicate shows under Title.
- **S09b-6** Edit:
  - the form is prefilled;
  - a change sends `{ version: <loaded>, <changed fields only> }`;
  - unchanged → no request;
  - moving to another subject sends `subjectId`, and the note view shows the new
    subject;
  - only alive kinds are offered (AC-F12).
- **S09b-7** (AC-F9) Stale version:
  - the toast shows, the typed text is kept, and the banner offers both actions;
  - "Copy my text" writes the current content;
  - "Reload latest" → confirm → the form shows the server's note, and the next save
    sends the new version and succeeds.
- **S09b-8** (AC-F8) Guard:
  - dirty + click on the navbar "Studies" → the dialog, and the location is
    unchanged;
  - "Keep editing" stays;
  - "Discard" navigates;
  - Cancel when dirty → the dialog, and when clean it navigates immediately;
  - a `beforeunload` listener is installed only while dirty;
  - after a successful save no dialog appears;
  - `window.confirm` is never called.
- **S09b-9** Delete note:
  - success → the subject page with the toast, and the note gone from the list;
  - 404 → "It was already deleted.".
- **S09b-10** Not found:
  - the new-note route for an unknown subject shows "Subject not found";
  - the edit route for an unknown note shows "Note not found".
- **S09b-11** `SourceEditor`, with real CodeMirror in jsdom:
  - it renders the value;
  - a user edit calls `onChange` with the new text;
  - `Mod-s` calls `onSave`;
  - a new `value` prop from outside replaces the document (the "Reload latest"
    path).
- **S09b-12** The route table gains `subjects/:subjectId/notes/new` and
  `notes/:noteId/edit`, ordered before the catch-all. The AC-F14 guards are extended
  (§2.7). Every earlier test stays green, typecheck is clean, and `build:check` passes.
- **S09b-13** **Manual (§6):**
  1. Create a note with math, code and a diagram.
  2. Edit it in two tabs and save both: the second gets the conflict flow.
  3. Try leaving with unsaved changes through the navbar.
  4. Delete the note.

## 4. Contract / database delta — none

## 5. Implementation notes

- **New dependencies** (this remote only), at exact versions at least two weeks old:

  | Package | Version |
  |---|---|
  | `@codemirror/state` | `6.7.6` |
  | `@codemirror/view` | `6.43.13` |
  | `@codemirror/commands` | `6.11.1` |
  | `@codemirror/language` | `6.12.4` |
  | `@codemirror/lang-markdown` | `6.5.2` |
  | `@codemirror/language-data` | `6.5.2` (lazy grammars for fenced code) |
  | `@codemirror/theme-one-dark` | `6.1.3` |
- **Files:**
  - `features/editor/{SourceEditor.tsx, useUnsavedGuard.tsx}`;
  - `domain/{tags.ts, noteValidation.ts}`;
  - `pages/NoteEditor/{NoteEditorPage, TagsInput, SlabLinksEditor, ConflictBanner}.tsx`.
- **Page tests** replace `SourceEditor` with a textarea at the module boundary, so
  CodeMirror only runs in its own test (S09b-11).
- **Preview** (amended after review):
  - `MarkdownView` is memoized, so keystrokes in other fields never re-run the
    pipeline;
  - the content goes through `useDeferredValue`, so typing stays responsive on long
    notes.
- **Tag lowercasing** follows Go `strings.ToLower`: U+0130 "İ" becomes `i`.

## 6. Verification record

**2026-10-09**

- **Red phase.** 128 tests failed before any implementation.
- **Green.** 577 tests passed, typecheck was clean, and `build:check` passed:
  - CodeMirror is counted as a heavy library;
  - the roots grew to 7, adding `NotePage` and `CategoryPage`;
  - `SourceEditor` runs real CodeMirror 6 in jsdom.
- **Author mutations.** 46 mutations. Four survived, and each was dealt with:
  - **Redundant code, removed:** an in-memory tag sort (reads already sort), and the
    guard's `stopPropagation`, since a router `Link` already skips a prevented click.
  - **Untested path, now covered:** a server `tags[i]` error.
  - **Test made stricter:** the guard test had passed with no `preventDefault`,
    because React Router navigates inside a transition. The test now waits out the
    transition and asserts the URL never changes.
- **Independent review.** It found:
  - **A:** a tag typed but not added was lost at save time;
  - **B:** a second save could slip in before the navigation;
  - **C:** the preview re-parsed on every keystroke;
  - **D:** the reload replace was undoable and reset the cursor;
  - **E:** a failed reload went unhandled;
  - **F:** a server tag error showed twice;
  - **G:** tag-order churn counted as a change;
  - **H:** a misleading 404 message on create;
  - **I:** row errors drifted after a removal;
  - **J:** "İ" was lowercased differently from Go;
  - several untested rules and check-order cases.

  Each finding has a test that was red first, and all are fixed. Final count: 608
  tests green.
- **Final mutation re-check.** All 19 mutations on the fixes are killed.
- **Owner browser check (2026-10-09).** Two failures were reported: typing into the
  editor did not work, and the editor and preview could not be told apart. Both were
  reproduced in headless Chrome (`playwright-core` driving the system Chrome against
  the running stack):
  - CodeMirror's editable area was one line tall inside a 384px box;
  - the preview had `display: none` on desktop because of the two-Tailwind-builds
    conflict.

  Both are fixed (§1 amendment).
  - **Follow-up review.** It found that tab switches remounted the editor, that the
    same CSS conflict hit three more layouts, and that several parts of the fix were
    untested. All are fixed, and 7 mutations are killed.
  - **Final suite.** 617 tests green, plus a static guard against new conflicts.
  - **Headless Chrome confirmed:**
    - **Desktop:** two-column fields, both panes under "Markdown"/"Preview", no
      tabs. Clicking the empty box and typing works, and the preview renders KaTeX
      live. Editing and saving the demo note with Cmd+S works (version 1 → 2).
    - **Narrow:** tabs, with the preview visible on its tab. Undo history survives a
      tab round trip.
    - **Subject page:** note rows lay out as a row on wide screens.
- **S09b-13 manual check (owner, 2026-10-09).** "Funcionó": create, edit, the
  conflict flow and delete were confirmed in the browser after the fix.
