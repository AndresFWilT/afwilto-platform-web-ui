# Spec — Migrate financial-status MFE to the shared `@afwilto/design-system`

**Status:** Approved (commissioned 2026-07-04)
**App:** `apps/afwilto-financial-status-web-ui`
**Also touches:** `packages/design-system` (additive token extension only)

## Problem & goal

The financial-status MFE ships its own bespoke design system (neon-teal/purple on
near-black, defined in `src/index.css` `@theme` + mirrored in `src/tokens.ts`),
while every other MFE on the platform (`afwilto-homepage-web-ui`,
`afwilto-certifications-web-ui`, shell, slab apps) consumes the shared
`@afwilto/design-system` package (brand navy `#181D35`, blue accent, atomic
components). When the finance remote mounts inside the shell, the visual language
breaks.

**Goal:** the financial-status MFE consumes `@afwilto/design-system` as its single
source of design tokens, base styles, and (where they map) components — the
bespoke neon theme is deleted.

## Non-goals

- Restructuring every page into DS atoms/molecules (raw utility-class markup in
  pages stays; only tokens are re-mapped). Full atomic adoption is a follow-up.
- Replacing `lucide-react` icons or `recharts` charts.
- Any behavioural/route/data change. Module-federation config unchanged.
- Changing existing values of shared DS tokens (extension is strictly additive).

## Design decisions

1. **Domain vocabulary is preserved.** `income-*` / `expense-*` remain valid
   utility classes, defined in the app-level `@theme` as aliases of the shared
   `success-*` / `error-*` scales. Domain language first; only the *values* now
   come from the platform palette.
2. **The shared DS gains full semantic scales (additive):** `success`, `warning`,
   `error` get steps 300–700, `info` keeps 300–500; exported both as CSS theme
   vars in `styles.css` and as new top-level keys in `tokens/colors.ts`
   (`success`, `warning`, `error`, `info`, `neutral`). The existing flat
   `colors.semantic` export is unchanged (backward compatible).
3. **The purple accent collapses into `info-*`** (cyan): the platform palette has
   one primary accent; `info` keeps a second distinguishable hue for charts and
   goal/credit accents. Steps 600/700 clamp to 500.
4. **Neon glow utilities are removed** (`glow-primary`, `glow-purple`,
   `text-glow-primary`) with no replacement — the platform aesthetic has no glow.
5. **`src/tokens.ts` becomes a chart-palette adapter** deriving every value from
   `@afwilto/design-system` — no hardcoded hex duplicated from the old theme.
6. **Buttons that used dark-text-on-teal** (`bg-primary-400 text-dark-900`)
   adopt the shared `Button` primary convention: `bg-primary-500 text-white
   hover:bg-primary-400`.
7. **DesignPage becomes a showcase of the shared DS** (imports `Button`, `Badge`,
   `Card`, `Text` from `@afwilto/design-system`) plus the app's domain tokens.

## Token mapping (classes in `src/**/*.tsx`)

| Legacy | Replacement |
|---|---|
| `bg-dark-900` | `bg-surface-base` |
| `bg-dark-800`, `bg-dark-700` (+opacity mods) | `bg-surface-raised` |
| `hover:bg-dark-700`, `bg-dark-600`, `hover:bg-dark-600` | `…surface-overlay` |
| `bg-dark-500`, `hover:bg-dark-500` (+mods) | `…brand-700` |
| `border-border`, `border-dark-400`, `border-dark-300` | `border-surface-border` |
| `text-text-primary` | `text-neutral-100` |
| `text-text-secondary` | `text-neutral-400` |
| `text-text-muted` | `text-neutral-500` |
| `text-text-disabled` | `text-neutral-600` |
| `text-dark-900` (on accent bg) | `text-white` + decision 6 |
| `*-purple-300/400/500` | `*-info-300/400/500` |
| `*-purple-600/700` | `*-info-500` |
| `*-primary-800` | `*-primary-700` |
| `glow-primary`, `glow-purple`, `text-glow-primary` | removed |
| `income-*`, `expense-*`, `warning-*`, other `primary-*` | unchanged (re-valued) |

## Acceptance criteria

Each criterion maps to a test (TDD; vitest in each package).

- **AC-1 (DS extension).** `@afwilto/design-system` exports `colors.success`,
  `colors.warning`, `colors.error` with steps 300–700, `colors.info` 300–500 and
  `colors.neutral` 100–900; `styles.css` declares the matching
  `--color-success-600/700`, `--color-error-600/700`, `--color-warning-600/700`
  vars; `colors.semantic` still exports the flat legacy shape.
