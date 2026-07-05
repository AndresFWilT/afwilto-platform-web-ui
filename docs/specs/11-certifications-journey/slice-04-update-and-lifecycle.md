# Slice 04 — Update + status lifecycle

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 4

## 1. Functional specification

`PATCH /api/v1/certifications/{id}` with merge-patch semantics (absent ≠ null:
absent = unchanged, null = clear for nullable fields), status lifecycle, and
evidence fields.

## 2. Business rules

- All status transitions legal (planned|in_progress|achieved, any direction).
- BR-EV1: evidence fields (credlyUrl, officialUrl, achievedDate) writable only
  when the certification is (or becomes, within the same patch) achieved →
  otherwise 422 violation on the offending field.
- BR-EV2: moving away from achieved keeps stored evidence (history).
- achievedDate defaults to Clock.Now() date on the transition to achieved when
  none is supplied.
- Evidence URLs must be https. Name/category/status cannot be null.
- Patched name obeys BR-NAME1 (uniqueness excludes self); dates BR-DATE1
  evaluated on the merged result.

## 3. Acceptance criteria

GH-E1..E5.

## 4. OpenAPI contract delta — none

## 5. Database changes — none

## 6. Test plan

- Domain: evidence guard, achieve() defaulting, reschedule invariant on merge,
  evidence kept after regression from achieved.
- Use case: partial patch only touches sent fields + updatedAt; status+evidence
  same-patch order (status applied first); 404 unknown id.
- API: 200 envelope, 422 BR-EV1, 404, null-vs-absent decoding (Opt fields).

## 7. Implementation notes

`app/port/in/update.go` (UpdateCommand with optional/nullable fields),
`app/usecase/update.go`, `adapter/in/http/dto.go` gains `Opt[T]`
(UnmarshalJSON: present-null vs absent), handler wires PATCH.
