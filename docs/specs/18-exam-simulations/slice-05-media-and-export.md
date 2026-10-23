# Slice 05 — Media and export

> Status: Approved 2026-10-22 (module approval covers the roadmap slices)
> Parent: `../18-exam-simulations.md` FR-5, FR-6, BR-Q4, AC-10–AC-13
> Repos: `backend/afwilto-studies-mngr`, lab root (`docker-compose.yml`)

## 1. Functional specification

1. **Zip import.** The import accepts a `.zip`, detected by the `PK\x03\x04` magic. The zip is
   checked **before** any entry is decompressed into memory:

   | Check | Limit | Rule |
   |---|---|---|
   | Entry count | ≤ 1,000 | `zip_entries` |
   | Total uncompressed size, from the headers, then enforced while reading with a counting reader | ≤ 100 MiB | `zip_size` |
   | Entry names | no absolute path, no `..` segment, no `\`, no symlink mode bits | `zip_path` |
   | Root JSON | exactly one `*.json` at the root | `zip_layout` |

   All four map to 422, field `file`.
2. **Images.**
   - Every non-JSON entry referenced by `media:<path>` is sniffed by its magic bytes and must
     be PNG, JPEG or WebP. Anything else → `media_type`. A `.png` holding SVG text is rejected.
   - Each image is ≤ 2 MiB (`media_size`) and ≤ 4096 px per side (`media_dimensions`), read
     from the image header with `image.DecodeConfig`.
   - Entries that are not referenced are listed in `media.unused` and **not stored**.
3. **Rewrite.**
   - Each `media:<path>`, in stems, explanations, rationales and `option.image`, becomes
     `media:<sha256>`.
   - A `.json`-only import may reference `media:<sha256>` (64 hex characters) when that hash
     already exists. This makes re-importing an export work (BR-Q4).
4. **Storage.**
   - The `MediaStorage` out-port has `Put(sha, reader)` and `Open(sha)`. It is implemented by a
     copy of certifications' `fsstore.DiskFileStorage` under
     `internal/exams/adapter/out/fsstore`, with keys `ab/cd/<sha256>`.
   - The `media` table holds one row per hash.
   - A file write happens **before** the DB transaction commits. An orphan file left by a
     rolled-back import is harmless, because it is content-addressed and is reused next time.
5. **Serving.** `GET /api/v1/media/{sha256}`:
   - 200 with the stored `Content-Type`, `Cache-Control: public, max-age=31536000, immutable`
     and `X-Content-Type-Options: nosniff`;
   - an unknown or malformed hash → 404.
6. **Export.** `GET /api/v1/exams/{id}/questions/export` returns `application/zip`:
   - a `questions.json` in the FR-2 format. The file-level `source` is the most common
     `{kind, name}`, and every question whose source differs carries its own `source`
     override, so a mixed TD + Whizlabs bank round-trips exactly (S05-3).
   - `img/<sha256>.<ext>`, with every `media:<sha>` rewritten to `media:img/<sha>.<ext>`.
7. **Config and compose.**
   - `MEDIA_DIR` defaults to `/data/media`.
   - The lab root `docker-compose.yml` mounts the volume `studies_media:/data/media` on
     `studies-mngr`.
   - `/readyz` also checks that `MEDIA_DIR` is writable.

## 2. Acceptance criteria

The parent's AC-10 to AC-13 apply, plus these:

- **S05-1** The fixture `moto-images.zip` (built in the test from `api/examples/moto-images.json`
  plus 3 generated PNGs) imports. Its 3 images are stored, and the stored stems and options
  hold `media:<64-hex>`.
- **S05-2** One fixture zip per rule: 1,001 entries, an entry declaring 200 MiB, `../x.png`,
  `/abs.png`, a symlink entry, two root JSON files, a 3 MiB PNG and a 5000×10 PNG. Each one is
  rejected with its own rule, and nothing is written.
- **S05-3** Export, then re-import into the same exam → every question is `unchanged`, with 0
  new categories and 0 missing media.
- **S05-4** `GET /media/<sha>` twice returns the same bytes and headers. `GET /media/xyz` → 404.
- **S05-5** `/readyz` → 503 when `MEDIA_DIR` is read-only.

## 3. Database changes

`0012_create_media.{up,down}.sql`: `media` (`sha256 char(64) pk`, `content_type`, `bytes`,
`width`, `height`, `created_at`), with a no-delete trigger.

## 4. Test plan

| Test | Kind | Covers |
|---|---|---|
| `exams/adapter/in/http/zipguard_test.go` | unit (zips generated in the test) | S05-2 |
| `exams/domain/mediaref_test.go` | unit | rewrite both ways, the ref regex |
| `exams/adapter/out/fsstore/disk_test.go` | unit (temp dir) | Put/Open, sharded path, no traversal |
| `exams/adapter/in/http/media_api_test.go` | `httptest` + contract | AC-10, S05-4 |
| `exams/adapter/out/postgres/media_repo_test.go` | integration | AC-11, S05-1, S05-3 |
| `scripts/smoke.sh` (lab root) | platform | the volume is mounted, `/readyz` |

## 5. Amendments

Fixes from the phase-2 independent review.

- 2026-10-23, entry count cannot be bypassed (phase-2 fix 6). The end record's count field is 16 bits, and `archive/zip` accepts a directory whose real count differs from it by a multiple of 65,536 (or whose 64-bit zip64 values replace it), then parses every entry. Before `archive/zip` runs, the guard (a) rejects a central directory larger than 1 MiB (`zip_entries`), (b) walks the directory headers (signature `0x02014b50`, a 46-byte fixed part plus the name, extra and comment lengths) and rejects more than 1,000 of them (`zip_entries`). When the end record carries a marker (count `0xFFFF`, offset `0xFFFFFFFF`, or size `0xFFFF`/`0xFFFFFFFF`) and a zip64 locator, the 64-bit directory size and offset are the ones checked. Input the guard cannot locate a directory in (damage, no end record) is left to `archive/zip`, which reports it as `file_type`. Example: 65,536 + 500 empty entries with an end record that says 500 → 422 `zip_entries` without any entry list being built.
