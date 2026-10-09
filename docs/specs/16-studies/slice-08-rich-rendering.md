# Slice 08 — Rich rendering: KaTeX, Shiki, Mermaid, sanitization, internal links

> Status: **Approved 2026-10-08** (owner chat; demo data via the API authorized for S08-14)
> Parent: `../16-studies.md` §11 Slice 08 (FR-4, FR-6, §9.3, §9.4; AC-F5, AC-F6, AC-F10,
> AC-F14)
> Backend: none.

## 1. Functional specification

The note page stops showing raw source (Slice 07, D-1) and renders the Markdown:

- `MarkdownView` renders GFM, inline and display math, highlighted code, Mermaid
  diagrams and links, all behind the sanitizer (parent §9.3).
- `CodeBlock` highlights fenced code with Shiki, loaded lazily. It falls back to plain
  monospace and always has a "Copy" button.
- `MermaidBlock` renders a ` ```mermaid ` fence to SVG with Mermaid, loaded lazily,
  in `strict` mode. Invalid source shows an inline error box.
- The note page gains a **"Related in slab"** section with the note's `slabLinks`, as
  router links.
- `MarkdownView` is a reusable component that takes `content: string`, so the Slice 09
  editor preview can reuse it unchanged.

**Non-goals:**
- No writes, editor or preview pane. Those are Slice 09.
- No raw HTML in Markdown. There is no `rehype-raw`, and raw HTML never becomes
  elements (parent §9.3).
- No images other than `https:`. No uploads.
- No draw.io, no heading anchors or table of contents, no note-to-note link
  resolution (parent §12).
- No backend change. The note page does not validate slab paths against slab's
  routes (parent §1.3).
- Library, subject and tag pages are unchanged (AC-F14).

## 2. Business rules

### 2.1 Pipeline (parent §9.3, MANDATORY)

`react-markdown` runs with
`remarkPlugins: [remark-gfm, remark-math]` and
`rehypePlugins: [[rehype-sanitize, studiesSchema], [rehype-katex, katexOptions]]`.
Sanitization runs **before** KaTeX, so KaTeX output is never sanitized away, and
nothing unsanitized reaches the DOM.

- **`studiesSchema` (pure, in `sanitizeSchema.ts`):** starts from `rehype-sanitize`'s
  `defaultSchema` (GitHub's) and adds only what the pipeline needs:
  - `className` on `code`: `language-*`, `math-inline` and `math-display`. Without
    these, remark-math nodes would lose their marker before KaTeX sees them.
  - Allowed protocols: `href` → `http`, `https`, `mailto`; `src` → `https`.
    Relative URLs (no scheme) pass, as in GitHub's schema.
  - Every `on*` attribute, `style`, `script`, `iframe`, `object`, `embed`, `form`,
    `input` (except GFM task-list checkboxes, which are `disabled`) stays forbidden.
    `defaultSchema` already enforces this, and tests pin it.
- **`katexOptions`:** `throwOnError: false`, `trust: false`, `strict: 'ignore'`, and
  `errorColor` set to the design-system error red (`#F87171`). An invalid formula
  renders its source in that color. The rest of the note still renders (FR-4).
- **Lone `$$…$$` is display math** (added during TDD).
  - The problem: `remark-math` v6 parses `$$E=mc^2$$` on one line as inline math, but
    the parent's own example (AC-B15/F5) and GitHub treat it as a display formula.
  - The fix: `remarkLoneDisplayMath`, a pure remark plugin that runs after
    `remark-math` and before `remark-rehype` and the sanitizer. A paragraph whose only
    child is an inline-math node written with `$$` becomes the same
    `pre > code.language-math.math-display` node that a multi-line `$$` block
    produces.
  - The rule applies at any depth (quotes, list items). `$$…$$` that shares its
    paragraph with text stays inline, and single-`$` math is unchanged.
  - The output still passes through `rehype-sanitize` before KaTeX.
- **KaTeX CSS** (`katex/dist/katex.min.css`) is imported by `MarkdownView`. It is
  therefore part of the note route's lazy chunk, not the library chunk.

### 2.2 Element mapping (`components` of react-markdown)

