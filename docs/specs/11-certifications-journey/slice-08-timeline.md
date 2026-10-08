# Slice 08 — Timeline Page

> Status: **Approved 2026-07-05 — Implemented**
> Slice of: `11-certifications-journey.md`
> Depends on: Slice 06 (read path), Slice 07 (write path)

---

## 1. Functional Specification

**What:** A yearly timeline view (`/certifications/timeline`) that renders each
certification whose study period intersects the selected year as a horizontal
bar on a 12-month grid. Overlapping ranges are stacked in separate lanes so
parallel study plans are visibly parallel.

**Why:** The signature product feature (§1.3 problem 2, §3 of the module spec).
Answers "what am I studying in month X?" with one glance and zero clicks.

**Scope:**
- `domain/timeline/assignLanes.ts` — pure lane-assignment function
- `domain/timeline/categoryColor.ts` — stable id→palette-color hash
- `hooks/useTimeline.ts` — year URL-state + filtered data fetch
- `pages/Timeline/TimelinePage.tsx` — full timeline page
- Route `timeline` wired in `routes.tsx` (currently a stub — replace with real page)

**Non-goals (Slice 08):**
- No drag-to-reschedule (§12.7).
- No multi-year horizontal scroll.
- No quarter/month zoom levels.
- No dependency arrows between bars.
- No hover card with goal excerpt (bars show name only; hover-card is §12.5 detail — deferred to Slice 10 a11y pass).
- No attachment evidence on the timeline.
- No backend changes (uses existing `list` port method with `year=` filter).

---

## 2. Business Rules

**BR-TL1:** Items with no dates (`studyStartDate` and `expectedExamDate` both null)
do NOT render on the canvas; they appear in the "Unscheduled" collapsible tray.

**BR-TL2:** An item with only one date renders as a single point/diamond at that
date (occupies a 1-day column span on the grid).

**BR-TL3:** Bars clip at the year edges (January 1 / December 31 of the selected
year). An item whose range extends into an adjacent year is clipped; this is
indicated by a visual right-arrow or left-arrow cap (CSS only, not a separate component).

**BR-TL4:** Lane assignment is deterministic: items are sorted by start date
(using `studyStartDate ?? expectedExamDate ?? achievedDate`), ties broken by `id`
alphabetically, then greedy coloring with a 3-day visual gutter between adjacent
bars in the same lane.

**BR-TL5:** The "today" marker renders as a cyan vertical line only for the
current year. For past/future years it is hidden.

**BR-TL6:** Year defaults to the current calendar year when absent from the URL.
The URL parameter is `?year=NNNN`.

**BR-TL7:** Category and status filters are additive (AND semantics, matching
the list endpoint). Active filters are shown as dismissible Tag chips.

---

## 3. Acceptance Criteria

References the Gherkin IDs in §5 of the module spec.

### AC-T1 — Year view (GH-T1)

Given certifications with date ranges inside and outside 2026,
when the user opens `/certifications/timeline?year=2026`,
then only certifications whose `[studyStartDate, expectedExamDate]` interval
intersects calendar year 2026 render on the canvas grid.

### AC-T2 — Overlap lanes (GH-T2)

Given "AWS SAA" (studyStartDate 2026-08-01, expectedExamDate 2026-11-15) and
"CKA" (studyStartDate 2026-10-01, expectedExamDate 2027-01-31),
when the 2026 timeline renders,
then the two bars are placed in different lanes (lane 0, lane 1) and are both
fully visible.

### AC-T3 — Item anatomy (GH-T3)

Each rendered bar:
- shows the certification name (truncated with ellipsis if it overflows)
- shows a category color accent (left border or background tint from `categoryColor`)
- shows a status badge (planned/in_progress/achieved)
- is a navigable link — clicking it navigates to `/certifications/:id`

### AC-T4 — Unscheduled tray (GH-T4)

A certification with null `studyStartDate` and null `expectedExamDate`:
- does NOT appear on the canvas grid
- DOES appear in the collapsible "Unscheduled" tray below the canvas

