# Slice 07 — `QuestionView`, `media:` rendering and the new feature area

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-6 (rendering), FR-11, AC-22–AC-25, D-14
> Repo: `frontend` · App: `apps/afwilto-studies-web-ui`
> Test command: `pnpm --filter afwilto-studies-web-ui test`

## 1. Functional specification

### 1.1 The new feature area (D-14)

The studies MFE keeps its legacy layout (`src/{application,domain,di,features,hooks,
infrastructure,layouts,pages,router}`). The new code follows the 2026-10-21 MFE standard in
these folders only:

```
src/exams/domain/                 # types + pure rules: template choice, chooseCount, labels, pace
src/exams/application/ports/      # IExamsService + ExamsValidationError, ExamsConflictError…
src/exams/infrastructure/http/    # ExamsHttpAdapter
src/exams/infrastructure/memory/  # InMemoryExamsAdapter + devSeed (AWS text + moto images)
src/shared/ui/{atoms,molecules,organisms}/   # QuestionView and its parts (used by 3 features)
src/features/<use-case>/ui/…      # slices 08 and 09
```

- **Bridges between legacy code and the new area.** These are the only crossings allowed, and
  `test/exams.architecture.test.ts` enforces them:
  - the new area may import these legacy modules: `@/features/markdown/MarkdownView`, `@/di`
    and `@/hooks/useAsync`;
  - legacy code may import the new area **only** from `src/router/routes.tsx` (new pages),
    `src/di/container.ts` (new adapters) and `src/pages/Subject/SubjectPage.tsx` (a link
    only).
- **Inside the new area** the standard's rules 2 and 3 hold:
  - the atomic level order;
  - only pages call `useServices()`;
  - features never import each other;
  - `fetch(` appears only in `src/exams/infrastructure`.
- **`ServiceContainer`** gains `examsService: IExamsService`. It uses the HTTP adapter when
  `VITE_API_URL` is set and the InMemory adapter otherwise, the same rule as `studiesService`.

### 1.2 `media:` in the Markdown renderer (legacy change, minimal)

- `MarkdownView` gains an optional prop `resolveMediaUrl?: (sha256: string) => string | null`.
- `MarkdownImage` resolves `media:<64-hex>` through that prop. Without the prop, or when the
  prop returns `null`, it renders the `alt` text, as it does today for non-https images. Notes
  pass no resolver, so their behaviour does not change.
- `sanitizeSchema.ts` adds `media` to `protocols.src`, and react-markdown gets a `urlTransform`
  that keeps `media:` values and delegates everything else to the default transform.
- `ExamsHttpAdapter.mediaUrl(sha)` returns `${VITE_API_URL}/media/${sha}` (`VITE_API_URL` already
  ends in `/api/v1`, see `.env.development`). The InMemory adapter returns data URLs from its seed.

### 1.3 `QuestionView` (shared organism)

The props carry data only:

```ts
{ question: ViewQuestion,          // stem, type, chooseCount, options[{label, text?, image?, alt?}]
  selected: string[], onToggle(label), disabled?: boolean,
  reveal?: { correctLabels: string[], rationales: Record<label, string>, explanation?: string },
  resolveMediaUrl: (sha) => string | null }
```

- **Template choice.** `chooseTemplate(q)` in `src/exams/domain` is a pure function that
  returns `'text-list' | 'media-stem' | 'option-cards'`:
  - `option-cards` when any option has an `image`;
  - otherwise `media-stem` when the stem contains a `media:` image;
  - otherwise `text-list`.
- **Molecules:**
  - `OptionRow` (letter badge + `MarkdownView` text);
  - `OptionCard` (badge + 4:3 `object-contain` image + optional text);
  - `MediaFrame` (max-h 50vh, a zoom button opening the design-system `Dialog`, and a
    broken-image placeholder showing `alt` inside a bordered box);
  - `ChooseBadge` ("Elige N" + "k/N").
- **Atoms:** `LetterBadge` and `RevealMark`. `RevealMark` is an icon + text: "Correcta" ✓,
  "Tu respuesta" ✗, "Tu respuesta" ✓ when it is also correct.
- **Selection.**
  - `single` questions use `role="radiogroup"` with `role="radio"` items; `multi` questions use
    `role="group"` with `role="checkbox"` items, both with `aria-checked`.
  - In a `multi` question with k = N selected, the unselected options get `aria-disabled` and
    ignore clicks and keys.
