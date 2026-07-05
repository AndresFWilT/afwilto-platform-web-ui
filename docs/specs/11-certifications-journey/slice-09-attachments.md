# Slice 09 — Attachments (evidence uploads)

> Status: Approved 2026-07-04 · Parent: `../11-certifications-journey.md` §16 Slice 9

## 1. Functional specification

Upload/download/delete certificate & diploma files behind a `FileStorage`
out-port with a local-disk adapter on the `certifications_uploads` volume, plus
the evidence UI on the detail page (frontend half tracked with Slice 10 work).

**Drift note:** migration `0003_create_attachments` landed early (Slice 02–05
commit) because the aggregate persists attachment metadata from day one; this
slice adds storage + endpoints only.

## 2. Business rules

- BR-EV1: uploads only on `achieved` certifications → 422.
- ≤ one attachment per kind; re-upload replaces atomically (old blob deleted
  best-effort after the metadata commit).
- 10 MB cap → 413; content type decided by **sniffing** (DetectContentType),
  not the declared header → 415 unless pdf/png/jpeg.
- Attachments of soft-deleted certifications are not downloadable (404).

## 3. Acceptance criteria

GH-U1..U4.

## 4. OpenAPI contract delta — none (paths already in v0.1.0)
## 5. Database changes — none (0003 already applied)

## 6. Test plan

- fsstore: put/get/delete round-trip, atomic overwrite (t.TempDir).
- Use case (fake storage): upload on achieved, 422 on planned, replace deletes
  the displaced blob key, download streams metadata+bytes, delete detaches.
- API: multipart 201 envelope; 422 planned; 413 oversize; 415 sniffed mismatch;
  download headers (Content-Disposition original filename, sniffed type);
  DELETE 204 / 404.

## 7. Implementation notes

`app/port/out/file_storage.go`, `adapter/out/fsstore/disk.go`,
`app/usecase/attachments.go` (Upload/Download/DeleteAttachment services),
`adapter/in/http/handlers_attachments.go`, RouterDeps gains the three ports +
`MaxUploadBytes`.
