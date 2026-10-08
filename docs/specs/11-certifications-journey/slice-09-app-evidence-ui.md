# Slice 09 (app) — Evidence UI

> Status: **Approved 2026-07-05 — Implemented**
> Slice of: `11-certifications-journey.md` §16 Slice 9 (frontend half)
> Depends on: Slice 07 (write path app — detail page exists), Slice 09 backend (attachment endpoints live)

---

## 1. Functional specification

**What:** Add an Evidence section to `CertificationDetailPage` that allows the user to
upload, view, download, and delete `certificate` and `diploma` file attachments on
an *achieved* certification.

**Why:** US-4 — "attach my Credly URL, official URL, certificate and diploma when I
achieve a certification, so all evidence lives in one place." (§4 of the module spec.)

**Scope:**
- Extend `ICertificationJourneyService` with `uploadAttachment`, `attachmentUrl`, `removeAttachment`.
- Extend `Certification` with `attachments: AttachmentMeta[]`.
- Extend `AttachmentMeta`, `AttachmentKind` types in the port file.
- Implement attachment methods in `InMemoryCertificationAdapter` (fake for tests).
- Implement attachment methods in `CertificationHttpAdapter`.
- Add an Evidence section to `CertificationDetailPage` (shown only when `status === 'achieved'`).

**Non-goals:**
- No file preview (pdf/image viewer in the browser).
- No drag-and-drop upload (plain `<input type="file">`).
- No batch upload (one file at a time per kind).
- No rename or metadata edit for attachments.
- Evidence URL fields (`evidenceUrl` / `credlyUrl` / `officialUrl`) — already handled
  in the edit form via `evidenceUrl`; keep that field as-is, no change.

---

## 2. Business rules

**BR-EV1 (frontend):** The Evidence section and upload controls render ONLY when
`certification.status === 'achieved'`. For other statuses, the section is hidden entirely.

**BR-EV2:** At most one attachment per kind (`certificate`, `diploma`). Uploading a new
file of the same kind replaces the previous one (the UI shows "Replace" when one exists).

**BR-EV3:** Upload button is disabled while an upload is in progress.

**BR-EV4:** Delete prompts for confirmation (a second click on a "Remove" button, no modal).

---

## 3. Acceptance criteria

### AC-EV1 — Evidence section visibility

Given a certification with status `achieved`,
when the detail page renders,
then the "Evidence" section heading is visible.

Given a certification with status `planned` or `in_progress`,
when the detail page renders,
then no "Evidence" section is present.

### AC-EV2 — Attachment list

Given an achieved certification with one `certificate` attachment and no `diploma`,
when the detail page renders,
then the certificate attachment is shown with its filename and a download link (href = `attachmentUrl(attachment.id)`).
And a "Upload diploma" button is shown.
And the certificate row has a "Remove" button.

### AC-EV3 — Upload

Given an achieved certification with no certificate,
when the user selects a file via the certificate `<input type="file">` and clicks upload,
then `uploadAttachment(certId, 'certificate', file)` is called.
And on success a success toast is shown and the attachment appears in the list.
And on error an error toast is shown.

### AC-EV4 — Remove

Given an achieved certification with a diploma attachment,
when the user clicks "Remove" on the diploma row and confirms,
then `removeAttachment(attachmentId)` is called.
And on success the attachment disappears from the list and a success toast is shown.

---

## 4. Port delta

```ts
export type AttachmentKind = 'certificate' | 'diploma'

export interface AttachmentMeta {
  id: string
  kind: AttachmentKind
  fileName: string
  contentType: string
  sizeBytes: number
}

// Add to Certification:
attachments: AttachmentMeta[]   // always present (empty array when none)

// Add to ICertificationJourneyService:
uploadAttachment(certId: string, kind: AttachmentKind, file: File): Promise<AttachmentMeta>
attachmentUrl(attachmentId: string): string   // returns a URL for <a href> download
removeAttachment(attachmentId: string): Promise<void>
```

---

## 5. Database changes

None (frontend slice).

---

## 6. Test plan

| Test file | Named cases |
|---|---|
| `test/evidence.test.tsx` | AC-EV1: evidence section hidden for planned; AC-EV1: evidence section visible for achieved; AC-EV2: existing attachment shown with filename + download link; AC-EV3: upload calls service and shows toast; AC-EV4: remove calls service and hides attachment; error toast on upload failure |

---

## 7. Implementation notes

Files to create:
- `test/evidence.test.tsx`

Files to update:
- `src/application/ports/ICertificationJourneyService.ts` — add types + methods
- `src/application/ports/index.ts` — re-export `AttachmentKind`, `AttachmentMeta`
- `src/infrastructure/adapters/memory/InMemoryCertificationAdapter.ts` — add upload/attachmentUrl/removeAttachment
- `src/infrastructure/adapters/http/CertificationHttpAdapter.ts` — add upload/attachmentUrl/removeAttachment
- `src/pages/Detail/CertificationDetailPage.tsx` — add EvidenceSection

**Upload implementation detail:** `uploadAttachment` calls `httpClient.postMultipart`
with a `FormData` containing `kind` and `file`. The backend returns `{ data: AttachmentMeta }`.

**`attachmentUrl`:** Returns `${apiBaseUrl}/api/v1/attachments/${id}` — must be a sync
method (no async fetch needed; the URL is just a template).
