# Slice 09 — Taking exams: session form, runner, result

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` §7 (runner routes), FR-7–FR-10, D-11–D-13
> Repo: `frontend` · App: `apps/afwilto-studies-web-ui`

## 1. Functional specification

| Path | Feature folder | Page |
|---|---|---|
| `exams/:examId/start` | `features/take-exam` | `SessionSetupPage` |
| `attempts/:attemptId` | `features/take-exam` | `RunnerPage` |
| `attempts/:attemptId/result` | `features/review-attempt` | `ResultPage` |

**Session setup**

- **Simulacro real** is a card that shows the locked values: 65 preguntas · 130 min ·
  respuestas al final.
- **Personalizado** offers:
  - the selection: aleatorio N / por categorías (classification select → category
    multi-select → N or "todas") / set original (a select of the `origin.set` values);
  - timing: sin tiempo / con tiempo (a minutes field);
  - feedback: al final / después de cada pregunta.
- **Preview.** Every change calls `sessions/preview`, debounced by 300 ms. The page then shows
  "Hay 84 preguntas · se tomarán 20" and pre-fills the minutes with `suggestedMinutes`.
  - Once the owner edits the minutes, later previews **stop overwriting** the field. A
    "restablecer sugerido" link brings the suggested value back.
- **Shortages** from the preview disable "Empezar" and list each category as "faltan 8 en
  Seguridad".
- **Attempt in progress.** A 409 `attempt_in_progress` shows "Tienes un simulacro en curso" with
  **Continuar** (navigate to it) and no option to discard it.

**Runner**

- **Layout:**
  - a header with the exam name, "Pregunta k de N" and the countdown when timed;
  - the body is `QuestionView`;
  - a footer with Anterior / Siguiente, "Marcar para revisión" and Entregar;
  - the navigator is a wrapping grid of numbered cells. Its states are blank, answered, flagged
    and answered + flagged, each shown as icon + colour + an `aria-label` such as
    "Pregunta 7, respondida, marcada".
- **Saving.** Every toggle or flag change sends a `PUT`. While a save is in flight, the cell
  shows a spinner. A failed save keeps the local choice and shows a retry toast.
- **Timer.**
  - It counts down locally from `remainingSeconds` and resyncs from `GET` on window `focus`,
    on `visibilitychange` back to visible, and after every `PUT` response.
  - At 0 it calls `submit`. If the server already expired the attempt, it navigates to the
    result anyway.
  - **There is no pause control** (D-12).
- **Review mode (`each`).** After the first non-empty answer, the item shows the reveal (✓/✗,
  rationales, explanation) and becomes `disabled` (D-13). Flagging still works.
- **Keyboard:** `F` flags, `←`/`→` move between questions, and `Enter` goes to the next one.
  The `1`–`6` keys belong to `QuestionView`.
- **Submit.** "Entregar" with unanswered items asks "Te quedan 5 sin responder. ¿Entregar?" and
  then calls `submit` → result.
- **Resume.** Opening `attempts/:id` for an attempt in progress restores answers, flags and the
  current position. The position is kept in the URL as `?q=12`.

**Result**

- **Summary.** The score in %, with "Aprobado" or "No aprobado" for simulations only, and a note
  that this is the raw percentage, not the vendor's scaled score. Below that, correct out of
  total and the duration.
- **Breakdown.** One bar list per classification, weakest first. Each bar has a text label
  "Seguridad 12/20 (60%)".
- **Review list.**
  - Filters: Incorrectas (default) / Marcadas / Todas.
  - Each item renders `QuestionView` in reveal mode.
  - When `noteId` is present, "Ver nota" links to `/studies/notes/<noteId>`.
- **Navigation.** "Volver al examen" goes to `exams/:examId`, whose overview shows the history
  and the simulation-only trend (D-11, from slice 08).

## 2. Acceptance criteria

- **S09-1** Choosing por categorías VPC + Lambda with "todas" pre-fills 30 min. Editing it to 45
  and then adding S3 keeps 45. "restablecer sugerido" sets the new suggestion.
- **S09-2** A preview with shortages disables "Empezar" and lists them.
- **S09-3** With a fake timer, `remainingSeconds: 5` reaches 0 → `submit` is called once and
  the page navigates to the result.
- **S09-4** A `focus` event triggers `GET`. The server answers `remainingSeconds: 100` while the
  local clock showed 130, and the countdown shows 1:40.
- **S09-5** In review mode, answering B shows the reveal and further clicks don't change the
  selection. `F` still toggles the flag.
- **S09-6** The navigator cell for an answered, flagged item has `aria-label` "Pregunta 3,
  respondida, marcada".
- **S09-7** Reloading `attempts/:id?q=12` returns to question 12 with its answers restored.
- **S09-8** "Entregar" with 2 unanswered items shows the confirm with "2". Confirming → result.
- **S09-9** The result of a `random` attempt shows no pass/fail. A simulation shows
  "Aprobado" when `passed: true`.
- **S09-10** "Incorrectas" lists only items with `correct: false`, and an item with `noteId`
  has a "Ver nota" link.
- **S09-11** A start that answers 409 `attempt_in_progress` offers "Continuar" to the existing
  attempt id.

## 3. Test plan

These run with `InMemoryExamsAdapter`, which carries a controllable clock, and Vitest fake
timers.

| Test | Covers |
|---|---|
| `test/exams/SessionSetupPage.test.tsx` | S09-1, S09-2, S09-11 |
| `test/exams/RunnerPage.test.tsx` | S09-3–S09-8 |
| `test/exams/ResultPage.test.tsx` | S09-9, S09-10 |
| `test/exams/InMemoryExamsAdapter.behavioral.test.ts` | the same draw, deadline and scoring rules as the backend, on the AC-14/16/19/20 fixtures, so offline dev matches production |