- **`a`:**
  - An `href` that starts with exactly one `/` (not `//`) becomes a router `<Link to>`.
    This is a client-side navigation, and it covers any internal route, not only
    `/slab` (FR-6).
  - `http:` / `https:` / `mailto:` becomes `<a target="_blank" rel="noopener
    noreferrer">`.
  - A protocol-relative `href` (`//host/...`) leaves the origin, so it is treated as
    external: `<a target="_blank" rel="noopener noreferrer">`. (Amended during TDD.)
  - Any other surviving `href` (a `#fragment` or a relative path without a leading
    `/`) becomes a plain `<a>` in the same tab.
  - An anchor whose `href` the sanitizer removed renders its children as text.
- **Footnotes (GFM, known limitation):** `react-markdown` 10 with `remark-gfm` 4
  emits the footnote reference but no definitions section in this pipeline, even
  without the sanitizer. A reference therefore renders as its plain superscript
  number, with no in-page link, so no anchor points at a missing id. Full footnote
  support is out of FR-4 scope. (Added after review, finding F7.)
- **`a` attributes:** `id`, `aria-*` and `data-*` that survive the sanitizer pass
  through on every link kind. Headings and list items keep their `id`.
- **`img`:** rendered only when `src` starts with `https://`. Otherwise its `alt`
  text renders as plain text. A relative or `http:` src never becomes a request.
  `loading="lazy"` and `referrerPolicy="no-referrer"` are set.
- **`pre > code` with `language-mermaid`** → `MermaidBlock` with the text content.
- **Any other `pre > code`** → `CodeBlock` with `lang` (the `language-*` suffix, or
  none) and the text content.
- **Inline `code`** stays inline monospace, with no highlighting and no copy button.
- Headings, paragraphs, lists, task lists, tables, blockquotes and `hr` get
  design-system Tailwind classes. No typography plugin is added.

### 2.3 `CodeBlock` (FR-4)

- **Shiki loading:** loaded on first use through `features/markdown/highlighter.ts`,
  the only module that imports Shiki, and only through `import()`.
  - It uses `shiki/core` with the **JavaScript regex engine**, so there is no WASM
    asset to fetch across the federation origin.
  - It uses the `github-dark` theme and exactly the 26 languages of parent FR-4. Each
    language is its own dynamic import, so only fences that are present get loaded.
  - The highlighter is a module-level singleton promise, shared by every block.
- **Language aliases:** the fence language is lower-cased. `shell` and `bash` map to
  Shiki's `shellscript`, and `plaintext` maps to Shiki's `text`. Every other language
  must be in the supported list.
  - An unknown or missing language renders plain monospace with no error, and Shiki is
    **not** loaded for it.
- **Before and after highlighting:** until highlighting finishes, or if it fails, the
  block shows the plain monospace source. A failure is logged with `console.warn`, and
  no error UI appears.
- **Output:** Shiki produces an HTML string from text-only input. It is injected with
  `dangerouslySetInnerHTML`. This is one of exactly **two** uses in the app; the other
  is the Mermaid SVG (§2.4). Both are the parent §9.3 exception: the output comes from
  a trusted library working on text only. S08-11 pins both sites. (Amended during
  TDD.)
- **Copy button:** every block has a "Copy" button (`aria-label="Copy code"`). It
  writes the **raw source** with `navigator.clipboard.writeText`.
  - After a success it shows "Copied" for 2 s.
  - If the clipboard is unavailable or rejects, it shows "Copy failed". It never uses
    `document.execCommand` or a native dialog.

### 2.4 `MermaidBlock` (FR-4)

- **Mermaid loading:** loaded on first use through `features/markdown/mermaid.ts`, the
  only module that imports Mermaid, and only through `import()`. It initializes once
  with `startOnLoad: false`, `securityLevel: 'strict'` and `theme: 'dark'`.
- **Rendering:** each block calls `mermaid.parse(source)` and then
  `mermaid.render(uniqueId, source)`.
  - The returned SVG is injected into the block's container. In `strict` mode Mermaid
    sanitizes its own output.
  - `uniqueId` comes from React `useId` and is made CSS-safe.
- **While loading:** a skeleton of fixed height, labelled "Rendering diagram…".
- **On error (parse or render):** an inline error box (`role="alert"`, error styling)
  with the error message and the original source in a `<pre>`. The rest of the note
  still renders, and other diagrams are not affected.
  - Any temporary element Mermaid left in `document.body` for that id is removed.

### 2.5 "Related in slab" (FR-6, AC-F10)

