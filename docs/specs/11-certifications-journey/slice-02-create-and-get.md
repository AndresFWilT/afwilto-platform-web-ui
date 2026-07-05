# Slice 02 — Create + Get

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 2

## 1. Functional specification

Migrations 0001–0002, the `Certification` aggregate + VOs, category
get-or-create, `POST /api/v1/certifications`, `GET /api/v1/certifications/{id}`.

**Non-goals:** list/search (S3), PATCH (S4), delete (S5), attachments (S9).

## 2. Business rules

- BR-NAME1: name 1–200 chars after trim; unique among non-deleted, case-insensitive.
- BR-CAT1: category path 1–120 chars; segments split on `/`, trimmed; display
  form preserves user casing; identity via normalized form (lower, single spaces).
- BR-DATE1: when both dates present, `expectedExamDate ≥ studyStartDate`.
- New certifications start `planned`, evidence empty.

## 3. Acceptance criteria

GH-C1, GH-C2, GH-C3, GH-C4; plus `GET /{id}` → 200 envelope, unknown id → 404.

## 4. OpenAPI contract delta

None — v0.1.0 already documents these paths.

## 5. Database changes

`0001_create_categories`, `0002_create_certifications` (up+down) exactly per
module spec §7.1.

## 6. Test plan

- Domain: CertificationName trim/length; CategoryPath normalize/display/prefix;
  StudyPeriod order invariant; aggregate construction defaults.
- Use case: create with fakes (fixed clock, seeded id gen) — implicit category,
  duplicate name 422 violation, date order violation; get → ErrNotFound.
- API (httptest, fakes): 201 + Location + envelope; 422 shapes; 404.
- Contract: create/get responses validate against openapi.yaml.
- Repository (testcontainers postgres:17): save/find round-trip, category
  get-or-create normalization reuse.
- Architecture: domain package imports contain no tech vocabulary.

## 7. Implementation notes

`domain/{certification,category,study_period,evidence,attachment,status,events,errors,query}.go`,
`app/port/{in,out}/*.go`, `app/usecase/{create,get}.go`,
`adapter/in/http/{dto,handlers_certifications,errors}.go`,
`adapter/out/postgres/{certification_repo,category_repo,mapping}.go`.
CategoryResolver (§6.4) is realized as `CategoryPath` normalization (VO) +
`CategoryRepository.GetOrCreate` — no separate struct (KISS; recorded drift).

## 8. Documentation

This spec; README already covers run modes.
