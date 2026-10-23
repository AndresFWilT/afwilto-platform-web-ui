# Spec 18 companion files

The question import format moved to the backend, which now holds the **single
canonical copy**:

- Schema: `backend/afwilto-studies-mngr/api/questions.schema.json`
- Examples: `backend/afwilto-studies-mngr/api/examples/`

The backend embeds them with `go:embed`, and the offline validator reads them from there.
The files that remain in this folder are the copies from before the move; do not edit them.
Parent spec: `../18-exam-simulations.md` (header, FR-2). Slice that moved them:
`slice-03-question-import.md` §1.1.