- **Empty case:** when `note.slabLinks` is empty, the section is not rendered at all.
- **Otherwise:** a section headed "Related in slab", placed after the content. It lists
  each link in stored order as a router `<Link to={path}>` with its `label`.
- **Navigation:** clicking a link changes the URL to the slab path with no full page
  reload. The shell's router then mounts the slab remote.
- **Standalone mode** (studies on its own at :3008): `/slab/*` is outside the app and
  redirects to `/studies`. This is accepted, because the platform entry is the shell.

### 2.6 Lazy loading (AC-F14)

- Library, subject and tag pages never import `features/markdown/*`. Only `NotePage`
  does.
- `shiki` and `mermaid` are never imported statically anywhere in `src/`. Every
  dynamic `import('shiki…')` lives in `highlighter.ts`, with one per language plus the
  core, engine and theme. Every `import('mermaid')` lives in `mermaid.ts`.
- In the production build, Shiki and Mermaid code lives in chunks that are not
  reachable through static imports from `remoteEntry.js`, the library page or the
  subject page.

## 3. Acceptance criteria

Parent criteria covered: **AC-F5, AC-F6, AC-F10, AC-F14.**

Slice-specific criteria:
- **S08-1** (AC-F5) Content with `$$E=mc^2$$` renders an element with class
  `katex-display` that contains a `.katex` element. Inline `$a^2$` renders `.katex`
  outside a display block.
  - An invalid formula `$\frac{1}{$` renders with the error color, and the paragraph
    after it still renders.
- **S08-2** (AC-F5) A ` ```go ` fence:
  - renders a `CodeBlock` that asks the highlighter for language `go`;
  - shows the highlighted HTML once it resolves (Shiki is mocked in jsdom);
  - has a "Copy code" button that writes the exact fence source to the clipboard and
    then shows "Copied".
- **S08-3** (FR-4) Language handling:
  - ` ```Shell ` asks for `shellscript`, and ` ```plaintext ` asks for `text`.
  - ` ```cobol ` and a fence without a language render plain monospace and never call
    the highlighter.
  - A highlighter rejection leaves plain monospace and shows no alert.
  - A clipboard rejection shows "Copy failed".