- **AC-2 (dependency & CSS wiring).** The app depends on
  `"@afwilto/design-system": "workspace:*"`; `src/index.css` imports
  `@afwilto/design-system/styles.css`, declares
  `@source "../../../packages/design-system/src"`, and its `@theme` block defines
  only domain aliases (`--color-income-*` → `var(--color-success-*)`,
  `--color-expense-*` → `var(--color-error-*)`) — no `--color-dark-*`,
  `--color-purple-*`, neon `--color-primary-*`, or `--color-text-*` remain.
- **AC-3 (no legacy vocabulary).** No file in `src/` contains: `dark-`\d or
  `purple-`\d utility classes, `text-text-*`, `border-border`, `glow`, or the
  legacy hexes `#00fff0`, `#a855f7`, `#0a0a0a`, `#1a1a1a`, `#111111`.
- **AC-4 (chart adapter).** `src/tokens.ts` exports `colors` with keys
  `primary`, `info`, `income`, `expense`, `warning`, `surface`, `neutral`,
  `border`, `text.{primary,secondary,muted}` whose values are identical to the
  corresponding `@afwilto/design-system` token values (e.g.
  `colors.income[500] === ds.success[500]`, `colors.border === ds.surface.border`).
- **AC-5 (StatCard).** `StatCard` renders on the shared `Card` (has
  `bg-surface-raised`), supports variants `income | expense | primary | accent`
  (value text uses `text-income-500`, `text-expense-500`, `text-primary-400`,
  `text-info-400` respectively), and no longer accepts/renders glow styling.
- **AC-6 (CategoryBadge).** Every category renders only mapped token classes
  (income/expense/warning/primary/info/brand families) — no legacy families.
- **AC-7 (regression).** The existing `test/App.test.tsx` suite still passes;
  `pnpm build` for the app and `pnpm typecheck`/`test` for the DS package exit 0.
- **AC-8 (showcase).** `/finance/design` renders shared DS components imported
  from `@afwilto/design-system` (at least `Button`, `Badge`, `Card`) and swatches
  for the domain tokens (income/expense).
- **AC-9 (platform navigation).** The app renders the shared `Navbar` whose
  brand ("AFWILTO Software Lab") links to `/` — the afwilto homepage remote when
  mounted in the shell; standalone, the catch-all redirect in `main.tsx` makes
  it a harmless no-op.
- **AC-10 (platform chrome).** Every finance page renders inside the shared
  `BaseLayout` (Navbar + centred `max-w-7xl` main + `Footer`) exactly like
  `afwilto-homepage-web-ui` and `afwilto-certifications-web-ui`. The bespoke
  `FinStatus` sidebar shell is deleted; finance sections (Dashboard, Incomes,
  Expenses, Metas, Créditos, Design) are reachable through a horizontal sub-nav
  styled with the Navbar link classes (`bg-brand-700 text-primary-300` active /
  `text-neutral-400 hover:bg-brand-800` idle).
- **AC-12 (semantic Button variants).** The shared `Button` gains `success` and
  `info` variants built on the DS semantic scales (`bg-success-600
  hover:bg-success-500`, `bg-info-600 hover:bg-info-500`, white text — 600 steps
  chosen for white-text contrast, matching the existing `danger` depth). The
  `info` colour scale is extended additively with steps 600/700 in both
  `tokens/colors.ts` and `styles.css`. Existing variants are untouched.
- **AC-13 (domain-coloured CTAs in finance).** Income CTAs use
  `variant="success"`, expense CTAs `variant="danger"`, credit CTAs
  `variant="info"`; goal CTAs stay `primary`. The finance `/design` page and the
  shell `DesignSystemPage` showcase the new variants.
- **AC-11 (shared atoms in forms).** Form controls use the shared atoms: no raw
  `<input` remains in `src/pages` or `src/components` (all use DS `Input`);
  form CTAs use DS `Button` (`variant="primary"`, destructive ones `danger`);
  `<select>` elements (no DS atom exists) carry the DS Input md class set
  (`bg-brand-800 … rounded-md`).

## Open questions

None blocking. Follow-up candidate: adopt DS `Button`/`FormField` inside the
page forms (out of scope here — tracked as future work).
