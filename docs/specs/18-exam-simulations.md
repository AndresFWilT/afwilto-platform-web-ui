# Spec 18 — Exam simulations ("practice exams") for any subject

> **UI language: English (owner, 2026-10-26); content is never translated.** Every user-visible
> string of the exams area (labels, buttons, toasts, confirms, aria-labels, empty states, validation
> and error messages, shortage labels, import warnings) is English. Exam names, question text,
> classification/category names, notes and subject names are user data and stay as written. The
> strings quoted below are the English ones; "Practice Exams" is the user-facing name of the
> feature (a "full simulation" is the real-exam mode of a practice exam).
>
> Status: **Approved 2026-10-22** (owner chat). OQ-1..OQ-6 were resolved and moved to the decisions
> log (§13). Approving the module spec also covers the roadmap slices in
> `18-exam-simulations/slice-*.md` (§10), as with Spec 16.
> Owner: afwilto · Created: 2026-10-22 · Revision 2 (2026-10-22): rewritten as a generic
> building block that is not tied to AWS. Questions are loaded from a JSON file; categories and
> weights are inferred from it; presentation templates are added.
> Depends on: `16-studies.md` (studies-mngr :8084, studies MFE :3008), `backend/CLAUDE.md`
> Companion files: `18-exam-simulations/questions.schema.json` (import format, JSON Schema
> 2020-12) and `18-exam-simulations/examples/`. Slice 03 moves both into the backend as
> `backend/afwilto-studies-mngr/api/questions.schema.json` and `api/examples/`, which become
> the **single canonical copy**: the backend embeds it, and the offline validator reads it from
> there. The copies here are then replaced by a pointer.

---

## 0. Context

| Inherited decision | Source | Consequence here |
|---|---|---|
| Subjects live in a category tree and can hold anything: AWS SAA, Diving Course 1, Moto 1 | Spec 16 FR-1/FR-2 | An exam hangs off **any subject**; nothing is AWS-specific |
| Go hexagon, Postgres 17, logical delete enforced by triggers, `version` on edits, JSON error envelope | Spec 16 §5–§8 | New bounded context `internal/exams` in the **same service and the same DB** |
| Markdown renderer: GFM + KaTeX + Shiki + Mermaid, `rehype-sanitize` with `src: ['https']` | Spec 16 §9.3, `features/markdown/sanitizeSchema.ts` | Question stems, options and explanations reuse `MarkdownView`. Images need a `media:` scheme (FR-6). |
| Body limit 1 MiB (`MaxBytesError` → 413) | studies-mngr `middleware.go` | Only the import endpoint gets a larger, separate limit (FR-5) |
| Disk storage adapter `fsstore` | certifications-mngr `adapter/out/fsstore` | Reused behind a `MediaStorage` port for question images |
| No auth, single user | Spec 00 §10 | Same |

How commercial practice tests are organized (owner research, 2026-10-22):

- **Tutorials Dojo:** timed sets, review sets, randomized, section-based, topic-based and
  flashcards. **The timed and review sets are the same questions**; the mode only changes the
  clock and when feedback appears.
- **Whizlabs:** full practice tests of 65 questions / 130 min, short section tests (5–10
  questions, 10–25 min), a final test, and "build your own".

Both are **one bank viewed in different ways**. This spec builds that bank and the views, for
any subject.

---

## 1. Product vision

### 1.1 Purpose

Every subject can have one or more **exams**. Each exam has a **question bank**, loaded
mainly by importing a JSON file. The categories and weights of the bank are **inferred from
that file** and then fine-tuned in a form. Whoever takes the exam builds a **session** by
making three independent choices: which questions, timed or not, and when to see the answers.
The real simulation is one fixed combination of those choices.

Examples (the moto and diving figures are illustrative, not sourced):

| Subject | Exam | Real simulation | Classifications (inferred from the JSON) |
|---|---|---|---|
| Certified Solutions Architect Associate | SAA-C03 | 65 questions · 130 min · 72% | "Dominio" (4, weights 30/26/24/20 fixed by hand from the exam guide), "Servicio" (VPC, S3, Lambda…) |
| Diving Course 1 | Open Water — teoría | 50 · 45 min · 75% | "Módulo" (Física, Fisiología, Equipo, Planificación), weights inferred |
| Moto 1 | Teórico A2 | 30 · 30 min · 90% | "Tema" (Señales, Normas, Mecánica), mostly image questions |

### 1.2 MVP scope

1. **Exams (CRUD) per subject.** An exam has a name and real-simulation parameters (question
   count, time limit, pass %). Its categories and weights can be edited in the form.
2. **Question import** from `.json`, or from `.zip` with images:
   - a dry-run report before anything is written;
   - all-or-nothing apply;
   - idempotent upsert by `key`.
3. **Category inference** from the imported questions:
   - up to 2 named classifications per exam;
   - categories are created, reused, renamed or merged;
   - weights are inferred, or fixed manually.
4. **Images**, stored by content hash and referenced as `media:` in Markdown and in options.
5. **Sessions** combine three independent choices: selection × timing × feedback. The
   suggested time is computed from the pace of each category.
