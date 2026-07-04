# Slice 01 — Contract & Skeleton

> Status: Approved 2026-07-04 (module-spec approval covers the roadmap slices)
> Parent: `../11-certifications-journey.md` §16 Slice 1

## 1. Functional specification

Stand up `backend/afwilto-certifications-mngr` (Go, :8082) as a running-but-empty
service: health endpoints, config, Dockerfile, compose entries (db + api), smoke
probes, and the full OpenAPI 3.1 contract as the authoritative artifact.

**Non-goals:** no business endpoint implementations, no migrations content
(0001+ land in Slice 02), no frontend changes.

## 2. Business rules

None (infrastructure slice).

## 3. Acceptance criteria

- GH-I1 (partial): `docker compose up -d` brings up `certifications-db`
  (healthy) then `certifications-mngr`; `curl localhost:8082/healthz` → 200
  `{"data":{"status":"ok"}}`.
- `/readyz` returns 200 when the DB answers a ping, 503 otherwise.
- `api/openapi.yaml` v0.1.0 documents every §8 endpoint and schema.
- Smoke script probes `:8082/healthz`.

## 4. OpenAPI contract delta

Entire `api/openapi.yaml` v0.1.0 (all §8.2 endpoints, §8.3 schemas).

## 5. Database changes

None — DB container only. `MIGRATE_ON_START` tolerates an empty migrations dir.

## 6. Test plan

- `configs`: env parsing defaults + overrides (unit).
- HTTP: `httptest` — healthz 200 envelope; readyz 503 when pinger fails,
  200 when it succeeds; CORS headers echo configured origins.

## 7. Implementation notes

`cmd/api/main.go` (composition root), `cmd/healthcheck/main.go` (static probe
binary for the distroless image), `configs/config.go`,
`internal/certification/adapter/in/http/{router,middleware,handlers_health,errors}.go`,
`Dockerfile` (multi-stage → distroless/static), `Makefile`, `.gitignore`,
compose: `certifications-db`, `certifications-mngr`, volumes
`certifications_pgdata`, `certifications_uploads`; `.env.example` gains
`CERT_DB_USER`/`CERT_DB_PASSWORD`.

## 8. Documentation

Service README; root compose comment; this spec.
