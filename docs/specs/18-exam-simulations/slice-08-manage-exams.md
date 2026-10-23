# Slice 08 — Managing exams: list, form, import wizard, bank

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` §7 (management routes), FR-1, FR-3, FR-4 (UI)
> Repo: `frontend` · App: `apps/afwilto-studies-web-ui`

## 1. Functional specification

Routes, relative to `/studies`, with the pages in the new area:

| Path | Feature folder | Page |
|---|---|---|
| `subjects/:subjectId/exams` | `features/manage-exams` | `ExamsPage`: each exam with question count and last simulation score, plus **"Nuevo examen"** |
| `subjects/:subjectId/exams/new` | `features/manage-exams` | `NewExamPage`: 4 fields, defaults 65 / 130 / 72 |
| `exams/:examId` | `features/manage-exams` | `ExamOverviewPage`: parameters; classifications with categories, counts, weight (marked **inferido** or **manual**) and pace; "sin clasificar" count; history with the trend; actions Importar / Banco / Editar / Nuevo simulacro / Exportar / Eliminar |
| `exams/:examId/edit` | `features/manage-exams` | `ExamEditPage`: parameters; classification names; a primary swap; a weights table with a live sum (Σ = 100 enables save) plus "Volver a inferidos"; pace pairs; category rename; merge (choose from → into, then confirm) |
| `exams/:examId/import` | `features/import-questions` | `ImportWizardPage` |
| `exams/:examId/questions` | `features/browse-question-bank` | `QuestionBankPage` |

`SubjectPage` (legacy) gains a single **"Simulacros"** link to `subjects/:subjectId/exams`.
That is the only legacy page change, as allowed by slice 07.

**Import wizard** (one page, three steps; the state lives in the page):

1. **Archivo.** A file input (`.json`, `.zip`) and a size hint. Choosing a file sends a dry run.
2. **Reporte.** The report's sections are shown in this order:
   1. errors, grouped by rule, each with its path. When there are errors, "Importar" is
      disabled.
   2. counts (create / update / unchanged);
   3. new classifications. On a first import, a radio list sets `primary`, and changing it
      re-sends the dry run.
   4. new categories with their "se parece a" warnings;
   5. weights after;
   6. duplicate stems;
   7. media (missing / unused);
   8. a preview of the first 5 questions rendered with `QuestionView` in reveal mode.

   When there are new categories and the exam already has a manual weight mode, a callout
   explains that they get weight 0.
3. **Confirmar.** This sends the apply with the same file and `primary`. On success it shows a
   toast with the counts and navigates to `exams/:examId`. On a 422 it returns to step 2 with
   the new report.

**Question bank:**
- filters (category select per classification, origin set, difficulty, text search, "sin
  clasificar") kept in the URL query;
- a list of summaries;
- clicking a row opens the question in `QuestionView` reveal mode, with its rationales and
  explanation;
- a delete with confirmation.

## 2. Acceptance criteria

- **S08-1** "Nuevo examen" with an empty name shows a field error and sends no request. A 409
  `duplicate_name` shows "Ya existe un examen con ese nombre" on the name field.
- **S08-2** A dry-run fixture with 2 errors disables "Importar" and lists both paths. A fixture
  with 0 errors and 3 creates enables it.
- **S08-3** On a first import, changing the primary radio from "Dominio" to "Servicio" sends a
  second dry run with `primary=Servicio`.
- **S08-4** On the edit page, typing weights that sum to 99 shows "Suma: 99 / 100" and keeps
  save disabled. Reaching 100 enables save. "Volver a inferidos" sends `weightMode:"inferred"`.
- **S08-5** Merging "Storage" into "Amazon S3" asks for confirmation naming both, then sends
  `{from, into}` and refreshes the overview.
- **S08-6** The bank filter `?category=<id>&q=bucket` survives a reload, and the adapter is
  called with both filters.
- **S08-7** The overview marks each primary weight "inferido" or "manual", and shows "3 sin
  clasificar" when `unclassifiedCount = 3`.
- **S08-8** "Exportar" downloads from `exportUrl(examId)`, an anchor `href` built by the
  adapter, with no `fetch` in the UI.
- **S08-9** The legacy `SubjectPage` test asserts that the "Simulacros" link points to
  `/studies/subjects/<id>/exams`.

## 3. Test plan

Page tests run with `InMemoryExamsAdapter` through `ServiceProvider`. Report rendering uses
fixtures of `ImportReport`.

| Test | Covers |
|---|---|
| `test/exams/NewExamPage.test.tsx` | S08-1 |
| `test/exams/ImportWizardPage.test.tsx` | S08-2, S08-3, the confirm flow |
| `test/exams/ExamEditPage.test.tsx` | S08-4, S08-5 |
| `test/exams/QuestionBankPage.test.tsx` | S08-6 |
| `test/exams/ExamOverviewPage.test.tsx` | S08-7, S08-8 |
| `test/SubjectPage.test.tsx` (extended) | S08-9 |
