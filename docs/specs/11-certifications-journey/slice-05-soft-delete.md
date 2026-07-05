# Slice 05 — Soft delete

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 5

## 1. Functional specification

`DELETE /api/v1/certifications/{id}` sets `deleted_at`; deleted rows vanish
from list, get, categories counts and (later) timeline queries; the
name-uniqueness partial index frees the name for reuse.

## 2. Business rules

- Delete on an already-deleted (or unknown) id → 404.
- Operations on a soft-deleted aggregate are rejected (domain guard).
- Attachments of a deleted certification stop being downloadable (S9 enforces).

## 3. Acceptance criteria

GH-D1, GH-D2; repository test: create → delete → create same name succeeds.

## 4. OpenAPI contract delta — none
## 5. Database changes — none (partial indexes landed in 0002)

## 6. Test plan

- Domain: SoftDelete sets deletedAt via Clock, second SoftDelete errors,
  mutations on deleted aggregate error.
- Use case: delete → repo save with deletedAt; unknown/deleted id → ErrNotFound.
- API: 204; double delete 404.
- Repository: deleted invisible to FindByID/FindPage/ListInUse; name reuse.

## 7. Implementation notes

`app/port/in/delete.go`, `app/usecase/delete.go`, DELETE route.