6. **Attempts:**
   - each one freezes a snapshot of its questions;
   - the deadline is enforced by the server;
   - questions can be flagged and are listed in a navigator;
   - attempts can be resumed;
   - scoring gives a breakdown per category;
   - the review shows every answer with its explanations.
7. **Presentation templates** chosen automatically from the content: text list, media stem,
   or option cards (FR-11).
8. **Bank browser:** filter questions, preview them with the same templates, and delete
   them logically.
9. **Export** of an exam's bank in the import format, so files round-trip.
10. **History** of attempts per exam.

### 1.3 Non-goals (MVP)

- **No leaked real-exam questions ("dumps").** Questions come from the owner's notes, from the
  owner's own writing, or from practice tests the owner purchased. Purchased content stays in
  the local DB, and the raw files stay in `~/Documents/studies/question-banks/`, **never in
  git**, and are never shared. This follows the same rule as the course slides.
- **No in-app AI.** The MFE and studies-mngr never call a model. Generation and conversion are
  offline pipelines (§8).
- **No UI editor for single questions.** You fix a question by re-importing it with the same
  `key`; the bank browser can only delete. An editor is future work (§12).
- **No vendor scaled scoring.** The score is the raw percentage with a configurable pass mark,
  and the UI says so. For example, AWS reports 100–1000 with 720 to pass, and that scale is not
  linear.
- **No partial credit.** A multi-select answer is right only when the set matches exactly.
- **No question types beyond single and multi.** Ordering, matching, hotspot and case-study
  questions are future work.
- **No spaced repetition and no adaptive selection** in the MVP (§12).
- **No per-question layout override.** The template is always derived from the content (FR-11).
- No SVG, video or audio media. No auth, no multi-user.

---

## 2. Domain model (`internal/exams/domain`)

```
Subject (Spec 16) 1─* Exam 1─* Classification (≤2) 1─* Category
Exam              1─* Question 1─* QuestionOption
Question          *─* Category          (≤1 in the primary classification)
Question/Option   *─* Media             (by sha256, via media: refs)
Exam              1─* Attempt 1─* AttemptItem   (frozen snapshot)
```