### AC-T5 — Empty year (GH-T5)

When no certification's dates intersect the selected year (and there are no
unscheduled items):
- the canvas shows an `EmptyState` with text "Nothing planned for {year}"
- a "Plan a certification" CTA navigates to `/certifications/new`

### AC-T6 — Year navigation

The year displayed in the header changes when:
- the user clicks the ◀ (previous year) or ▶ (next year) button
- the URL `?year=` param changes

The URL is updated immediately on navigation (deep-linkable).

### AC-T7 — Filter controls

Category and status filter selections are reflected as:
- dismissible `Tag` chips in the filter row
- updated URL params (so filters survive page refresh)
- a "Clear" button that removes all active filter Tags and resets to the unfiltered view

### AC-T8 — Loading and error states (GH-X1, GH-X2)

While data is loading: skeleton rows render (using the `Skeleton` atom).
On fetch error: an `Alert variant="error"` renders with the error message.

### AC-T9 — `assignLanes` pure function

The pure `assignLanes(items, year)` function:
- returns an array of `{ item, lane, startDay, endDay }` for each item with dates
- `startDay` is 1-indexed day of year (1 = Jan 1), clipped to [1, daysInYear]
- `endDay` is 1-indexed, inclusive, clipped to [1, daysInYear]
- places items with overlapping ranges in different lanes (no two bars in the same lane overlap, respecting the 3-day gutter)
- is deterministic for identical inputs
- handles: empty input, single item, identical ranges, fully-nested ranges, point items (one-day span), ranges clipped at year edges

### AC-T10 — `categoryColor` pure function

`categoryColor(categoryId)` returns a stable hex color string from the
8-color palette (`cyan`, `violet`, `amber`, `emerald`, `rose`, `sky`, `lime`, `fuchsia`)
for any given category UUID. The same id always returns the same color.

---

## 4. API/Port delta

No new endpoints. Uses the existing port:
```ts
list({ year, status, categoryPrefix, page: 1, pageSize: 100 }): Promise<CertificationPage>
```

`pageSize=100` is used with an explicit warning comment if the total exceeds 100
(deferred — unlikely at personal scale per §3 of the module spec).

---

## 5. Database changes

None.

---

## 6. Test plan

| Test file | Level | Named cases |
|---|---|---|
| `test/timeline.domain.test.ts` | Pure logic | assignLanes: empty, single, no-overlap, overlap→different-lanes, nested→different-lanes, point item, year-edge clipping, 3-day gutter, determinism by id tiebreak; categoryColor: same id→same color, different ids→deterministic colors, all 8 palette slots reachable |
| `test/timeline.page.test.tsx` | Page (RTL) | AC-T1: only year-intersecting items render; AC-T3: bar is a link; AC-T4: unscheduled tray; AC-T5: empty state; AC-T6: year prev/next buttons update URL; AC-T8: loading skeleton, error alert |

---

## 7. Implementation notes

Files to create:
- `src/domain/timeline/assignLanes.ts`
- `src/domain/timeline/categoryColor.ts`
- `src/domain/timeline/index.ts`
- `src/hooks/useTimeline.ts`
- `src/pages/Timeline/TimelinePage.tsx`
- `src/pages/Timeline/index.ts`
- `test/timeline.domain.test.ts`
- `test/timeline.page.test.tsx`

Files to update:
- `src/router/routes.tsx` — replace the `timeline` stub with the real lazy-loaded `TimelinePage`

**Rendering approach (§12.2):** CSS Grid with `grid-template-columns: repeat(daysInYear, 1fr)` on a `minWidth: 960px` inner div (the platform's scrollable-canvas pattern). Each bar uses `grid-column: startDay / endDay+1` and `grid-row: lane+2` (row 1 is the month header). This avoids SVG text/focus complexity.

**Lane calculation:** `assignLanes` returns `{ item, lane, startDay, endDay }[]`. The page maps these to grid items.

---

## 8. Documentation

- Update this file's status to "Approved" on slice completion.
- Spec 11 §16 roadmap: Slice 08 row remains as-is (already documents the outcome).
