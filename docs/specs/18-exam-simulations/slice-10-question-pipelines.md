# Slice 10 — Offline question pipelines

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` §8, D-9, D-15
> Location: `~/Documents/studies/tools/questions/`, **outside every repo**. Inputs and outputs
> stay out of git, because they hold purchased content (D-9).
> Can start before the backend: it needs only the schema. Importing waits for slice 03.

## 1. Functional specification

### 1.1 Layout

```
~/Documents/studies/question-banks/
  raw/<source>/<set>.{txt,html}         # owner-saved review pages (td/, whizlabs/)
  json/<exam-key>/<source>-<set>.json   # converted + reviewed, FR-2 format
  runs/<exam-key>/…                     # logs, _status.txt, before-review copies
~/Documents/studies/tools/questions/
  exam-<key>.json        # per-exam config: classification names, known categories, key prefix
  validate_questions.py  # schema + BR-Q1–Q3 + extra pipeline checks
  convert_one.sh         # one headless session: raw set → JSON (model from the config)
  review_one.sh          # independent Sonnet review of one JSON
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
  - converted sets have `origin.set` and `origin.number` 1..n with no gaps;
  - every question has an `explanation`, which is required for purchased sets;
  - category names in a closed classification come from the config.
- Exits 1 and prints `path: rule: message` lines.

### 1.4 Conversion (purchased sets)

- **One session per raw file.** The model comes from `convertModel`.
- **Inputs:**
  - the raw file;
  - the config;
  - the FR-2 schema;
  - 2 few-shot examples: a single-choice question and a "(Choose two.)" question, with the
    reasoning for how each was recognized;
  - a hard rule: **the correct options come only from the page's explicit marking or its
    explanation; if neither is clear, emit nothing for that question and list its number as
    `unreadable`.**
- **Validation loop.** The validator runs, and on failure the session is retried with the
  errors appended, at most 2 retries. When a retry would be pointless (the information is
  absent), the result is reported as unreadable.
- **Review.** Then an **independent Sonnet review** with the raw file and the JSON:
  - the correct flags agree with the explanation;
  - all options were captured verbatim;
  - nothing was invented;
  - the categories are plausible.
  The reviewer edits only what is wrong, and reports `key: before → after`.
- **Run handling.** It stops on "hit your session limit" and is resumable, like the notes
  pipeline.

### 1.5 Pilot (D-15)

- The first TD set is converted by Haiku and by Sonnet.
- `pilot.py` compares the two JSONs question by question: correct-label set, option count,
  options text-equal after whitespace folding, explanation present. Both are then checked
  against the Sonnet **review** output, which is the reference.
- **Threshold.** Haiku is adopted for conversion when, against the reference:
  - **correct-label agreement is 100%**;
  - **option capture is ≥ 98%**.
  Otherwise `convertModel` becomes `sonnet`.
- The result and the numbers go to `runs/<exam>/pilot.md` and are reported to the owner.
- The same pilot also decides **`.txt` vs `.html` input**. Both are saved for the first set,
  and the format with the higher agreement wins.

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
  mutations plus a key gap and a missing explanation on a converted set. It prints each error
  with its path.
- **S10-2** A raw fixture written by the agent (6 questions, one of them with the correct
  marking removed) converts to 5 questions plus `unreadable: [n]`. Nothing is fabricated.
- **S10-3** The pilot on TD set 1 produces `pilot.md` with both models' agreement numbers and
  the adopted model, applying the §1.5 threshold.
- **S10-4** A run interrupted by the session limit resumes and converts only the missing or
  invalid sets.
- **S10-5** `import.py` without `--apply` never writes. With `--apply` and a report with
  errors, it refuses and exits 1.