- **Keyboard** while focus is inside the view: `1`–`6` toggle the matching option, the same as
  a click. `F`, `←`, `→` and `Enter` belong to the runner (slice 09) and are not handled here.
- **Layout.** T2 uses `flex flex-wrap` with `basis-[28rem] grow` and `basis-[22rem] grow`. T3
  uses `grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]`. No breakpoint pairs; the
  `twoTailwindBuilds` test is copied from the CIDR app and scoped to the new area.

## 2. Acceptance criteria

The parent's AC-22 to AC-25 apply, plus these:

- **S07-1** `chooseTemplate` table test: 5 cases, including a stem with an **https** image and
  text options, which is `text-list` because only `media:` counts, and mixed image and text
  options, which is `option-cards`.
- **S07-2** `MarkdownView` without a resolver renders `![x](media:<sha>)` as the text "x".
  With a resolver returning `/m/<sha>`, it renders `<img src="/m/<sha>" alt="x"
  loading="lazy">`. `javascript:` sources are still dropped.
- **S07-3** The existing note tests (`MarkdownView.test.tsx`, `NotePage.test.tsx`) pass
  unchanged.
- **S07-4** In a `single` question, clicking B and then C leaves only C `aria-checked`.
  Pressing `2` selects B.
- **S07-5** `disabled` (closed attempt, locked answer) ignores clicks and keys and keeps the
  current selection visible.
- **S07-6** `test/exams.architecture.test.ts` fails on:
  - a legacy page importing `@/exams/infrastructure`;
  - a new organism calling `useServices`;
  - `features/take-exam` importing `features/manage-exams`.
  Mutation check: each of the three plants makes it fail.
- **S07-7** `ExamsHttpAdapter` translates 422 into `ExamsValidationError` carrying the
  `details`, and 409 into `ExamsConflictError` carrying the `rule`. Callers never see a status
  code.

## 3. Test plan

| Test | Covers |
|---|---|
| `test/exams/chooseTemplate.test.ts` | S07-1 |
| `test/MarkdownView.media.test.tsx` | S07-2 (S07-3 via the existing suite) |
| `test/exams/QuestionView.test.tsx` | AC-22–AC-25, S07-4, S07-5 |
| `test/exams.architecture.test.ts`, `test/exams.twoTailwindBuilds.test.ts` | S07-6, layout rule |
| `test/exams/ExamsHttpAdapter.test.ts` | S07-7 |

## 4. Amendments

- 2026-10-22: `mediaUrl` no longer repeats `/api/v1` — `VITE_API_URL` already ends in `/api/v1`, so the original `${VITE_API_URL}/api/v1/media/${sha}` would request `/api/v1/api/v1/media/…`.
- 2026-10-23 (review of slices 07-09, coordinator decisions):
  - **Accepted bridges.** The legacy bridges of §1.1 (`MarkdownView`, `@/di`, `@/hooks/useAsync`) stay as specified. The review found them to be deviations from the standard (S1 pages call the legacy `useAsync`, S3 `MarkdownView` lives outside the new area); both are recorded as accepted, not defects.
  - **Standard check, atoms to organisms.** `test/exams.architecture.test.ts` also fails when an atom, molecule or organism of the new area imports `@/di` or `@/hooks/useAsync`: data fetching and the port hook belong to pages only.
  - **Pages and templates.** Every feature folder that has `ui/pages/` also has `ui/templates/`, and each page imports a template of its feature: pages orchestrate (data and handlers become template props), templates carry the layout.
  - **Exam images only from `media:`.** When `MarkdownView` gets a `resolveMediaUrl` (exam content), only `media:<sha256>` images render; an `https:` or any other image source renders its `alt` text. Notes pass no resolver, so they keep rendering `https:` images.
  - **Code is not a media image.** `splitMediaStem` ignores `![x](media:...)` inside fenced code blocks and inline code spans: such text stays in the stem as written and yields no image.
  - **Port errors by rule.** `ExamsHttpAdapter` maps a 409 by `error.code`/rule (`answer_locked`, `attempt_closed`, `attempt_expired`) and a 422 `invalid_text` or `range` to the domain errors even when `details` is empty.
