# Slice 07 — Frontend write path + design-system additions

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 7

## 1. Functional specification

Extend `@afwilto/design-system` with the §11.2 component gap (Select, Textarea,
Skeleton, Tag, Dialog, Toast+Provider, Pagination, EmptyState, DateField,
Table) and the cyan accent tokens; then build the certification form
(create/edit), delete-confirm dialog and toasts in the MFE.

**Non-goals:** Timeline component (stays app-local, §11.2); date-picker
library (native `<input type="date">` only).

## 2. Business rules

- Every component follows the three-file convention + barrel exports + layer
  discipline (atoms import nothing above atoms, molecules compose atoms,
  organisms compose both).
- Form is a full page below `md`, a dialog at `md+`; delete always confirms.
- All async mutations surface success/error via Toast (`aria-live="polite"`).

## 3. Acceptance criteria

GH-X1 (skeletons/empty), a11y requirements §11.3 (focus trap + Esc in Dialog,
`aria-sort` on sortable headers, labeled fields, live-region toasts); create
< 30 s flow (§1.4) enabled by the form.

## 4/5. Contract & DB — none (frontend only)

## 6. Test plan

Component tests (Vitest + RTL): Select/Textarea error+disabled states;
Skeleton renders; Tag dismiss; Dialog open/Esc/backdrop/focus; Toast show +
auto-dismiss + role=status; Pagination navigation + disabled edges; EmptyState
CTA slot; Table aria-sort cycle + row render; DateField label wiring.
Page tests live with the MFE (Slice 06/07 app work).

## 7. Implementation notes

New dirs under `packages/design-system/src/{atoms,molecules,organisms}`;
`--color-cyan-300/400/500` added to `styles.css` `@theme`; shell
DesignSystemPage gains a showcase section.
