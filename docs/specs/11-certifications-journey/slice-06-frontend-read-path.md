# Slice 06 — Frontend read path

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 6

## 1. Functional specification

Replace the Spec-08 static model with the journey model:
`ICertificationJourneyService` port, `CertificationHttpAdapter` (real API) and
`InMemoryCertificationAdapter` (test fake + offline dev), DI swap via
`VITE_CERTIFICATIONS_API_URL`, JourneyListPage (table, filters, pagination,
URL-as-state) and read-only detail page. Old Catalog/Roadmap pages are
**replaced** (module spec open question 2, default accepted).

## 2. Business rules

- Pages never call fetch; all I/O via `useServices()`.
- List filter/sort/page state lives in URL search params (shareable,
  back-button-correct, survives MFE remount).
- `getById` 404 → `null` (valid empty); every other non-2xx → `Error` with the
  API's human message. HTTP codes never leak past the adapter.
- `@afwilto/http-client` gains `patch`, `postMultipart` and a typed `HttpError`
  (status + parsed body) so adapters can translate — the port is extended
  rather than bypassed (§10.3 adapter rules).

## 3. Acceptance criteria

GH-L1..L4 (as UI behavior), GH-X1 (skeleton/empty), GH-X2 (error Alert inside
the MFE, shell unaffected — ErrorBoundary + adapter errors), detail read path.

## 4/5. Contract & DB — none

## 6. Test plan

- http-client: patch/postMultipart/HttpError unit tests (stubbed fetch).
- Shared behavioral suite run against **both** adapters (LSP executable):
  list pagination/search/status/category/year/sort, getById null, create
  defaults, update merge, remove hides, categories counts.
- HTTP adapter: query-string building, envelope unwrap, error translation
  table, 404→null (stubbed IHttpClient).
- Pages (RTL + in-memory adapter via test ServiceProvider): list renders rows,
  skeleton while loading, empty state, error Alert, URL round-trip of filters,
  detail renders fields.

## 7. Implementation notes

MFE `src/`: new port, two adapters, container env swap, `hooks/`
(useCertificationList, useCertification), `pages/Journey`, `pages/Detail`
(rewritten), `pages/shared` (StatusBadge, CategoryPill), route table
`'' | new | :id | :id/edit | timeline | *` (static before parameterised;
new/edit/timeline stubs land in Slices 07–08). Old static adapter, dataset,
Catalog/Roadmap/CertCard deleted.