| Entity | Fields |
|---|---|
| `Exam` | `id`, `subjectId`, `name` (1–120, unique among alive exams of the subject), `questionCount` (1–200), `timeLimitMin` (1–600), `passPercent` (1–100), `version`, timestamps, `deletedAt` |
| `Classification` | `id`, `examId`, `name` (1–40, e.g. "Dominio"; unique per exam, case- and accent-insensitive), `position` (0 = **primary**, 1 = secondary), `weightMode` (`inferred` \| `manual`; only meaningful on the primary) |
| `Category` | `id`, `classificationId`, `key` (slug of the name), `name` (1–80), `weightPercent` (primary only), `paceQuestions?` + `paceMinutes?` (the time reference, e.g. 10 questions in 20 min), `deletedAt` |
| `Question` | `id`, `examId`, `key` (unique among alive questions of the exam), `type` (`single` \| `multi`), `stem` (Markdown ≤ 10,000), `explanation?` (Markdown ≤ 20,000), `difficulty?`, `sourceKind` + `sourceName` (from the file's `source`), `origin?` (`set`, `number`, `noteRef`), `stemFingerprint` (hash of the normalized stem, used for duplicate warnings), `version`, timestamps, `deletedAt` |
| `QuestionOption` | `questionId`, `position` (0..5 → labels A..F), `text?`, `image?` (`media:<sha256>`), `alt?`, `correct`, `rationale?` |
| `Media` | `sha256` (PK), `contentType` (`image/png` \| `image/jpeg` \| `image/webp`), `bytes`, `width`, `height`, `createdAt` |
| `Attempt` | `id`, `examId`, `config` (JSONB, FR-7), `status` (`in_progress` \| `submitted` \| `expired`), `startedAt`, `deadlineAt?`, `submittedAt?`, `scorePercent?`, `passed?`, `seed` |
| `AttemptItem` | `attemptId`, `position`, `questionId`, `snapshot` (JSONB: stem, options in their displayed order with correct flags, explanation, categories), `selected[]`, `flagged`, `answeredAt?`, `correct?` |

**Snapshot.** An attempt freezes its questions as they were when it started. A later
re-import or delete never changes how a past attempt scores or reviews. Media is stored by
content hash and never deleted, so the snapshots keep resolving their images.

---

## 3. Functional requirements

### FR-1 Exams (CRUD)
- Create an exam with 4 fields: name, question count, time limit and pass %. The form defaults
  are 65 / 130 / 72.
- Edit those fields. In the same form you can also:
  - rename a classification;
  - set the primary weights, which switches `weightMode` to `manual` (FR-3);
  - set the pace of a category;
  - rename categories;
  - merge two categories of the same classification. The questions move to the category that
    stays, and the other one is deleted logically.
- Logical delete. An exam with alive questions is blocked (`in_use`), like Spec 16 BR-DEL1.
- Spec 16 BR-DEL1 is extended: a subject with alive exams can't be deleted either (BR-E3).

### FR-2 Import format (`questions.schema.json`)
- The top level is `format: "afwilto-questions"`, `formatVersion: 1`, an optional
  `source {kind, name}`, and `questions[]` (1–2,000 items).
- Each question has:
  - `key`, `type` and `stem`;
  - an optional `source {kind, name}` that overrides the file-level one, used by exports of
    mixed banks;
  - `options[]` (2–6), each with `text` and/or `image` + `alt`, `correct`, and an optional
    `rationale`;
  - optional `explanation`, `difficulty`, `categories` and `origin` (`origin.number` is a whole number from 1 to 1,000,000).
- **`categories` is keyed by classification name and lists category names:**
  `{ "Dominio": ["Alto rendimiento"], "Servicio": ["Amazon S3", "CloudFront"] }`.
- Option letters are never in the file. They come from the order of `options`.
- Images are referenced as `media:<path inside the zip>`, both in Markdown
  (`![alt](media:img/r101.png)`) and in `option.image`.

### FR-3 Category inference
Inference runs on every import, in the dry run and in the apply.

1. **Classifications.**
   - Classification names are matched against the exam's alive classifications, ignoring case,
     accents and surrounding spaces.
   - An unknown name creates a new classification.
   - **An exam has at most 2 classifications.** A third one fails the import (BR-C1).
   - On the first import into an empty exam, the wizard lists the detected classifications and
     the owner chooses the primary one, which is sent as `primary=<name>` on the import call.
     By default it is the first classification, in order of first appearance in the file, that
     every question uses with at most one value. Once the exam has a primary, `primary` is
     ignored.
2. **Categories.**
   - Category names are matched within their classification the same way.
   - An unknown name creates a category, with `key = slug(name)`.
   - The report lists every new category. When a new name is within Levenshtein distance ≤ 2 of
     an existing one, or has the same slug, the report adds a warning:
     *"Alto rendimeinto" se parece a "Alto rendimiento"*.
   - The import never merges categories on its own.
3. **Primary classification.**
   - Each question has **at most 1** category in it (BR-C2).
   - Questions with no primary category are counted as **"unclassified"**.
4. **Weights.**
   - With `weightMode = inferred`, each primary category weighs its share of the alive
     classified questions. The shares are rounded to integers with the largest-remainder method
     so they sum to 100, and they are recomputed after every import or delete.
   - With `weightMode = manual`, the weights are fixed. A category created later gets weight 0,
     and the report warns: *"\"<name>\" is not part of the full simulation until you assign it a weight"*.
5. **Pace.**
   - A category without `paceQuestions/paceMinutes` uses the exam pace,
     `timeLimitMin / questionCount` (for example 130 / 65 = 2 min per question).

### FR-4 Import endpoint
- `POST /api/v1/exams/{id}/questions/import?dryRun=true|false` takes a `multipart/form-data`
  `file` (`.json` ≤ 10 MiB, or `.zip` ≤ 50 MiB).
- Validation runs in this order, and every error carries a JSON path:
  1. the file and the zip are safe (FR-6);
  2. the JSON parses;
  3. it matches the JSON Schema;
  4. the semantic rules hold (BR-Q*, BR-C*);
  5. every `media:` reference exists in the zip.
- **Dry run** writes nothing and returns:
  - `create`, `update`, `unchanged` and `invalid` counts, with keys;
  - `errors[] {path, rule, message}`;
  - `newClassifications[]` and `newCategories[]` with their similarity warnings;
  - `weightsAfter[]`, the primary weights as they would be;
  - `duplicateStems[]`: a new key whose `stemFingerprint` equals an alive question's. This
    catches TD timed and review sets imported twice.
  - `media {referenced, inZip, missing[], unused[]}`;
  - `preview[]`: the first 5 questions, as they will be stored.
- **Apply** runs in one transaction and is **all or nothing**. Any error writes nothing and
  returns 422 with the same report.
- **Upsert by `key`.**
  - A matching key with different content updates the question and increments `version`.
  - A matching key with identical content is `unchanged`.
  - Questions missing from the file are **not** deleted, because import is additive.

### FR-5 Export
- `GET /api/v1/exams/{id}/questions/export` returns a `.zip` with `questions.json` (the FR-2
  format) and `img/<sha256>.<ext>`.
- Re-importing the export into the same exam reports every question as `unchanged`. The
  guarantee holds for exams with 1–2,000 questions (the import limit); an empty exam exports an
  empty list, which the import rejects.

### FR-6 Media
- **The zip is checked before anything is read.**
  - At most 1,000 entries and 100 MiB uncompressed.
  - No absolute paths, no `..`, no symlinks.
  - Exactly one `.json` at the root.
- **Images:**
  - The type is detected from the magic bytes, never from the extension.
  - Only PNG, JPEG and WebP, ≤ 2 MiB each and ≤ 4096 px per side.
  - SVG is rejected.
- **Storage.**
  - The file is stored once per `sha256` through the `MediaStorage` port, which reuses the
    `fsstore` disk adapter.
  - The stored Markdown and options hold `media:<sha256>`. Export reverses this.
- **Serving.**
  - `GET /api/v1/media/{sha256}` returns the original content type with
    `Cache-Control: public, max-age=31536000, immutable` and `X-Content-Type-Options: nosniff`.
- **Rendering.**
  - The renderer allows the `media:` scheme in `src`, through the sanitize schema and
    react-markdown's `urlTransform`.
  - It resolves `media:<sha>` to `${VITE_API_URL}/media/<sha>` (`VITE_API_URL` already ends in `/api/v1`) in one place, the `img`
    component.
  - Stored content never holds a host, so it survives changes of port or domain.

### FR-7 Session configuration (what the taker chooses)

| Choice | Options |
|---|---|
| **Selection** | `simulation` (the real simulation: `questionCount` drawn by primary weight) · `random` (N from the whole bank) · `categories` (N at random, or all, from the chosen categories of one classification) · `origin-set` (exactly one original set, e.g. "TD Timed Set 3", in its original order) |
| **Timing** | `untimed` · `timed` (`timeLimitMin` prefilled by FR-8 and editable, 1–600) |
| **Feedback** | `end` (exam mode: nothing is revealed before submit) · `each` (review mode: correctness, rationales and explanation after each answer) |

- `simulation` locks the other two choices: `timed` with the exam's `timeLimitMin`, and `end`
  feedback.
- The other selections allow any combination. For example, all 312 questions, untimed, with
  feedback after each one.
- The page shows the pool size for the current choice: *"Hay 84 preguntas en VPC + S3"*.

### FR-8 Suggested time
- **pace(category)** = `paceMinutes / paceQuestions`, or the exam pace if the category has no
  pace of its own.
- **pace(question)** = the largest pace among its categories in the classification used for
  selection. For `simulation` and `random` that is the primary classification. A question
  without a category there uses the exam pace.
- **Suggested time** = `ceil(Σ pace(question))` over the drawn questions.
- For `simulation`, the time is always the exam's `timeLimitMin`.

### FR-9 Starting an attempt
- **Draw.**
  - Questions are drawn without replacement, driven by a stored `seed`. The same seed and the
    same bank give the same draw.
  - `simulation` sets the count per primary category to `questionCount × weight / 100`,
    apportioned by largest remainder.
  - "Unclassified" questions and categories with weight 0 are never drawn in a simulation.
- **Shortage.** If a category has fewer alive questions than its quota, the start fails with
  422 `insufficient_questions`, listing `{category, needed, available}` for each one.
- **Order.**
  - Questions are shuffled, except for `origin-set`, which keeps `origin.number` order.
  - Options are always shuffled. The displayed order is stored in the snapshot, and labels are
    reassigned A, B, C… in that order.
- **Deadline.** A timed attempt sets `deadlineAt = startedAt + timeLimitMin`.
- **One at a time.** There is at most 1 `in_progress` attempt per exam. Starting another
  returns 409 `attempt_in_progress` with its id, so the UI can offer "Continue".

### FR-10 Answering, submit and scoring
- **Answering.**
  - `PUT /api/v1/attempts/{id}/items/{position}` with `{selected: ["B","D"], flagged}`.
    Answers can be changed until the attempt closes.
  - A `multi` question accepts at most N selected options, where N is its number of correct
    options. More than N returns 422 `too_many_selected`.
  - With `end` feedback, responses **never** include `correct`, `rationale`, `explanation` or
    the correct labels before the attempt closes.
  - With `each` feedback, the response to an answer includes them, and the answer locks for
    that item.
- **Deadline.**
  - The server enforces the deadline with a 5 s grace period. A later write returns 409
    `attempt_expired`.
  - Expiry is finalized lazily, on the next read or write, and scores whatever was answered.
    No background job is needed.
  - `GET` on an attempt returns `remainingSeconds`, computed by the server.
- **Scoring.**
  - Score = correct / total, where an unanswered item counts as wrong.
  - `passed = score ≥ passPercent`. Only `simulation` attempts show pass/fail; the other kinds
    show the score only.
  - The breakdown covers each classification, by category: `{correct, total, percent}`, with
    the weakest first.
- **Review** returns every item with its snapshot, the selected answer, the correct labels, the
  rationales and the explanation. It also links to the source note when `origin.noteRef`
  matches an alive note title of the subject.
- **History** lists every attempt per exam, newest first: date, selection, timing, feedback,
  score, passed and duration.
- **The trend line uses `simulation` attempts only** (D-11). Practice attempts appear in the
  history but not in the trend.
- **No pause** (D-12). The deadline is absolute; leaving and coming back resumes with less
  time.

### FR-11 Presentation templates (read side)

The runner, the result review, the bank browser and the import preview all render a question
with **one component, `QuestionView`**. It chooses a template from the content alone. The file
never declares it.

| Template | When | Layout |
|---|---|---|
| **T1 · text-list** | No option has an `image` and the stem has no image | Stem (Markdown) above a vertical list of option rows: a letter badge, then the option Markdown. This is the TD/Whizlabs look. |
| **T2 · media-stem** | The stem has ≥ 1 image and no option has an image | The stem image is in a media frame (max height 50 vh, `object-contain`, click to zoom). The frame and the option list sit side by side when there is room (`flex-wrap`, frame `basis-[28rem] grow`, list `basis-[22rem] grow`) and stack otherwise. |
| **T3 · option-cards** | **Any** option has an `image` | The stem goes above a card grid (`grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]`). Each card has a letter badge, an image in a fixed 4:3 box (`object-contain`), and its text below if present. Options without an image become text cards of the same size. |

**Rules shared by all templates:**

- **Selection controls.**
  - `single` questions behave as a radio group; `multi` questions behave as a checkbox group
    with an **"Choose N"** badge and a counter, such as "1/2".
  - Once N options are selected, the others are disabled until one is deselected.
- **States.**
  - In exam mode, only *selected* and *flagged* are shown.
  - In review mode and in the result review:
    - the correct option is marked ✓, and a wrong selection is marked ✗;
    - each mark uses an icon, a colour **and** text, never colour alone;
    - each option shows its rationale;
    - the explanation follows below.
- **Images.**
  - `alt` is always rendered as the image's `alt`.
  - Images load lazily.
  - Zoom opens the design-system `Dialog`.
  - A broken image shows its `alt` inside a bordered placeholder.
- **Keyboard.** `1`–`6` select an option, `F` flags, `←`/`→` navigate, and `Enter` goes to the
  next question.
- **Layout.** Intrinsic only: `flex-wrap` and `auto-fill` grids, with no breakpoint pairs. See
  the "two Tailwind builds" rule in `frontend/CLAUDE.md`.
- **Navigator.** A grid of numbered cells in four states: blank, answered, flagged, and both.
  The states use the same icon + colour + text rule.

---

## 4. Business rules

| ID | Rule | Error |
|---|---|---|
| BR-E1 | Exam name is unique among alive exams of the subject | 409 `conflict`, rule `duplicate_name` |
| BR-E2 | `1 ≤ questionCount ≤ 200`, `1 ≤ timeLimitMin ≤ 600`, `1 ≤ passPercent ≤ 100` | 422 `validation_failed` |
| BR-E3 | An exam with alive questions can't be deleted, and a subject with alive exams can't be deleted (extends Spec 16 BR-DEL1) | 409 `conflict`, rule `in_use` |
| BR-C1 | At most 2 classifications per exam | 422, rule `too_many_classifications` |
| BR-C2 | At most 1 category per question in the primary classification | 422, rule `primary_single_valued` |
| BR-C3 | Manual weights on the primary are integers from 0 to 100 that sum to 100 | 422, rule `range` (a weight outside 0–100, checked before summing) or `weights_sum` |
| BR-C4 | Pace is set as a pair: both `paceQuestions` and `paceMinutes` (each 1–10,000), or neither | 422, rule `pace_pair` (not a pair) or `range` (a value outside 1–10,000) |
| BR-C5 | A merge requires two alive categories of the same classification | 422, rule `merge_scope` |
| BR-Q1 | `single`: exactly 1 correct option. `multi`: 3–6 options, at least 2 correct and at least 1 wrong. | 422, rule `correct_count` |
| BR-Q2 | Every option has `text` or `image`; `image` requires `alt` | 422, rule `option_content` |
| BR-Q3 | `key` is unique within the file and matches `^[a-z0-9][a-z0-9._-]{0,99}$` | 422, rule `duplicate_key` / `pattern` |
| BR-Q4 | Every `media:` reference resolves to an image in the zip, or to an existing sha256 on re-import | 422, rule `media_missing` |
| BR-I1 | An import is all or nothing | 422 with the full report |
| BR-A1 | One `in_progress` attempt per exam | 409, rule `attempt_in_progress` |
| BR-A2 | Writes after `deadlineAt` + 5 s are rejected, and the attempt is finalized as `expired` | 409, rule `attempt_expired` |
| BR-A3 | Submitted or expired attempts are immutable | 409, rule `attempt_closed` |
| BR-A4 | Feedback `end` never exposes correctness before close | contract test |
| BR-A5 | A `multi` answer selects at most N options | 422, rule `too_many_selected` |

---

## 5. Acceptance criteria

**Import and inference**

- **AC-1** An empty exam imports `examples/aws-text.json`. The dry run reports 3 `create`, 2
  new classifications ("Dominio", "Servicio"), and the new categories with their names. Nothing
  is written.
- **AC-2** The same file is applied, then re-imported. The second dry run reports 3
  `unchanged`, 0 new categories, and no `duplicateStems`.
- **AC-3** A question has `"Dominio": ["Alto rendimeinto"]` while "Alto rendimiento" exists.
  The report lists "Alto rendimeinto" as a new category with a similarity warning naming
  "Alto rendimiento".
- **AC-4** A file has 3 valid questions and one `single` with 2 correct options. The apply
  returns 422 with an error at `questions[3].options` and rule `correct_count`, and the DB is
  unchanged.
- **AC-5** A question has `"Dominio": ["Seguridad", "Costos"]` and "Dominio" is primary. The
  import is rejected with `primary_single_valued`.
- **AC-6** In inferred mode the primary categories hold 5, 3 and 3 questions. The weights are
  45, 27 and 27 (raw 45.45 / 27.27 / 27.27), and the largest remainder brings them to
  **46 / 27 / 27**.
- **AC-7** Manual weights are 30/26/24/20, and an import adds a new category "Migración". The
  existing weights are unchanged, "Migración" gets 0, and the report warns about it.
- **AC-8** A key is imported again with edited text. The question keeps its id and its
  `version` goes up by 1. A past attempt that used it still shows the old text.
- **AC-9** A new key has the same normalized stem as an alive question, differing only in case
  and whitespace. It appears in `duplicateStems` and is still created; this is a warning, not
  an error.

**Media**

- **AC-10** A `.zip` contains `questions.json` and `img/r101.png`, and a stem has
  `![Señal](media:img/r101.png)`. After the import, the stored stem holds `media:<sha256>`
  and `GET /media/<sha256>` returns `image/png` with the immutable cache headers.
- **AC-11** The same image is used by 40 questions. One `Media` row and one file are stored.
- **AC-12** A zip contains an entry `../evil.png`, or a referenced `.png` whose bytes are an
  SVG. It is rejected before anything is written. Unreferenced entries are never inspected or
  stored and are listed in `media.unused`.
- **AC-13** A stem references `media:img/missing.png`. The dry run lists it under
  `media.missing`, and the apply returns 422 with rule `media_missing`.

**Sessions and attempts**

- **AC-14** The exam has 65 questions / 130 min, manual weights 30/26/24/20, and enough
  questions. A `simulation` gets quotas of 19.5 / 16.9 / 15.6 / 13.0. The floors are
  19 / 16 / 15 / 13 = 63, and the 2 remaining go to the largest fractions (.9, then .6), giving
  **19 / 17 / 16 / 13** = 65, timed 130 min with `end` feedback.
- **AC-15** A domain needs 20 questions and has 12. The start returns 422
  `insufficient_questions` with `{category, needed: 20, available: 12}`.
- **AC-16** `categories` = VPC (pace 10 questions / 20 min) + Lambda (4 / 10), taking all 14
  questions. The suggested time is **30 min**. Taking 7 at random that come out as 5 VPC +
  2 Lambda, the **start** response's `suggestedMinutes` is ⌈5×2 + 2×2.5⌉ = **15 min**. The
  preview, which runs before the draw, estimates N × the mean pace (slice 06a).
- **AC-17** The same seed on an unchanged bank gives the same questions and the same option
  order.
- **AC-18** With `end` feedback, a `PUT` answer returns `{position, selected, flagged}` only.
- **AC-19** `deadlineAt = T`. A `PUT` at T+4 s returns 200. A `PUT` at T+6 s returns 409
  `attempt_expired`, and the attempt is `expired` and scored.
- **AC-20** A `multi` question has correct `{B,D}`. `{D,B}` is right; `{B}`, `{B,D,E}` and `{}`
  are wrong. Sending `{A,B,D}` returns 422 `too_many_selected`.
- **AC-21** An `origin-set` session on "Timed Set 3" presents its questions in `origin.number`
  order.

**Presentation (component tests)**

- **AC-22** Text options and a text stem render **T1**. A stem image with text options renders
  **T2**. Any option image renders **T3**, and text-only options in the same question become
  text cards.
- **AC-23** A `multi` question with N = 2 shows "Choose 2". After 2 selections the other options
  are disabled, and pressing `3` on a disabled option does nothing.
- **AC-24** In the review, a correct option shows ✓ plus the text "Correct", and a wrong
  selection shows ✗ plus "Your answer". The DOM assertion checks the text, not the colour.
- **AC-25** A broken image renders its `alt` inside the placeholder.

---

## 6. REST API (sketch — the contract goes into `api/openapi.yaml` once approved)

| Method & path | Purpose |
|---|---|
| `GET / POST /api/v1/subjects/{id}/exams` | list (with question counts) / create |
| `GET / PATCH / DELETE /api/v1/exams/{id}` | detail with classifications, categories, weights, pace and counts / edit (`version`) / logical delete |
| `POST /api/v1/exams/{id}/categories/merge` | `{from, into}` |
| `POST /api/v1/exams/{id}/questions/import?dryRun=` | FR-4 (multipart) |
| `GET /api/v1/exams/{id}/questions/export` | FR-5 |
| `GET /api/v1/exams/{id}/questions?category=&origin=&difficulty=&q=` | bank browser summaries |
| `GET / DELETE /api/v1/questions/{id}` | full question / logical delete |
| `GET /api/v1/media/{sha256}` | image bytes |
| `POST /api/v1/exams/{id}/sessions/preview` | `{config}` → pool size and suggested time (FR-7/8), with no side effects |
| `POST /api/v1/exams/{id}/attempts` | start `{config, seed?}`; finalizes the exam's open attempt first when it is past `deadlineAt` + 5 s (slice 06b) |
| `GET /api/v1/attempts/{id}` | state and `remainingSeconds`; `result` too once the attempt is closed (slice 06b) |
| `PUT /api/v1/attempts/{id}/items/{position}` | answer and flag; returns `remainingSeconds` on timed attempts (slice 06b) |
| `POST /api/v1/attempts/{id}/submit` | close and score |
| `GET /api/v1/attempts/{id}/review` | review (only after close, or for answered items with `each` feedback) |
| `GET /api/v1/exams/{id}/attempts` | history |

New error rules, a closed set and the slice that introduces each:

| Rules | Slice |
|---|---|
| `range` | 02, 03, 04 |
| `json`, `schema`, `file_type`, `too_many_classifications`, `primary_single_valued`, `correct_count`, `option_content`, `duplicate_key`, `media_missing`, `invalid_text` | 03 |
| `weights_sum`, `pace_pair`, `merge_scope` | 04 |
| `zip_entries`, `zip_size`, `zip_path`, `zip_layout`, `media_type`, `media_size`, `media_dimensions` | 05 |
| `insufficient_questions`, `locked_by_simulation`, `attempt_in_progress` | 06a |
| `attempt_expired`, `attempt_closed`, `too_many_selected`, `invalid_label`, `answer_locked` | 06b |

---

## 7. Frontend (studies MFE, routes relative to `/studies`)

| Path | Page |
|---|---|
| `subjects/:subjectId` | Existing (legacy) page plus a **"Practice Exams"** link only |
| `subjects/:subjectId/exams` | Exams of the subject: question counts, last simulation score, "New exam" |
| `subjects/:subjectId/exams/new` | 4-field form |
| `exams/:examId` | Overview: classifications, categories with counts, weights and pace; history with a trend; **"New practice exam"** |
| `exams/:examId/edit` | Form: parameters, classification names, weights with a live sum, pace, rename and merge |
| `exams/:examId/import` | Wizard: upload → dry-run report (errors, new categories and warnings, weights after, duplicates, media, 5-question preview via `QuestionView`) → choose the primary (first import only) → confirm |
| `exams/:examId/questions` | Bank browser: filters, `QuestionView` preview, delete |
| `exams/:examId/start` | Session form: the three choices, a live pool size and suggested time (`sessions/preview`), and an editable time field |
| `attempts/:attemptId` | Runner: `QuestionView`, navigator, server-synced countdown, flag, keyboard |
| `attempts/:attemptId/result` | Score, pass/fail (simulation only), per-category bars per classification, review list (wrong / flagged / all) |

- The runner resyncs `remainingSeconds` on focus and after each answer.
- Closing the tab is safe, because every answer is saved as it is given.
- The new code lives in a new feature area. Whether it follows the 2026-10-21 MFE standard
  inside a grandfathered app is OQ-5.

---

## 8. Offline pipelines (`~/Documents/studies/tools/`, headless Claude, out of git)

Both pipelines first read `GET /exams/{id}` and pass the existing classification and category
names to the model, so they reuse names instead of inventing near-duplicates. Both end in a
dry run and then apply through FR-4. A shared `validate_questions.py` uses the **same**
`questions.schema.json`, plus the semantic rules BR-Q1–Q4.

1. **From purchased practice tests.**
   - The owner saves each set's review page as text in
     `~/Documents/studies/question-banks/raw/<source>/<set>.txt`. The review page includes the
     explanations.
   - **Haiku** converts each file to the FR-2 format and fills `origin {set, number}`.
   - Validation runs next. A failure is retried with the errors appended.
   - **An independent Sonnet session** then reviews the result:
     - the correct flags agree with the explanation;
     - every option was captured;
     - the categories make sense.
   - TD timed and review sets are imported **once**, and `duplicateStems` confirms it.
2. **From the subject's notes.**
   - **Sonnet** generates K questions per note, each with `origin.noteRef`.
   - **An independent Sonnet session** reviews them: each must be answerable from the note
     alone, have exactly one defensible answer set, and have plausible distractors with
     rationales.

---

## 9. Testing strategy (TDD, as Spec 16 §10)

- **Domain unit tests:**
  - question invariants (BR-Q1/Q2);
  - category matching and slugging (case and accents);
  - Levenshtein warnings (AC-3);
  - largest-remainder apportionment (AC-6, AC-14) as table tests, including all-equal shares
    and zero weights;
  - pace and suggested time (AC-16);
  - seeded draw (AC-17);
  - multi scoring (AC-20).
- **Use-case tests with a fake clock:** deadline and grace (AC-19), lazy expiry, BR-A1/A3,
  feedback gating (AC-18).
- **Import tests:**
  - the schema test runs against `examples/*.json`, which must stay valid;
  - malicious zip fixtures (AC-12);
  - atomicity (AC-4);
  - idempotence (AC-2, AC-8).
- **Postgres adapter tests:** snapshot immutability; a merge moves the questions.
- **HTTP contract tests:** media headers (AC-10); the error envelope for the new rules.
- **MFE tests:**
  - `QuestionView` template selection and states (AC-22–25);
  - the runner with an InMemory adapter: navigator, flag, resume, timer resync;
  - the import wizard rendering a dry-run report fixture.

---

## 10. Delivery slices (`18-exam-simulations/slice-NN-*.md`)

Each slice is a red commit followed by a green commit, as in Spec 16.

| # | Repo | Slice | Covers |
|---|---|---|---|
| 01 | studies-mngr | Contract, shared HTTP kit, exams skeleton | §6 contract v0.2.0, context boundary, per-route body limit |
| 02 | studies-mngr | Exams CRUD | FR-1 (parameters), BR-E1–E3 |
| 03 | studies-mngr | Question import: JSON, dry run and apply | FR-2, FR-3, FR-4 (no zip), BR-Q*, BR-C1/C2, BR-I1, AC-1–9 |
| 04 | studies-mngr | Bank and category editing | bank browser API, rename/weights/pace/merge, BR-C3–C5 |
| 05 | studies-mngr + lab root | Media and export | FR-5, FR-6, BR-Q4, AC-10–13, compose media volume |
| 06a | studies-mngr | Session preview and attempt start | FR-7, FR-8, FR-9, AC-14–17, AC-21 |
| 06b | studies-mngr | Answering, deadline, scoring, review and history | FR-10, BR-A1–A5, AC-18–20 |
| 07 | frontend | `QuestionView` and `media:` rendering | FR-11, AC-22–25, the standard for the new feature area (D-14) |
| 08 | frontend | Managing exams: form, import wizard, bank | §7 management routes |
| 09 | frontend | Taking exams: session form, runner, result, history | §7 runner routes, D-11–D-13 |
| 10 | offline tooling | Question pipelines | §8, the Haiku pilot (D-15) |

**Slice 10 can start right after approval.** It needs only the schema to produce validated
JSON; importing that JSON waits for slice 03.

---

## 11. Rollout for the existing material

- SAA-C03:
  - create the exam (65 / 130 / 72);
  - import the TD and Whizlabs sets;
  - set the manual weights 30/26/24/20 on "Dominio";
  - generate the gaps from the 30 SAA notes.
- AIF-C01 and SCS-C03: the same steps, with their exam guides.

---

## 12. Future (not MVP)

1. A single-question editor in the UI.
2. Weak-area practice, built from questions missed in the last N attempts.
3. Spaced repetition (FSRS) for each question.
4. Ordering, matching, hotspot and case-study question types.
5. Per-question statistics: % correct, average time, "always right" flag.
6. Flashcard mode over the same bank (TD-style).
7. A "Generate questions from this note" button. It needs an API key in studies-mngr, which
   is a new secret.

---

## 13. Decisions log (owner chat, 2026-10-22)

| # | Decision |
|---|---|
| D-1 | Generic building block: an exam hangs off any subject, and nothing is fixed to AWS or SAA-C03 |
| D-2 | Questions arrive as a JSON file (a zip with images) that the backend parses and stores |
| D-3 | The file holds **only questions**. Classifications, categories and weights are **inferred** from it, and the form becomes the editor to adjust them. |
| D-4 | Weights can't be derived from the source: they are inferred by default and set manually for certifications with an official guide |
| D-5 | At most 2 classifications per exam, with names chosen freely (e.g. "Dominio" + "Servicio", or "Módulo") |
| D-6 | A session is selection × timing × feedback; the real simulation is a locked combination |
| D-7 | The topic time is a placeholder entered as "N questions in M min". The suggested time sums the pace of the drawn questions, so taking all the questions of the chosen topics equals the sum of their times. |
| D-8 | Images are in the MVP, in a zip. The presentation template is chosen automatically from the content (T1/T2/T3). |
| D-9 | Purchased practice tests are allowed for personal use, kept local and out of git; leaked real-exam questions are not |
| D-10 | (OQ-1) Exams live in a new bounded context `internal/exams` inside studies-mngr, in the same DB. Neither `internal/exams` nor `internal/studies` imports the other; the shared HTTP helpers move to `internal/platform`. |
| D-11 | (OQ-2) Practice attempts appear in the history, but the trend line plots `simulation` attempts only |
| D-12 | (OQ-3) Exam mode can't be paused: the deadline is absolute |
| D-13 | (OQ-4) In review mode (`each`), an item's answer locks once its feedback is revealed |
| D-14 | (OQ-5) The studies MFE keeps its legacy layout, but the new feature area follows the 2026-10-21 MFE standard with an architecture test scoped to it (slice 07) |
| D-15 | (OQ-6) Before converting everything, one TD set is converted by both Haiku and Sonnet and the results are compared. Haiku is used for conversion only if it meets the slice 10 threshold. |

## 14. Open questions

None at approval. New questions found during the slices go into the slice's spec and are
folded back here.
