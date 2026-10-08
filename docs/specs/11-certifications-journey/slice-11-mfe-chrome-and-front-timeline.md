# Slice 11 — MFE Chrome + Front-page Timeline

> Status: **Approved 2026-07-05 — Implemented**
> Slice of: `11-certifications-journey.md` (post-Slice-10 polish)
> Depends on: Slice 06–10 (all pages + timeline exist)

---

## 1. Functional specification

Two defects observed running the MFE inside the shell (`:3000`) and standalone (`:3006`):

1. **No AFWILTO chrome.** The certifications MFE renders bare pages with no
   navbar or footer, unlike every other MFE (finance, UD, mati) which wrap their
   routes in `BaseLayout` from `@afwilto/design-system`. There is no way to
   navigate between the list and the timeline.
2. **Timeline invisible on the landing page.** The timeline visualization only
   exists at `/certifications/timeline`. The landing page (`/certifications`) is a
   plain table, so the signature timeline graphics (§3 of the module spec) are not
   surfaced where the user first lands.

**What this slice does:**
- Wrap the whole MFE in `BaseLayout` (Navbar + Footer) with certifications-specific
  nav links, matching the platform convention (finance's `AppLayout` pattern).
- Extract the timeline canvas into a reusable `TimelineCanvas` presentation
  component and a URL-decoupled `useTimelineData(year)` hook.
- Embed a current-year `TimelineCanvas` at the top of the landing page, above the
  filters and table.

**Non-goals:**
- No backend changes.
- No new design-system components (reuse `BaseLayout`, `Navbar`, `Footer`).
- No change to the timeline lane/color algorithms (`assignLanes`, `categoryColor`).
- No change to route paths or relative navigation semantics (`../id`, `../new`).
- The front-page timeline is read-only overview; year controls & filters stay on
  the dedicated `/timeline` page.

---

## 2. Business rules

**BR-CH1:** `BaseLayout` wraps ALL routed pages (list, timeline, detail, form,
edit, not-found). The navbar/footer are always present.

**BR-CH2:** Nav links (absolute paths, valid in both shell and standalone since the
MFE owns the `/certifications` URL space):
- `Home` → `/`
- `Certifications` → `/certifications`
- `Timeline` → `/certifications/timeline`

**BR-CH3:** Pages must not render their own `min-h-screen` / full-bleed background
wrappers — `BaseLayout` owns the page shell (`min-h-screen`, `bg-surface-base`,
centered `<main>`). Pages render only their content container.

**BR-FT1:** The landing page shows the `TimelineCanvas` for the **current calendar
year** when at least one scheduled certification (with dates) intersects that year.

**BR-FT2:** When no scheduled certification intersects the current year, the
front-page timeline section is **omitted entirely** (the list's own empty state
covers the "no data" case — no empty canvas is shown).

**BR-FT3:** The front-page timeline includes a "Full timeline →" link to
`/certifications/timeline`. It does NOT include year navigation, filters, the
unscheduled tray, or the legend (those stay on the dedicated page).

**BR-FT4:** The front-page timeline data fetch is independent of the list query
(it always uses the current year and is not driven by the `?year=` list filter).

---

## 3. Acceptance criteria

### AC-N1 — Navbar present
Given the MFE renders any route,
then the AFWILTO brand ("AFWILTO Software Lab") is visible in a navbar.

### AC-N2 — Nav links
Given the navbar renders,
then it contains links labeled "Certifications" (→ `/certifications`) and
"Timeline" (→ `/certifications/timeline`).

### AC-N3 — Footer present
Given the MFE renders any route,
then a footer region is present.

### AC-N4 — Chrome on every page
Given the user navigates to the detail page (`/certifications/:id`),
then the navbar is still present (layout wraps all routes).

### AC-F1 — Front timeline graphics
Given a certification whose dates intersect the current year,
when the landing page (`/certifications`) renders,
then the timeline canvas (`aria-label="Timeline canvas"`) is present and the
certification's bar (a link to its detail page) is shown.

### AC-F2 — List still present
Given the same landing page,
then the certifications table/list is still rendered below the timeline.

### AC-F3 — No timeline when nothing scheduled this year
Given no certification's dates intersect the current year,
when the landing page renders,
then no timeline canvas is present (BR-FT2) but the list section still renders.

### AC-F4 — Full-timeline link
Given the front timeline renders (AC-F1),
then a "Full timeline" link to `/certifications/timeline` is present.

---

## 4. API/Port delta
None.

## 5. Database changes
None.

---

## 6. Test plan

| Test file | Named cases |
|---|---|
| `test/layout.test.tsx` | AC-N1 brand visible; AC-N2 nav links with correct hrefs; AC-N3 footer present; AC-N4 chrome on detail route |
| `test/front-timeline.test.tsx` | AC-F1 canvas + bar on landing when current-year cert exists; AC-F2 table present alongside; AC-F3 no canvas when nothing this year; AC-F4 full-timeline link present |

Existing suites (92 tests) must stay green — especially `App.test.tsx` route
contract and `timeline.page.test.tsx` (refactor must be behavior-preserving).

---

## 7. Implementation notes

Files to create:
- `src/pages/Timeline/TimelineCanvas.tsx` + barrel export — pure presentation
  (`{ year, laned }` → Card with month header, today line, bars).
- `src/hooks/useTimelineData.ts` — fetch + lane-shape for an explicit `year`
  (no URL coupling). Returns `{ laned, unscheduled, loading, error }`.
- `src/layouts/CertificationsLayout.tsx` — `BaseLayout` + nav links + `<Outlet/>`.
- `test/layout.test.tsx`, `test/front-timeline.test.tsx`.

Files to update:
- `src/hooks/useTimeline.ts` — delegate to `useTimelineData(yearFromUrl)` + keep
  `setYear` URL writer (behavior-preserving for `TimelinePage`).
- `src/pages/Timeline/TimelinePage.tsx` — render extracted `TimelineCanvas`.
- `src/pages/Journey/JourneyListPage.tsx` — embed current-year `TimelineCanvas`
  above the filter bar (BR-FT1..FT4).
- `src/router/routes.tsx` — wrap routes in the layout route (parent `element:
  <CertificationsLayout/>`, existing routes become `children`).
- `src/App.tsx` — unchanged provider stack (layout lives in the route tree).
- All page components (`JourneyListPage`, `TimelinePage`, `Detail`, `Form`,
  `Edit`) — drop the `min-h-screen bg-surface-base px-… py-…` outer wrapper
  (BR-CH3); keep the inner `mx-auto max-w-…` content container.

Route-contract note: `App.test.tsx` reads `routes[].path`. After nesting, the
contract test is updated to read the layout route's `children[].path` (the
acceptance criteria for BR-CH1). Static-before-`:id` ordering is preserved.
