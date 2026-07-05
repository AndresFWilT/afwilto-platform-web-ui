# Slice 03 — List certifications + categories

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 3

## 1. Functional specification

`GET /api/v1/certifications` with pagination/search/sort/filter/year and
`GET /api/v1/categories` (in-use with counts). Single-statement pagination with
`count(*) OVER()`.

**Non-goals:** timeline endpoint (none exists by design, §3).

## 2. Business rules

- Pagination: page ≥ 1 (default 1), pageSize 1–100 (default 20).
- Search: case-insensitive substring over name and goal (`%`/`_` escaped).
- Sort: name|studyStartDate|expectedExamDate|achievedDate|createdAt
  (default createdAt), order asc|desc (default desc), nulls last.
- Category filter: normalized-path segment-boundary prefix
  (`ti/cloud` matches `ti/cloud` and `ti/cloud/...`, not `ti/cloudy`).
- Year filter: `[start, exam]` (or single known date) intersects the year;
  dateless certifications never match a year filter.
- Filters compose with AND. Invalid parameters → 422 validation_failed.

## 3. Acceptance criteria

GH-L1..L5, GH-K1..K2.

## 4. OpenAPI contract delta — none (already in v0.1.0)

## 5. Database changes — none (indexes landed in 0002)

## 6. Test plan

- Domain: ListQuery normalization/validation, StudyPeriod.IntersectsYear edges
  (nil dates, single date, boundary years).
- Use case: list delegates query, meta math (totalPages ceil).
- API: query decoding, 422 on page=0/pageSize=101/sort=bogus, repeatable status.
- Repository: exhaustive SQL tests — pagination meta, search on name+goal,
  AND composition, prefix boundary, year intersection, sort nulls last,
  categories in-use counts exclude soft-deleted.

## 7. Implementation notes

`domain/query.go`, `app/usecase/{list,list_categories}.go`,
`adapter/in/http/handlers_list.go`, repo `FindPage` + `ListInUse`.
