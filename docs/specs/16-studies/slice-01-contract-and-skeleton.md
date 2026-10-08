# Slice 01 — Contract & Skeleton

> Status: Approved 2026-10-07 (module-spec approval covers the roadmap slices)
> Parent: `../16-studies.md` §11 Slice 01

## 1. Functional specification

Stand up `backend/afwilto-studies-mngr` (Go, :8084) as a running service with no
business endpoints yet. The slice delivers:

- health endpoints;
- config;
- the `forbid_hard_delete()` database function;
- Dockerfile;
- compose entries (`studies-db`, `studies-mngr`);
- a smoke probe;
- the full OpenAPI 3.1 contract (v0.1.0), as the authoritative artifact for slices
  02–06.

The service is a new, independent git repository, like every other backend manager.
The lab root `.gitignore` lists it.

**Non-goals:**
- No business endpoints.
- No tables: the first table lands in Slice 02, together with its no-delete trigger.
- No frontend changes.

## 2. Business rules

None, since this is an infrastructure slice. The `forbid_hard_delete()` function is
the enforcement mechanism for parent FR-0. The tables that use it arrive in later
slices.

## 3. Acceptance criteria

- **AC-B25** `docker compose up -d studies-db studies-mngr` brings up `studies-db`
  (healthy) and then `studies-mngr`.
  - `curl localhost:8084/healthz` → 200 `{"data":{"status":"ok"}}`.
  - `/readyz` → 200 when the DB answers a ping, 503 `{"error":{"code":"internal",…}}`
    otherwise.
  - `scripts/smoke.sh` probes `:8084/healthz`.
- **AC-B26** The domain-purity test fails if any file under `internal/studies/domain`
  imports anything outside the stdlib allowlist (`errors`, `fmt`, `strings`, `time`,
  `unicode`, `regexp`, `slices`).
- **S01-1** After `migrate up`, the function `forbid_hard_delete()` exists. A table
  with a `BEFORE DELETE … EXECUTE FUNCTION forbid_hard_delete()` trigger:
  - rejects `DELETE` with SQLSTATE `23001` (`restrict_violation`), and the message
    names the table;
  - still accepts `TRUNCATE`.
  `migrate down` removes the function.
- **S01-2** The static guard: a test fails if any non-test `.go` file under
  `internal/studies/adapter/out/postgres` contains a SQL `DELETE` statement. This is
  the static half of parent AC-B24, active from day one.
- **S01-3** `api/openapi.yaml` loads and validates with kin-openapi. It documents
  every endpoint in parent §7. `GET /healthz` and `GET /readyz` responses recorded
  from the real router conform to it.
- **S01-4** Config defaults:
  - `PORT=8084`
  - `ALLOW_ORIGINS=http://localhost:3000,http://localhost:3008`
  - `MAX_BODY_BYTES=1048576`
  - `MIGRATE_ON_START=true`

  Each one can be overridden by its env var. `MIGRATE_ON_START` accepts any
  `strconv.ParseBool` value (`1`, `TRUE`, …); a malformed value keeps the default.
- **S01-6** Router fallbacks use the JSON error envelope:
  - an unknown path → 404 `not_found`;
  - a known path with the wrong method → 405 `method_not_allowed`, with the `Allow`
    header kept.
- **S01-7** A body-limit middleware wraps every request body in
  `http.MaxBytesReader(MAX_BODY_BYTES)`. Reading past the limit fails with
  `*http.MaxBytesError`. Translating that error into a 413 envelope belongs to the
  JSON decode helper in Slice 02.
- **S01-5** CORS echoes a configured origin with `Vary: Origin`, ignores an unknown
  origin, and answers a preflight with 204.

## 4. OpenAPI contract delta

The whole `api/openapi.yaml` at v0.1.0: every parent §7 endpoint and schema.

## 5. Database changes

`0001_forbid_hard_delete.{up,down}.sql`: the function only.

## 6. Test plan

| Test | Kind | Covers |
|---|---|---|
| `configs/config_test.go` | unit | S01-4 |
| `adapter/in/http/handlers_health_test.go` | `httptest` | AC-B25 (handler part), S01-5 |
| `adapter/in/http/contract_test.go` | contract | S01-3 |
| `domain/arch_test.go` | static | AC-B26 |
| `adapter/out/postgres/no_hard_delete_test.go` | static | S01-2 |
| `adapter/out/postgres/migrations_test.go` | integration (testcontainers, skipped with `-short`) | S01-1 |
| `scripts/smoke.sh` + manual `docker compose up` | platform | AC-B25 |

## 7. Implementation notes

Copied from `afwilto-certifications-mngr` and adapted:
- `cmd/api/{main,migrate}.go`, `cmd/healthcheck/main.go` (default port 8084);
- `configs/config.go`;
- `internal/studies/adapter/in/http/{router,middleware,handlers_health,respond}.go`;
- `internal/studies/adapter/out/system/system.go`;
- `internal/studies/domain/doc.go`;
- `Dockerfile`, `Makefile`, `.gitignore`.

Compose additions: `studies-db` (postgres:17-alpine), `studies-mngr` (:8084), volume
`studies_pgdata`. `.env.example` gains `STUDIES_DB_USER` and `STUDIES_DB_PASSWORD`.

## 8. Documentation

- Service README.
- A compose comment pointing to Spec 16.
- This spec.
