# Slice 10 — Offline question pipelines

> Status: Approved 2026-10-22 (module approval covers the roadmap slices). Amended 2026-10-22
> after reading the first real TD set: §1.1, §1.4, §1.5, S10-2, S10-3 (see §3).
> Parent: `../18-exam-simulations.md` §8, D-9, D-15
> Location: `~/Documents/studies/tools/questions/`, **outside every repo**. Inputs and outputs
> stay out of git, because they hold purchased content (D-9).
> Can start before the backend: it needs only the schema. Importing waits for slice 03.

## 1. Functional specification

### 1.1 Layout

```
~/Documents/studies/question-banks/
  raw/<source>/<set>.txt                # owner-saved review pages (td/, whizlabs/)
  json/<exam-key>/<source>-<set>.json   # converted + reviewed, FR-2 format
  runs/<exam-key>/…                     # logs, _status.txt, before-review copies
~/Documents/studies/tools/questions/
  exam-<key>.json        # per-exam config: classification names, known categories, key prefix
  validate_questions.py  # schema + BR-Q1–Q3 + extra pipeline checks
  split_<source>.py      # deterministic: raw set → skeleton JSON (stems, options, explanations verbatim)
  label_one.sh           # one headless session: skeleton → labels (model from the config)
  merge_labels.py        # skeleton + labels → FR-2 JSON
  review_one.sh          # independent Sonnet review of the labels
  generate_one.sh        # Sonnet: one note → K questions
  pilot.py               # D-15 comparison
  import.py              # dry run → print the report → apply on --apply
```

### 1.2 Per-exam config (example `exam-saa.json`)

```json
{ "key": "saa", "examId": null,
  "classifications": { "Dominio": ["Diseño de arquitecturas seguras", "Diseño de arquitecturas resilientes",
                                   "Diseño de arquitecturas de alto rendimiento", "Diseño de arquitecturas optimizadas en costos"],
                       "Servicio": "free" },
  "categoryMap": { "td": { "CSAA - Design Secure Architectures": "Diseño de arquitecturas seguras", … } },
  "keyPrefix": { "td": "td-saa", "whizlabs": "wz-saa", "notes": "gen-saa" },
  "convertModel": "haiku" }
```

- A `"free"` classification lets the model name categories, preferring names that already
  exist.
- A list closes the classification: anything outside it is reported, never forced into it.
- Once `examId` is set, the scripts refresh the known names from `GET /exams/{id}` before each
  run.

### 1.3 `validate_questions.py <file.json>`

- Reads the **canonical** schema: `backend/afwilto-studies-mngr/api/questions.schema.json`
  once slice 03 has moved it, and the spec copy until then.
- Checks BR-Q1–Q3 again.
- **Pipeline-only checks:**
  - each key matches `^<prefix>-<set-slug>-\d{3}$`;
  - converted sets have `origin.set`, and `origin.number` values that are unique within the set
    (gaps are allowed: they are the unreadable questions);
  - every question has an `explanation`, which is required for purchased sets;
  - category names in a closed classification come from the config.
- Exits 1 and prints `path: rule: message` lines.

### 1.4 Conversion (purchased sets)

The structure of a purchased set is extracted **by code**, and a model only labels it.

- **Split (deterministic).** `split_<source>.py <raw> --set "<name>" --config exam-<key>.json`
  writes a skeleton: per question `number`, stem, options and explanation **verbatim**, and the
  primary category from the config's `categoryMap` (the vendor's domain heading → the exam's
  category name). It drops the vendor's per-attempt result columns (`(view)`, points, time).
  It fails loudly (exit 1, question number) when a block does not match the source layout, so
  a layout change never produces a silently broken set.
  - TD layout: blocks start at a line `^\d+\t$`; the stem runs to the `(view)` line; options
    are the following lines that start with a space; the explanation is the rest of the block;
    `Category: <heading>` lines set the domain for the blocks that follow. TD shows the correct
    answer **only inside the explanation**, never on the options.
  - A new source gets its own splitter, written from its first saved set.