- **S08-4** (AC-F5) A valid ` ```mermaid ` fence renders the SVG returned by the mocked
  Mermaid. Mermaid was initialized with `securityLevel: 'strict'`.
  - An invalid fence (the mock rejects on `parse`) renders an alert box with the error
    message and the original source. The KaTeX formula and the paragraphs before and
    after it still render.
- **S08-5** (AC-F6) Rendering each payload below produces no `<script>`, no `<iframe>`,
  no attribute starting with `on`, and no `href` or `src` starting with `javascript:`
  or `data:`:
  - `<script>alert(1)</script>`;
  - `<img src=x onerror=alert(1)>`;
  - `[x](javascript:alert(1))`;
  - `[x](data:text/html,<script>alert(1)</script>)`;
  - `![x](javascript:alert(1))`;
  - `<iframe src="https://evil">`;
  - `<a href="https://x" onclick="alert(1)">x</a>`.

  The sanitizer is the real `rehype-sanitize` with `studiesSchema`; nothing is mocked.
- **S08-6** (AC-F6) `studiesSchema` unit tests:
  - `href` protocols are exactly `http`, `https` and `mailto`;
  - `src` protocols are exactly `https`;
  - `code` keeps `language-go`, `math-inline` and `math-display`, and drops
    `class="evil"`;
  - no `on*` or `style` attribute is allowed anywhere.
- **S08-7** Links:
  - `[lab](/slab/ud/operative-systems)` renders a link whose click changes the router
    location to `/slab/ud/operative-systems` (a router navigation in `MemoryRouter`).
  - `[ext](https://example.com)` has `target="_blank"` and `rel="noopener
    noreferrer"`.
  - `[proto](//evil.com)` is not a router link. It is an external anchor with
    `target="_blank"` and `rel="noopener noreferrer"`.
  - `[frag](#x)` is a plain same-tab anchor.
- **S08-8** Images: `![a](https://x/a.png)` renders an `<img>` with
  `loading="lazy"`. `![b](http://x/b.png)` and `![c](./c.png)` render the alt text and
  no `<img>`.
- **S08-9** (AC-F10) The note page lists "Related in slab" links in order. Clicking
  one changes the location to its path, and the app's root element is never
  remounted, which proves there was no full page reload. A note without links has no
  such section.
- **S08-10** GFM: a table renders `<table>`. `- [ ] a` / `- [x] b` render disabled
  checkboxes, the second one checked. `~~s~~` renders `<del>`. A bare URL autolinks
  as an external link.
- **S08-11** (AC-F14) Static guards over `src/`:
  - no static `import … from 'shiki'` / `'mermaid'` (or their subpaths);
  - dynamic `import('shiki…')` appears only in `highlighter.ts`, and
    `import('mermaid')` only in `mermaid.ts`;
  - `dangerouslySetInnerHTML` appears only in `CodeBlock.tsx` and `MermaidBlock.tsx`;
  - no file under `pages/Library`, `pages/Subject` or `pages/Tag` imports
    `features/markdown`.
- **S08-12** (AC-F14) Build check (amended after review):
  - When `STUDIES_CHUNK_REPORT=1` is set, a small Vite plugin (`chunkModuleReport`)
    writes every output chunk's `moduleIds`, static `imports` and `dynamicImports`
    to `node_modules/.cache/studies-chunk-report.json`. That file is outside `dist/`,
    so the module graph is never served. No Vite manifest is emitted.
  - `test/build/checkChunks.mjs` classifies chunks by the **modules they contain**,
    not by their names. Shiki or Mermaid code inlined into an app chunk or a shared
    chunk is therefore caught.
  - It asserts that no chunk holding Shiki or Mermaid is in the static closure of
    `remoteEntry.js`, the `App` entry, `LibraryPage`, `SubjectPage` or `TagPage`.
  - It also asserts that both libraries exist in some chunk reached by a dynamic
    import, so the check cannot pass vacuously.
  - It runs as `pnpm --filter afwilto-studies-web-ui build:check`.
- **S08-13** Every earlier test stays green.
  - NotePage tests that asserted the raw-source `<pre>` (S07-8) are replaced by the
    rendered equivalents. The XSS case moves to S08-5.
  - Typecheck is clean.
  - `build` emits `remoteEntry.js`.
- **S08-14** **Manual (recorded in §8)**, inside the shell at `localhost:3000`, on a
  note created through the API:
  - KaTeX renders with its fonts loaded from :3008;
  - a Go block is highlighted;
  - a Mermaid diagram renders and an invalid one shows the error box;
  - a slab link navigates without a reload.

  The network panel shows the Shiki and Mermaid chunks fetched only when the note page
  opens.

## 4. Contract delta — none

## 5. Database changes — none

## 6. Test plan

| Layer | File | Covers |
|---|---|---|
| pure | `test/sanitizeSchema.test.ts` | S08-6 |
| component (real pipeline) | `test/MarkdownView.test.tsx` | S08-1, S08-5, S08-7, S08-8, S08-10 |
| component (Shiki mocked at `highlighter.ts`) | `test/CodeBlock.test.tsx` | S08-2, S08-3 |
| component (Mermaid mocked at `mermaid.ts`) | `test/MermaidBlock.test.tsx` | S08-4 |
| loader (the `mermaid` library mocked) | `test/mermaidLoader.test.ts` | S08-4: strict init once, parse before render, temporary node cleanup |
| loader (pure part) | `test/highlighter.test.ts` | S08-3: language resolution table over all 26 languages |
| page | `test/NotePage.test.tsx` (updated) | S08-9, S08-13 |
| static | `test/lazyBoundaries.test.ts` | S08-11 |
| build | `vite.config.ts` `chunkModuleReport` + `test/build/checkChunks.mjs` + `build:check` script | S08-12 |

Mocks stay at our own loader modules (`highlighter.ts`, `mermaid.ts`), not inside the
libraries. The loaders are thin, so the module boundary is the seam. KaTeX and
`rehype-sanitize` run for real in jsdom.

## 7. Implementation notes

- **New dependencies (this remote only), exact versions at least two weeks old:**

  | Package | Version |
  |---|---|
  | `react-markdown` | `10.1.0` |
  | `remark-gfm` | `4.0.1` |
  | `remark-math` | `6.0.0` |
  | `rehype-katex` | `7.0.1` |
  | `katex` | `0.16.x` (rehype-katex's own range, so the CSS matches the engine and there is one copy) |
  | `rehype-sanitize` | `6.0.0` |
  | `shiki` | `4.4.3` (2026-08-10; 4.5.0 is too recent) |
  | `mermaid` | `11.17.2` (12.x is a new major from September) |
- **Files:** `src/features/markdown/`, containing:
  - `MarkdownView.tsx`;
  - `CodeBlock.tsx`;
  - `MermaidBlock.tsx`;
  - `sanitizeSchema.ts`;
  - `highlighter.ts`;
  - `mermaid.ts`;
  - `links.tsx` (the `a` / `img` mapping).

  `NotePage` swaps the `<pre>` for `<MarkdownView content={note.content} />` and adds
  the slab section.
- **Risk to verify in S08-14:** CSS and fonts from a lazy chunk of a federated remote.
  The KaTeX CSS and its `woff2` fonts must resolve against :3008, not against the
  shell's origin.
  - If they resolve against the shell's origin, set Vite `base` (or the federation
    plugin's public path) to the remote's own URL for the production build.
  - That fix stays inside this remote, and the decision is recorded in §8.

## 8. Verification record

**2026-10-08**

- **Red phase.** 87 tests failed on stubs before any implementation.
- **Mid-TDD finding.** A one-line `$$E=mc^2$$` rendered inline. This led to
  `remarkLoneDisplayMath` (§2.1); its tests were red first.
- **Green.** 252 studies tests pass, every other workspace suite is unchanged and
  green, and typecheck is clean.
- **Build check.** `pnpm --filter afwilto-studies-web-ui build:check` reports
  `checkChunks OK: 100 of 157 chunks hold shiki/mermaid; none in the static closure of 5 roots`.
  - Proven non-vacuous: a static `import { bundledLanguagesInfo } from 'shiki'`
    added to `LibraryPage` fails the check, and so does `import mermaid from
    'mermaid'`. The first of these passed the old manifest-based check.
- **Independent review.** A fresh instance found no exploitable XSS path. It reported
  vacuous or missing coverage and minor defects:
  - **F1:** the sanitizer could be removed or swapped for `defaultSchema` with the
    suite still green. Fixed with `xmpp:`/`irc:` payloads that only `studiesSchema`
    blocks.
  - **F2:** KaTeX `trust: false` was untested. Fixed with `\htmlClass`, `\href` and
    `\includegraphics` cases.
  - **F3:** the slab-link order was untested. Fixed by giving a fixture two links.
  - **F4 and F5:** the build check classified chunks by name and skipped
    `remoteEntry`. Fixed by the module-content report (S08-12).
  - **F6:** an empty fence rendered `[object Object]`. Fixed.
  - **F7:** footnote links dangled. Handled as the documented limitation in §2.2.
  - **F8:** the Vite manifest was served publicly. Removed.
  - **F9:** spec drift. The §2.1 amendment covers it.
- **Mutation re-check** (scratch script, files restored afterwards). Of 17
  mutations, 16 are killed. They cover:
  - every review finding;
  - the pipeline order;
  - the error colour;
  - the lone-`$$` plugin;
  - router versus anchor links, including protocol-relative ones;
  - Mermaid strict mode and cleanup;
  - the `shell` alias;
  - copying source rather than HTML;
  - the empty slab section.

  The survivor, "allow `http:` images in `MarkdownImage`", is equivalent: the schema
  already strips `http:` `src`, and the guard's remaining job, blocking relative
  `src`, is tested.
- **Deployment checks over HTTP.** The KaTeX CSS and `woff2` fonts are served from
  :3008 with `Access-Control-Allow-Origin: *`. The lazy CSS is resolved with
  `new URL(dep, import.meta.url)`, so it points at :3008. No Vite `base` change was
  needed.
- **Demo data (owner-authorized):**
  - category "Demo" (`01a11e74-3d87-7c3b-a0d2-f91ddccdf6d3`);
  - subject "Rich rendering demo" (`01a11e74-3d93-7638-905d-f5c0d4e72f04`);
  - note "Markdown showcase" (`01a11e74-3d97-71f0-874f-a4a4a213bfb9`).
- **S08-14 browser check (owner, 2026-10-08).** The demo note at `localhost:3000`
  showed everything as expected:
  - KaTeX, with the invalid formula in red;
  - Go and Python highlighted, and `cobol` as plain text, each block with "Copy";
  - the Mermaid diagram, plus the error box for the invalid one;
  - "Round robin lab" navigating without a reload;
  - fonts and the Shiki and Mermaid chunks served from :3008.

  The owner confirmed "todo se ve bien".
  **S08-14 closed.**
