# Slice 01 — Contract, shared HTTP kit, exams skeleton

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` §10 · Repo: `backend/afwilto-studies-mngr`

## 1. Functional specification

This slice prepares studies-mngr to host a second bounded context. It delivers no behaviour
for exams yet:

1. **Contract v0.2.0.** `api/openapi.yaml` documents every endpoint and schema in parent §6:
   - the bodies of the new error rules;
   - the `ImportReport` shape (parent FR-4);
   - the multipart request of the import endpoint;
   - the `image/*` response of `GET /media/{sha256}`.
   It is the authoritative artifact for slices 02–06b.
2. **Shared HTTP kit.** The context-neutral pieces of `internal/studies/adapter/in/http` move to
   `internal/platform/httpx`:
   - the envelope writers (`writeData`, `writeList`, `writeError`, `errorBody`, `errorDetail`);
   - `decodeJSON`, `pathID` and `isUUID`;
   - every middleware (request log, recover, CORS, body limit, the JSON 404/405 fallback).

   Each context keeps its own `translateError`, because domain error types are not shared
   (D-10). This is a **refactor**: the existing suite must stay green without being edited,
   except for import paths.
3. **Composition.**
   - `httpx.NewServer(httpx.Config, registrars ...func(*http.ServeMux)) http.Handler` builds the
     mux, runs every registrar and wraps the result in the middleware chain.
   - `studieshttp.Register` registers the current routes.
   - `examshttp.Register` is an empty registrar for now.
   - `studieshttp.NewRouter` stays as a thin wrapper, so the existing tests keep compiling.
4. **Per-route body limit.**
   - `bodyLimitMiddleware` takes a default limit (`MAX_BODY_BYTES`) and per-pattern overrides.
   - `POST /api/v1/exams/{id}/questions/import` uses `MAX_IMPORT_BYTES`, default
     `53477376` (51 MiB: a 50 MiB zip plus multipart overhead).
5. **The `internal/exams` skeleton:**
   - `domain/doc.go` and `domain/errors.go`: `ErrNotFound`, `ValidationError`, `ConflictError`,
     and the rule constants of parent §6;
   - `app/port/{in,out}`, `app/usecase`, `adapter/in/http`, `adapter/out/postgres` with
     `doc.go` files.

**Non-goals:**
- No tables, no endpoints for exams, no frontend changes.

## 2. Business rules

None, since this is an infrastructure slice.

## 3. Acceptance criteria

- **S01-1** `api/openapi.yaml` loads and validates with kin-openapi. It is at version `0.2.0`
  and contains every path in parent §6, plus the error rules listed there in the
  `ErrorDetail.rule` description.
- **S01-2** After the move, `go test ./...` passes with the pre-existing test files changed only
  in their import lines (`git diff --stat` on `*_test.go` shows import edits only).
- **S01-3** **Context isolation.** A static test fails if any file under `internal/exams/**`
  imports `internal/studies/**`, or the reverse. Both may import `internal/platform/**`.
  Mutation check: planting such an import makes the test fail.
- **S01-4** **Exams domain purity.** A static test fails if `internal/exams/domain` imports
  anything outside an allowlist:
  - the studies stdlib allowlist, plus `math`, `math/rand/v2`, `crypto/sha256`, `encoding/hex`,
    `sort` and `unicode/utf8`;
  - `golang.org/x/text/unicode/norm`, `golang.org/x/text/runes` and
    `golang.org/x/text/transform`, needed for accent folding in slice 03.
- **S01-5** **Body limits.**
  - A 2 MiB body to `POST /api/v1/subjects` → 413 `payload_too_large`, as today.
  - The same 2 MiB body to a test handler registered on the import pattern is read in full.
  - A body of `MAX_IMPORT_BYTES + 1` to that pattern → `*http.MaxBytesError`.
- **S01-6** Config: `MAX_IMPORT_BYTES` defaults to 53477376 and can be overridden by its env
  var. A malformed value keeps the default, the same rule as `MAX_BODY_BYTES`.
- **S01-7** `GET /api/v1/subjects/{id}/exams` → 404 `not_found` envelope. It is documented but
  not registered yet, and the fallback still answers with JSON.

## 4. OpenAPI contract delta

`info.version: 0.2.0` adds the following, typed from parent §2:

- paths: every parent §6 endpoint;
- schemas: `Exam`, `ExamSummary`, `Classification`, `Category`, `QuestionSummary`, `Question`,
  `QuestionOption`, `ImportReport`, `SessionConfig`, `SessionPreview`, `Attempt`,
  `AttemptItem`, `AttemptResult`, `ReviewItem` and `AttemptSummary`.

## 5. Database changes

None.

## 6. Test plan

| Test | Kind | Covers |
|---|---|---|
| `adapter/in/http/contract_test.go` (studies, extended) | contract | S01-1 |
| existing studies suite | regression | S01-2 |
| `internal/platform/httpx/bodylimit_test.go` | unit | S01-5 |
| `internal/arch_test.go` | static | S01-3 |
| `internal/exams/domain/arch_test.go` | static | S01-4 |
| `configs/config_test.go` | unit | S01-6 |
| `internal/platform/httpx/server_test.go` | `httptest` | S01-7 |

## 7. Implementation notes

- Commit order:
  1. `refactor(studies): extract httpx kit`, green before and after.
  2. `test(exams): … red`.
  3. `feat(exams): …`.
- `golang.org/x/text` becomes a direct dependency. It is already in the module graph.
- `cmd/api/main.go` switches to `httpx.NewServer(cfg, studieshttp.Register(deps),
  examshttp.Register(examDeps))`.