- **Label (model).** One session per raw set; the model comes from `convertModel`. Input: the
  skeleton. Output, via `--json-schema` structured output, one entry per question:
  `{number, correct: ["A".."F"] | null, services: [names], evidence}` where `evidence` is the
  shortest explanation excerpt that justifies `correct`.
  - **Hard rule:** `correct` comes only from the explanation (or an explicit marking). When the
    explanation does not settle it, `correct` is `null` and the question is listed as
    `unreadable`. Nothing is guessed.
  - `services` names the AWS services (or the exam's second classification) the question tests,
    preferring names from the config's known list. Up to 3.
- **Merge.** `merge_labels.py` builds the FR-2 file: `type` is `multi` when `correct` has ≥ 2
  labels, `categories` = `{primary: [domain], secondary: services}`, keys
  `<prefix>-<set-slug>-NNN`, `origin {set, number}`. Unreadable questions are left out and
  listed. The validator runs on the result.
- **Review.** An **independent Sonnet review** gets the skeleton and the labels and checks every
  `correct` against the explanation and every `services` list for plausibility. It edits only
  what is wrong, and reports `number: before → after`.
- **Run handling.** It stops on "hit your session limit" and is resumable, like the notes
  pipeline.

### 1.5 Pilot (D-15)

- The first TD set is labelled by Haiku and by Sonnet from the same skeleton.
- **Reference** for correct labels, per question:
  - the deterministic answer sentence when it resolves: the explanation's "correct answer(s)
    is/are: <text>" (or "these are the correct answers:" followed by option texts) matched to
    exactly the option(s) with that text;
  - otherwise the independent Sonnet review's verdict.
- `pilot.py` reports, against the reference: correct-label agreement for each model, the
  questions where they differ, unreadable counts, and option capture (skeleton options vs raw
  option lines, expected 100% by construction).
- **Threshold.** Haiku is adopted for labelling when its **correct-label agreement is 100%**.
  Otherwise `convertModel` becomes `sonnet`.
- The result and the numbers go to `runs/<exam>/pilot.md` and are reported to the owner.
- **Input format: `.txt`.** The `.html` copy could not be saved, and the `.txt` already carries
  the answer inside the explanation, so the `.txt` vs `.html` comparison is dropped.

### 1.6 Generation from notes

- **One Sonnet session per note.** K = `clamp(round(chars / 2500), 5, 12)`.
- Every question carries `origin.noteRef = "<note title> (diap. N)"` and must be answerable from
  the note alone.
- An independent Sonnet review checks for exactly one defensible answer set and plausible
  distractors with rationales.

### 1.7 Import

`import.py <exam-key> <file.json> [--apply]` uploads through the slice 03 endpoint. It prints
the dry-run report and applies only with `--apply` and no errors.

## 2. Acceptance criteria

- **S10-1** The validator passes both spec examples and rejects 12 mutations: the 10 schema
  mutations plus a duplicated origin number and a missing explanation on a converted set. It prints each error
  with its path.
- **S10-2** A raw TD-layout fixture written by the agent (not purchased content): 3 questions,
  one of them "(Select TWO.)", one whose explanation does not name the answer. The splitter
  yields 3 skeletons with verbatim stems, options and explanations and the mapped domain. The
  reference matcher resolves 2 of them and returns "unresolved" for the third. A block with no
  option lines makes the splitter exit 1 naming the question number. Merging labels where one
  `correct` is `null` yields 2 questions plus `unreadable: [n]`. Nothing is fabricated.
- **S10-3** The pilot on the first TD set produces `pilot.md` with both models' agreement numbers
  and the adopted model, applying the §1.5 threshold.
- **S10-4** A run interrupted by the session limit resumes and converts only the missing or
  invalid sets.
- **S10-5** `import.py` without `--apply` never writes. With `--apply` and a report with
  errors, it refuses and exits 1.

## 3. Amendment log

- **2026-10-22.** The first saved TD set (65 questions) showed a fully regular layout and no
  correct-answer marking on the options: the answer appears only in the explanation. Conversion
  was split into a deterministic extractor plus model labelling, so stems, options and
  explanations are verbatim by construction and the pilot measures only the judgement the model
  actually makes. The `.html` input was dropped because the owner could not save it and the
  `.txt` was sufficient.
