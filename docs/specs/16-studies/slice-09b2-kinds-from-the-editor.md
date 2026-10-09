# Slice 09b-2 — Note kinds reachable from the note editor

> Status: **Approved 2026-10-09**. In chat the owner chose "in the note editor"
> (AskUserQuestion) out of four entry points.
> Parent: `../16-studies.md` FR-7, AC-F12; follows `slice-09a-manage-categories-kinds-subjects.md`
> (the `/studies/kinds` page) and `slice-09b-note-editor.md`.
> Backend: none.

## 1. Problem

The note kinds CRUD exists at `/studies/kinds`, but in practice the owner can reach it
only through the URL or the navbar. In the place where a kind is actually needed,
choosing one for a note, there is no way to create or manage kinds.

## 2. Functional specification

The note editor's **Kind** field gains two actions next to its `Select`:

- **"+ New kind"** opens a design-system `Dialog` titled "New kind", with a Name field.
  On Save it:
  - calls `createKind`;
  - adds the kind to the editor's kind list, keeping it alphabetical as the API
    orders kinds;
  - **selects it**;
  - closes, without leaving the editor. Everything typed so far stays.

  Errors keep the dialog open. The client mirror shows "Name is required" / "At most
  40 characters" / "Name cannot contain control characters". The server's
  `duplicate_name` message appears under Name. A network failure shows a toast.
- **"Manage kinds ↗"** is a link to `/studies/kinds` that opens in a **new tab**
  (`target="_blank"`, `rel="noopener noreferrer"`). Renaming or deleting kinds
  therefore never takes the user away from an unsaved note, and the unsaved-changes
  guard does not fire for it. The editor's kind list is not refreshed live. If a kind
  is deleted in the other tab, saving with it returns 422 `kindId` `not_found`, shown
  under Kind (existing behavior).

**Non-goals:**
- No library, badge or dialog-based management entry points. The owner chose only
  the editor.
- No changes to `/studies/kinds`.
- No live sync between tabs.
- No backend change.

## 3. Acceptance criteria

- **S09b2-1** "+ New kind" → dialog "New kind". Name "Lab report" → Save:
  - `createKind('Lab report')` is called once;
  - the dialog closes;
  - the Kind options read `Cheat sheet, Lab report, Summary`, with "Lab report"
    selected;
  - the title typed before is unchanged;
  - the location is unchanged.
- **S09b2-2** A later Save of the note sends the new kind's id: as `kindId` on
  create, and in the patch on edit.
- **S09b2-3** In the dialog:
  - an empty name shows "Name is required" and sends nothing;
  - "summary" shows "a note kind with this name already exists" under Name (via
    `aria-describedby`), keeps the dialog open, and leaves the selected kind
    unchanged.
- **S09b2-4** "Manage kinds" links to `/studies/kinds` with `target="_blank"` and
  `rel="noopener noreferrer"`. Clicking it while the form is dirty opens no guard
  dialog.
- **S09b2-5** Every earlier test stays green, typecheck is clean, and `build:check`
  passes.
- **S09b2-6** **Manual:** in the browser, create a kind from the editor while
  writing a note, then save the note with it.

## 4. Test plan

`test/NoteEditor.test.tsx` gains a "Kinds from the editor" block that covers S09b2-1..4.

## 5. Verification record

**2026-10-09**

- **Red phase.** 4 tests failed first.
- **Green and mutations.** 621 tests passed, typecheck was clean, and 6 mutations
  were killed.
- **Headless Chrome against the running stack:**
  1. typed a title and body;
  2. "+ New kind" → "Browser check kind" was created and selected, and the body was
     kept;
  3. saving stored the note with that kind.

  That check left a "Browser check kind" kind and a "Kind from editor" note in the
  Demo subject.
- **Independent review.** It found 3 issues:
  - Ctrl/Cmd+S inside the New kind dialog saved the note and left the page. **Fixed:**
    the page shortcut ignores keystrokes inside an open dialog.
  - A kind created after the dialog was closed was still selected. **Fixed:** it is
    listed but not selected.
  - The edit-mode half of S09b2-2 had no test. **Added.**

  All are fixed with tests that were red first. Final count: 624 tests green, and 3
  mutations killed.
- **S09b2-6 manual check:** _pending, owner._
