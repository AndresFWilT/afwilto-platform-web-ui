# Spec 11 — Certifications Journey (full-stack module)

> Status: **Approved 2026-07-04** (owner chat approval — implementation authorized)
> Owner: afwilto · Created: 2026-07-04
> Depends on: `00-system-architecture.md`, `01-shared-packages.md`, `02-shell-host.md`,
> `08-certifications-mfe.md`, `10-docker-compose-platform.md`
> Supersedes (upon approval): the **non-goals** of Spec 08 ("no backend, no
> filtering/search, no uploads"). Spec 08 itself stays valid as the record of
> Phase 7; this spec is the next evolution of the same MFE.

---

## 0. Context — the "now" of the platform (what this plan builds on)

There are no separate ADR files in the lab; **specs 00–10 are the de-facto
decision record**. The decisions inherited here, verified on disk 2026-07-04:

| Inherited decision | Source | Consequence for this module |
|---|---|---|
| MFE platform: shell host :3000 + remotes via Module Federation, `exposes: { './App' }`, shared singletons `react`/`react-dom`/`react-router-dom` | Spec 00, 02 | `afwilto-certifications-web-ui` (:3006, `/certifications/**`) already exists and stays the delivery vehicle — **no new MFE is created** |
| Hexagonal boundary in the frontend: pages → `useServices()` → port → adapter; composition root `di/container.ts` | Spec 00 §1.4, monolith CLAUDE.md | The existing `ICertificationService` + `StaticCertificationAdapter` evolve; the HTTP swap touches only `container.ts` (exactly the future Spec 08 predicted) |
| Design system is a workspace package (`@afwilto/design-system`), bundled per MFE, dark theme `#181D35`, Tailwind v4 `@theme` tokens, Atomic Design | Spec 01 | New UI components (Table, Dialog, Toast, Skeleton…) are added to the package, not to the app |
| Backend Go services follow `cmd/` + `internal/<feature>/{domain, app/port, app/usecase, adapter/in, adapter/out}`; composition root = `main.go`; ports named after the business | `backend/CLAUDE.md` §11.4 | The new `afwilto-certifications-mngr` follows the same manifesto to the letter |
| API responses use the Go envelope `{ "data": T }`; HTTP codes never leak past frontend adapters | Spec 00 §3.3 | The new API keeps the envelope and adds a symmetric `{ "error": … }` model |
| One `docker compose up -d` at `afwilto-software-lab/docker-compose.yml`, network `afwilto`, DBs internal-only + healthchecks, `Dockerfile.mfe` for frontends | Spec 10 | Two new services (`certifications-db`, `certifications-mngr`) join that file; the MFE image already exists |
| Backend host ports in use: 8080 (finance), 8081, 8085–8091 | Spec 10 §2 | **`afwilto-certifications-mngr` takes :8082** (first free slot) |
| No auth, single developer/user, no event bus, YAGNI enforced | Spec 00 §10 | MVP is single-user; auth is a platform-level future concern (§19) |

What exists in the MFE today (all tests green): pages Catalog / Roadmap /
Detail over a **static dataset** with model
`{ slug, name, provider, status: obtained|in-progress|planned, … }`. Spec 08
explicitly declared the dataset illustrative, so **breaking its model is
acceptable and planned** (§6.7 migration note).

---

## 1. Product Vision

### 1.1 Purpose

A personal learning-operations tool: plan, organize, track and complete
professional certifications and courses (AWS SAP, CKA, Arcitura, Oracle Java,
Scrum, Coursera/Udemy courses — anything). It turns a vague "I should get
certified" into a dated, visible, reviewable roadmap.

### 1.2 Target users

- **Primary (MVP):** the lab owner — a senior engineer planning a multi-year
  certification path.
- **Future:** any learner once platform auth exists (§19); the module is
  designed single-tenant but with no schema decision that blocks multi-tenant
  (adding `owner_id` later is one migration).

### 1.3 User problems

1. Certification plans live in heads/notes and silently slip.
2. No single view of *when* study periods overlap → overcommitment.
3. Achievements (Credly links, PDFs, diplomas) are scattered across email and
   provider portals.
4. No record of *why* a certification was pursued (motivation decays).

### 1.4 Success metrics

| Metric | Target (MVP) |
|---|---|
| Time to register a new certification | < 30 s |
| Timeline answers "what am I studying in month X?" | one glance, zero clicks after filters |
| All achieved certs carry at least one evidence link or file | 100 % |
| Backend p95 for list/timeline queries (local Docker) | < 300 ms |
| Zero regressions in the rest of the platform | shell + other MFEs untouched at runtime |

### 1.5 MVP scope

CRUD for certifications with free-form hierarchical categories, status
lifecycle (Planned → In Progress → Achieved), soft delete, list with
pagination/search/sort/filter, yearly Timeline view, achievement evidence
(Credly URL, official URL, uploaded certificate/diploma files), Dockerized
Go + PostgreSQL backend, HTTP adapter swap in the MFE.

### 1.6 Future scope (details in §19)

Study sessions & streaks, reminders, calendar sync, dependencies between
certifications / learning paths, dashboard & statistics, Credly sync,
notifications, multi-user auth.

### 1.7 Non-goals (MVP)

- No authentication / multi-user (platform-level future).
- No email/push notifications.
- No external calendar integration.
- No AI recommendations.
- No mobile app (responsive web only).
- No object storage service (files on a Docker volume behind a port — swap later).
- No event bus (domain events are *modeled*, not dispatched — §6.6).

---

## 2. Functional Requirements

### FR-1 Create Certification

| Field | Type | Required | Rules |
|---|---|---|---|
| Category | free-form hierarchical text, e.g. `TI / Cloud / AWS` | ✔ | 1–120 chars per rendered path; segments split on `/`, trimmed; auto-created if new (FR-6) |
| Name | text | ✔ | 1–200 chars, unique **among non-deleted** certs (case-insensitive) |
| Study start date | ISO date | ✖ | — |
| Expected exam date | ISO date | ✖ | if both dates present: `expectedExamDate ≥ studyStartDate` |
| Goal / motivation | text | ✖ | ≤ 2000 chars |

Status defaults to `planned`. Rationale for optional dates: a certification can
be captured as an idea before it is scheduled; the Timeline simply omits items
without dates (§3) and the list flags them as "unscheduled".

### FR-2 Edit Certification

- Every FR-1 field is editable (PATCH semantics — only sent fields change).
- **Status** is editable: `planned` | `in_progress` | `achieved`. All
  transitions are allowed (including backwards — real life: a failed exam moves
  `achieved`-optimism back to `in_progress`).
- When status is (or becomes) `achieved`, these **optional** evidence fields
  become writable:
  - `credlyUrl` (https URL)
  - `officialUrl` (https URL)
  - `achievedDate` (ISO date; defaults to today when the transition happens and none is given)
  - uploaded **certificate** file and **diploma** file (FR-5)
- Business rule **BR-EV1:** evidence fields on a non-achieved certification are
  rejected with a validation error (422). Rule **BR-EV2:** moving *away* from
  `achieved` keeps stored evidence (it is history) but the UI hides the
  evidence section until the status returns to `achieved`.

### FR-3 Delete Certification

- **Soft delete**: sets `deleted_at`; the row stays for future "trash/restore"
  (§19) and referential integrity of attachments.
- Deleted certifications disappear from every list/timeline/category count.
- Deleting twice → 404 (already invisible).
- Attachments of a soft-deleted certification are no longer downloadable.

### FR-4 List Certifications

- **Pagination:** `page` (1-based, default 1), `pageSize` (default 20, max 100).
- **Search:** `search=` case-insensitive substring over **name** and **goal**.
- **Sort:** `sort=` one of `name | studyStartDate | expectedExamDate | achievedDate | createdAt` (default `createdAt`), `order=asc|desc` (default `desc`).
- **Filter:** `status=` (repeatable), `category=` (matches the category path
  **prefix**, so `TI / Cloud` matches `TI / Cloud / AWS`), `year=` (certification
  is *active* in that year: its `[studyStartDate, expectedExamDate]` interval —
  or single known date — intersects the year).
- All parameters compose (AND semantics).

### FR-5 Attachments (uploads)

- Kinds: `certificate`, `diploma`. At most **one of each kind** per
  certification (uploading again replaces, atomically).
- Allowed content types: `application/pdf`, `image/png`, `image/jpeg`.
  Max size: **10 MB** (server-enforced, 413 beyond).
- Upload allowed only when the certification status is `achieved` (BR-EV1).
- Download streams the original file with its original filename and content type.
- Files live behind a `FileStorage` **out-port**; MVP adapter = local disk on a
  named Docker volume. Trade-off: a MinIO/S3 adapter is one class + one compose
  service away, but adding an object store *now* for one user violates YAGNI;
  the port makes the later swap a composition-root change.

### FR-6 Categories (dynamic, never predefined)

> **Superseded** — categories are now explicitly managed (full CRUD) with a
> persisted color, not implicitly created. See
> `backend/afwilto-certifications-mngr/docs/specs/category-management.md` and
> `frontend/apps/afwilto-certifications-web-ui/docs/specs/category-management.md`.
> The rest of this section is kept as historical context.

- A category is a free hierarchical path: `TI / Cloud / AWS`, `Soft Skills`,
  `Languages / English`. Segments separated by `/`; display form preserves the
  user's casing, matching/uniqueness uses a normalized form (trimmed segments,
  lower-cased, single spaces).
- Categories are **created implicitly** the first time a certification uses
  them — there is no "create category" screen.
- `GET /categories` returns distinct categories **in use** with counts, to feed
  filter pills and the form's autocomplete.
- Empty categories (no non-deleted certifications) are hidden from the list but
  the rows are kept (cheap, preserves color assignment stability §12.4).
- Trade-off — why a `categories` table instead of a plain `category text`
  column: (a) filter-by-prefix and counts become indexable joins instead of
  repeated string scans, (b) stable identity lets the UI assign stable colors,
  (c) a future rename/merge feature (§19) is an UPDATE, not a data migration.
  Cost: one small table + one FK. Postgres `ltree` was considered and rejected:
  an extension dependency for two-level-deep personal taxonomies is
  over-engineering.

---

## 3. Timeline View (functional)

The signature feature: certifications on a **yearly timeline**.

- **Item content:** category (color + label), name, study start date, expected
  exam date, current status badge.
- **Filters:** year (default: current year), category (multi), status (multi).
- **Overlap visualization:** items whose date ranges intersect stack in
  separate horizontal lanes so overlapping study plans are *visibly parallel*
  (lane assignment algorithm in §12.3).
- Items with only one known date render as a point/diamond at that date; items
  with **no dates** don't appear on the canvas — a collapsible "Unscheduled"
  tray below the timeline lists them so nothing is silently invisible.
- Achieved items render subdued (lower saturation) with a ✓; the exam-date
  marker turns into an achieved-date marker when present.

**Data contract decision:** there is **no dedicated `/timeline` endpoint** in
the MVP. The timeline is a *presentation* of `GET /certifications?year=YYYY`
(+ filters) — the shaping (lanes, month grid) is pure frontend logic, easily
unit-tested. A dedicated endpoint would duplicate the list contract for zero
server-side value at this scale. Revisit only if item counts per year exceed a
page (then: `pageSize=100` + explicit warning, or a purpose-built query).

UI recommendations (full component design in §12): 12-month horizontal grid
with a today-marker; horizontal scroll on narrow viewports following the
platform's scrollable-canvas pattern; category color coding with a legend;
hover card with goal excerpt; click navigates to the detail page.

---

## 4. User Stories

| ID | Story | AC ref |
|---|---|---|
| US-1 | As a learner, I want to register a certification with category, dates and motivation, so my roadmap is captured instead of remembered. | GH-C1..C4 |
| US-2 | As a learner, I want to edit any field of a certification, so the plan follows reality. | GH-E1..E2 |
| US-3 | As a learner, I want to move a certification through Planned → In Progress → Achieved, so its state is always honest. | GH-E3..E5 |
| US-4 | As a learner, I want to attach my Credly URL, official URL, certificate and diploma when I achieve a certification, so all evidence lives in one place. | GH-E4, GH-U1..U4 |
| US-5 | As a learner, I want to delete a certification without losing history forever, so mistakes are reversible (eventually). | GH-D1..D2 |
| US-6 | As a learner, I want to search, filter, sort and paginate my certifications, so a growing list stays navigable. | GH-L1..L5 |
| US-7 | As a learner, I want to invent my own hierarchical categories, so the taxonomy matches *my* mental model, not a vendor's. | GH-C2, GH-K1..K2 |
| US-8 | As a learner, I want a yearly timeline showing overlapping study periods, so I can spot overcommitment before it happens. | GH-T1..T5 |
| US-9 | As a learner, I want unscheduled certifications visibly parked, so ideas don't vanish just because they lack dates. | GH-T4 |
| US-10 | As a learner, I want clear empty/loading/error states, so I always know whether there is no data or a failure. | GH-X1..X2 |
| US-11 | As the platform owner, I want the module to run with `docker compose up -d` alongside everything else, so operations stay one command. | GH-I1 |
| US-12 | As the platform owner, I want the MFE to keep working (degraded, read-only static data is *not* required) with a clear error card if the backend is down, so one dead service never bricks the shell. | GH-X2 |

---

## 5. Acceptance Criteria (Gherkin)

```gherkin
Feature: Create certification

  Scenario: GH-C1 Create with full data
    Given the API is healthy
    When I POST /api/v1/certifications with
      | category         | TI / Cloud / AWS                                      |
      | name             | AWS Solutions Architect Associate                     |
      | studyStartDate   | 2026-08-01                                            |
      | expectedExamDate | 2026-11-15                                            |
      | goal             | Need this before applying to Senior Cloud Architect.  |
    Then the response is 201 with a data.id (UUID)
    And data.status is "planned"
    And the category "TI / Cloud / AWS" now exists in GET /api/v1/categories

  Scenario: GH-C2 Category is created implicitly and normalized
    Given no category "soft skills" exists
    When I create a certification with category "  Soft Skills  "
    Then GET /api/v1/categories contains exactly one entry displayed "Soft Skills"
    And creating another certification with category "SOFT SKILLS" reuses it (count = 2)

  Scenario: GH-C3 Validation — dates out of order
    When I POST a certification with studyStartDate 2026-12-01 and expectedExamDate 2026-01-01
    Then the response is 422 with error.code "validation_failed"
    And error.details contains a violation for "expectedExamDate"

  Scenario: GH-C4 Validation — duplicate name
    Given a non-deleted certification named "CKA"
    When I POST another certification named "cka"
    Then the response is 422 with a violation for "name"

Feature: Edit certification

  Scenario: GH-E1 Partial update
    Given an existing certification
    When I PATCH it with only { "goal": "Updated motivation" }
    Then the response is 200 and only goal changed (updatedAt refreshed)

  Scenario: GH-E2 Unknown id
    When I PATCH /api/v1/certifications/00000000-0000-7000-8000-000000000000
    Then the response is 404 with error.code "not_found"

  Scenario: GH-E3 Move to in_progress
    Given a certification with status "planned"
    When I PATCH it with { "status": "in_progress" }
    Then data.status is "in_progress"

  Scenario: GH-E4 Achieve with evidence
    Given a certification with status "in_progress"
    When I PATCH it with { "status": "achieved", "credlyUrl": "https://credly.com/x", "achievedDate": "2026-11-20" }
    Then data.status is "achieved" and data.credlyUrl and data.achievedDate are stored

  Scenario: GH-E5 Evidence rejected while not achieved  (BR-EV1)
    Given a certification with status "planned"
    When I PATCH it with { "credlyUrl": "https://credly.com/x" }
    Then the response is 422 with a violation for "credlyUrl"

Feature: Delete certification (soft)

  Scenario: GH-D1 Soft delete hides everywhere
    Given a certification visible in the list
    When I DELETE it
    Then the response is 204
    And it no longer appears in GET /certifications, the timeline year query, or category counts
    And GET /certifications/{id} returns 404

  Scenario: GH-D2 Double delete
    Given a certification already deleted
    When I DELETE it again
    Then the response is 404

Feature: List certifications

  Scenario: GH-L1 Pagination metadata
    Given 45 non-deleted certifications
    When I GET /certifications?page=2&pageSize=20
    Then data has 20 items and meta is { page: 2, pageSize: 20, totalItems: 45, totalPages: 3 }

  Scenario: GH-L2 Search matches name and goal, case-insensitive
    Given certifications "Kubernetes CKA" (goal "cloud native") and "Oracle Java" (goal "backend")
    When I GET /certifications?search=cloud
    Then only "Kubernetes CKA" is returned

  Scenario: GH-L3 Filter composition (AND)
    When I GET /certifications?status=in_progress&category=TI%20/%20Cloud&year=2026
    Then every item is in_progress AND its category path starts with "TI / Cloud" AND its dates intersect 2026

  Scenario: GH-L4 Sort
    When I GET /certifications?sort=expectedExamDate&order=asc
    Then items are ordered by expectedExamDate ascending with nulls last

  Scenario: GH-L5 Invalid parameters
    When I GET /certifications?page=0 or pageSize=101 or sort=bogus
    Then the response is 422 with error.code "validation_failed"

Feature: Categories

  Scenario: GH-K1 Only categories in use are listed
    Given category "Languages" has only a soft-deleted certification
    When I GET /categories
    Then "Languages" is absent and every entry carries a positive count

  Scenario: GH-K2 Prefix filtering
    Given categories "TI / Cloud / AWS" and "TI / Cloud / Azure"
    When I GET /certifications?category=TI%20/%20Cloud
    Then certifications from both subcategories are returned

Feature: Attachments

  Scenario: GH-U1 Upload certificate on achieved cert
    Given an achieved certification
    When I POST multipart /certifications/{id}/attachments with kind=certificate and a 2 MB PDF
    Then the response is 201 with data { id, kind, fileName, contentType, sizeBytes }

  Scenario: GH-U2 Upload rejected on non-achieved cert
    Given a planned certification
    When I upload any attachment
    Then the response is 422 (BR-EV1)

  Scenario: GH-U3 Oversize and wrong type
    When I upload a 12 MB PDF          Then the response is 413
    When I upload an .exe as image/png with exe content sniffed  Then the response is 415

  Scenario: GH-U4 Replace and download
    Given an achieved certification with an existing diploma
    When I upload a new diploma
    Then GET the certification shows exactly one diploma (the new one)
    And GET /attachments/{id} streams it with the original filename and content type

Feature: Timeline (frontend)

  Scenario: GH-T1 Year view
    Given certifications with date ranges inside and outside 2026
    When I open /certifications/timeline for 2026
    Then only certifications whose ranges intersect 2026 render on the canvas

  Scenario: GH-T2 Overlap lanes
    Given "AWS SAA" (Aug–Nov 2026) and "CKA" (Oct 2026–Jan 2027)
    When the 2026 timeline renders
    Then the two bars occupy different lanes and both are fully visible

  Scenario: GH-T3 Item anatomy
    Then each bar shows the name, its category color, and a status badge
    And clicking a bar navigates to that certification's detail page

  Scenario: GH-T4 Unscheduled tray
    Given a certification with no dates
    Then it does not render on the canvas but appears in the "Unscheduled" tray

  Scenario: GH-T5 Empty year
    Given no certification intersects the selected year
    Then the canvas shows the empty state with a "Plan a certification" call to action

Feature: Resilience & states

  Scenario: GH-X1 Loading and empty states
    When the list is loading            Then skeleton rows render (no layout shift)
    When the list resolves empty        Then the empty state with a create CTA renders

  Scenario: GH-X2 Backend down
    Given the certifications API is unreachable
    When I open /certifications
    Then a human-readable error Alert renders inside the MFE
    And the shell navbar/footer and every other MFE keep working

  Scenario: GH-I1 Platform boot
    When I run `docker compose up -d` from afwilto-software-lab/
    Then certifications-db becomes healthy, certifications-mngr starts after it,
    And curl localhost:8082/healthz returns 200 and the smoke script passes
```

---

## 6. Domain Model

### 6.1 Bounded context

`certifications` — one context, one aggregate. It shares *nothing* with the
academic subject managers; the only platform coupling is the HTTP envelope
convention.

### 6.2 Aggregate: `Certification` (aggregate root)

The transactional consistency boundary: a certification **and its attachments'
metadata** change together (replace-diploma is atomic within the aggregate).

```
Certification
├─ id: CertificationID (UUID v7)
├─ name: CertificationName          (VO — 1..200 chars, trimmed)
├─ category: CategoryRef            (id + path snapshot for display)
├─ studyPeriod: StudyPeriod         (VO — optional start, optional exam date, invariant start ≤ exam)
├─ goal: string?                    (≤ 2000)
├─ status: AchievementStatus        (planned | in_progress | achieved)
├─ evidence: AchievementEvidence    (VO — credlyUrl?, officialUrl?, achievedDate?)
├─ attachments: Attachment[0..2]    (entity, ≤ one per kind)
├─ createdAt / updatedAt / deletedAt
└─ behavior:
   rename, recategorize, reschedule(period), describeGoal,
   markPlanned / markInProgress / achieve(evidence),
   attach(kind, fileRef) — enforces BR-EV1 + replace semantics,
   detach(kind), softDelete
```

Invariants enforced *inside* the aggregate (never in handlers):
`start ≤ exam`; evidence writable only when achieved (BR-EV1); at most one
attachment per kind; operations on a soft-deleted aggregate are rejected.

### 6.3 Entities vs Value Objects — reasoning

| Concept | Kind | Why |
|---|---|---|
| `Certification` | Entity / root | Has identity and a lifecycle |
| `Attachment` | Entity (inside aggregate) | Needs identity (download URL) but no life outside its certification |
| `Category` | Entity (separate, tiny) | Identity matters for stable filtering/colors; **not** part of the aggregate — it's a shared reference datum, changed by different flows |
| `CategoryPath` | VO | Equality by normalized segments; owns normalization rules |
| `StudyPeriod` | VO | Owns the date-order invariant; two nullable dates + `intersectsYear(y)` |
| `AchievementEvidence` | VO | Immutable snapshot of URLs + date; replaced whole |
| `AchievementStatus` | VO (enum) | Closed set; no transition table needed (all transitions legal — FR-2) |
| `CertificationName` | VO | Trim/length rules live in one place |

### 6.4 Domain services

Only one: `CategoryResolver` — "given a raw path, return the existing category
or create it" (normalization + get-or-create). It exists because the rule spans
two aggregates (Certification + Category) and doesn't belong to either.
No other domain service: everything else is aggregate behavior (thin-service /
rich-model on purpose — the anemic-model anti-pattern is banned by the backend
manifesto §8).

### 6.5 Ports (backend)

**In-ports (use cases)** — one business operation each (ISP):

```
CreateCertification, UpdateCertification, DeleteCertification,
GetCertification, ListCertifications(query), ListCategories,
UploadAttachment, DownloadAttachment, DeleteAttachment
```

**Out-ports:**

```
CertificationRepository   — Save, FindByID, FindPage(query), ExistsByName
CategoryRepository        — GetOrCreate(path), ListInUse
FileStorage               — Put(key, stream) / Get(key) / Delete(key)
Clock                     — Now()            (deterministic tests)
IDGenerator               — NewID()          (UUID v7; deterministic tests)
```

`Clock` and `IDGenerator` exist because TDD demands deterministic domain tests;
they are one-method interfaces (the `io.Reader` role model).

### 6.6 Domain events — modeled, not dispatched

`CertificationCreated`, `CertificationAchieved`, `CertificationRescheduled`,
`CertificationDeleted` are defined as domain types and returned by aggregate
methods, but **no bus/dispatcher is implemented** — the platform has no event
consumer and Spec 00 bans a speculative event bus. When reminders/notifications
(§19) arrive, the use cases already have the events in hand; wiring an outbox
then is additive, not a refactor. This is the deliberate YAGNI line: model the
concept (cheap, clarifies the domain), skip the infrastructure (expensive,
unused).

### 6.7 Frontend model migration (from Spec 08)

The MFE's port model is **replaced** — `provider`/`skills`/`icon`/`slug` give
way to the journey model above. Spec 08 declared the dataset illustrative and
non-final; the Catalog page's "provider" concept folds into `category`, and
detail routing moves from `:certSlug` to `:id`. The static adapter is rewritten
against the new port and **kept** as the in-memory fake used by tests and by
local dev without a backend.

---

## 7. Database Design (PostgreSQL 17)

### 7.1 Schema

```sql
-- 0001_create_categories.up.sql
CREATE TABLE categories (
    id               uuid PRIMARY KEY,
    path             text NOT NULL,                 -- display form: 'TI / Cloud / AWS'
    normalized_path  text NOT NULL UNIQUE,          -- 'ti/cloud/aws'
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_path_len CHECK (char_length(path) BETWEEN 1 AND 120)
);

-- 0002_create_certifications.up.sql
CREATE TABLE certifications (
    id                 uuid PRIMARY KEY,
    category_id        uuid NOT NULL REFERENCES categories(id),
    name               text NOT NULL,
    goal               text,
    status             text NOT NULL DEFAULT 'planned',
    study_start_date   date,
    expected_exam_date date,
    achieved_date      date,
    credly_url         text,
    official_url       text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT cert_name_len    CHECK (char_length(name) BETWEEN 1 AND 200),
    CONSTRAINT cert_goal_len    CHECK (goal IS NULL OR char_length(goal) <= 2000),
    CONSTRAINT cert_status_enum CHECK (status IN ('planned','in_progress','achieved')),
    CONSTRAINT cert_dates_order CHECK (
        study_start_date IS NULL OR expected_exam_date IS NULL
        OR expected_exam_date >= study_start_date)
);

-- uniqueness among the living only (soft delete must free the name)
CREATE UNIQUE INDEX certifications_name_alive_ux
    ON certifications (lower(name)) WHERE deleted_at IS NULL;

CREATE INDEX certifications_alive_status_ix
    ON certifications (status) WHERE deleted_at IS NULL;
CREATE INDEX certifications_alive_category_ix
    ON certifications (category_id) WHERE deleted_at IS NULL;
CREATE INDEX certifications_alive_dates_ix
    ON certifications (study_start_date, expected_exam_date) WHERE deleted_at IS NULL;
CREATE INDEX certifications_alive_created_ix
    ON certifications (created_at DESC) WHERE deleted_at IS NULL;

-- 0003_create_attachments.up.sql
CREATE TABLE attachments (
    id               uuid PRIMARY KEY,
    certification_id uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    kind             text NOT NULL,
    file_name        text NOT NULL,
    content_type     text NOT NULL,
    size_bytes       bigint NOT NULL,
    storage_key      text NOT NULL UNIQUE,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT att_kind_enum CHECK (kind IN ('certificate','diploma')),
    CONSTRAINT att_type_enum CHECK (content_type IN ('application/pdf','image/png','image/jpeg')),
    CONSTRAINT att_size_cap  CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    CONSTRAINT att_one_per_kind UNIQUE (certification_id, kind)
);
```

### 7.2 Decisions & trade-offs

| Decision | Choice | Why / alternative rejected |
|---|---|---|
| UUID strategy | **UUID v7, generated app-side** (`IDGenerator` port) | Time-ordered → B-tree locality for `created_at`-ish access; app-side keeps the domain in charge and tests deterministic. `gen_random_uuid()` (v4) rejected: random inserts fragment indexes; DB-side generation couples identity to persistence. |
| Soft delete | `deleted_at timestamptz` + **partial indexes** `WHERE deleted_at IS NULL` | Partial indexes make "alive" queries index-only and the unique name constraint self-repairing after deletes. A `is_deleted boolean` loses *when*; a `deleted_rows` archive table doubles every write path (YAGNI). |
| Status | `text + CHECK` | Native `ENUM` types make adding values a migration with locking quirks; CHECK is equally safe and trivially alterable. |
| Search | `ILIKE '%…%'` on name+goal, no index initially | Personal-scale data (hundreds of rows). `pg_trgm` GIN index is the documented **escape hatch** (one migration) if it ever measures slow — don't pay extension cost up front. |
| Category prefix filter | `normalized_path LIKE 'ti/cloud%'` via join | Indexable by the unique index (left-anchored LIKE); `ltree` rejected (§2 FR-6). |
| File bytes | **Not in the DB** — `storage_key` points at the FileStorage adapter | `bytea` bloats backups and pins the storage decision to Postgres; metadata-in-DB + bytes-behind-port keeps the swap to MinIO/S3 invisible to the schema. |
| FK from attachments | `ON DELETE CASCADE` | Only *hard* deletes cascade (future purge job); soft delete never touches attachments rows. |

### 7.3 Migration strategy

- Tool: **golang-migrate**, plain SQL, `NNNN_name.up.sql` / `.down.sql` in
  `afwilto-certifications-mngr/migrations/`. SQL over ORM-generated diffs:
  reviewable in PRs, zero framework coupling (manifesto rule).
- Execution: the API binary runs `migrate.Up()` **at startup** (env
  `MIGRATE_ON_START=true`, default true in compose). Trade-off: a separate
  one-shot compose job is cleaner for multi-replica prod, but this platform is
  single-node single-replica; startup migration keeps `docker compose up -d`
  a one-command truth (Spec 10's core promise). Revisit at cloud time (§18).
- Every migration is backwards-compatible with the previous app version
  (expand → migrate → contract discipline) so rollback = redeploy previous tag.

### 7.4 Future extensibility (explicitly cheap later)

`owner_id uuid` column (multi-user), `restored_at`/trash UI, `study_sessions`
table FK'd to certifications, category `parent_id` materialization if deep
trees ever matter, `pg_trgm` search index. None block on today's schema.

---

## 8. REST API Specification (Contract-First, OpenAPI 3.1)

The contract file is the **first implementation artifact** (Slice 1, §16) and
lives at `backend/afwilto-certifications-mngr/api/openapi.yaml`. Handlers are
written to satisfy it; API tests assert conformance against it. Summary of the
contract to be authored:

### 8.1 Conventions

- Base path `/api/v1`. JSON; envelope `{ "data": … }` on success (platform
  convention), `{ "data": …, "meta": … }` on lists,
  `{ "error": { "code", "message", "details"? } }` on failure.
- Error codes (closed set): `validation_failed` (422), `not_found` (404),
  `payload_too_large` (413), `unsupported_media_type` (415),
  `internal` (500). `details` is a list of `{ field, rule, message }`.
- Dates are `format: date` strings; timestamps `format: date-time` UTC.
- IDs are `format: uuid`.

### 8.2 Endpoints

| Method & path | Purpose | Success |
|---|---|---|
| `GET /healthz` | liveness (no DB) | 200 `{"data":{"status":"ok"}}` |
| `GET /readyz` | readiness (DB ping) | 200 / 503 |
| `GET /api/v1/certifications` | list — `page,pageSize,search,status*,category,year,sort,order` (FR-4) | 200 list+meta |
| `POST /api/v1/certifications` | create (FR-1) | 201 + `Location` |
| `GET /api/v1/certifications/{id}` | detail incl. `attachments[]` metadata | 200 |
| `PATCH /api/v1/certifications/{id}` | partial update incl. status & evidence (FR-2) | 200 |
| `DELETE /api/v1/certifications/{id}` | soft delete (FR-3) | 204 |
| `GET /api/v1/categories` | in-use categories + counts (FR-6) | 200 |
| `POST /api/v1/certifications/{id}/attachments` | multipart `kind` + `file` (FR-5, replace semantics) | 201 |
| `GET /api/v1/attachments/{id}` | download stream | 200 binary |
| `DELETE /api/v1/attachments/{id}` | remove one attachment | 204 |

### 8.3 Core schemas (shape, authoritative version in the YAML)

```yaml
Certification:
  type: object
  required: [id, name, category, status, attachments, createdAt, updatedAt]
  properties:
    id:               { type: string, format: uuid }
    name:             { type: string, maxLength: 200 }
    category:         { $ref: '#/components/schemas/Category' }
    status:           { enum: [planned, in_progress, achieved] }
    studyStartDate:   { type: [string, 'null'], format: date }
    expectedExamDate: { type: [string, 'null'], format: date }
    goal:             { type: [string, 'null'], maxLength: 2000 }
    achievedDate:     { type: [string, 'null'], format: date }
    credlyUrl:        { type: [string, 'null'], format: uri }
    officialUrl:      { type: [string, 'null'], format: uri }
    attachments:
      type: array
      items: { $ref: '#/components/schemas/Attachment' }
    createdAt:        { type: string, format: date-time }
    updatedAt:        { type: string, format: date-time }

Category:
  required: [id, path, count]
  properties:
    id:    { type: string, format: uuid }
    path:  { type: string }          # display form 'TI / Cloud / AWS'
    count: { type: integer }         # only on GET /categories

Attachment:
  required: [id, kind, fileName, contentType, sizeBytes]
  properties:
    id:          { type: string, format: uuid }
    kind:        { enum: [certificate, diploma] }
    fileName:    { type: string }
    contentType: { enum: [application/pdf, image/png, image/jpeg] }
    sizeBytes:   { type: integer }

CreateCertificationRequest:   # category as raw path string — resolver normalizes
  required: [name, category]
  properties:
    name: {...}; category: { type: string }; studyStartDate/expectedExamDate/goal nullable

UpdateCertificationRequest:   # all fields optional; absent ≠ null (JSON merge-patch semantics)
ListMeta: { page, pageSize, totalItems, totalPages }
Error:    { error: { code, message, details?: [{field, rule, message}] } }
```

Notably per the structured-output standard: every field the source may lack is
nullable/optional — the API never fabricates values (e.g. `achievedDate` stays
null until set).

Validation lives in two layers: shape (types/enums/lengths) at the HTTP
adapter against the request schemas; **business rules** (BR-EV1, date order,
name uniqueness) in the domain — both surface as the same 422 error model.

---

## 9. Backend Architecture — `afwilto-certifications-mngr` (Go)

New repo at `backend/afwilto-certifications-mngr`, port **8082**, following
`backend/CLAUDE.md` §11.4 exactly.

### 9.1 Folder structure

```
afwilto-certifications-mngr/
├── cmd/api/main.go                  # composition root — the ONLY place with concrete types
├── api/openapi.yaml                 # the contract (Slice 1 deliverable)
├── migrations/                      # golang-migrate SQL pairs
├── configs/config.go                # env parsing (PORT, DATABASE_URL, STORAGE_DIR, ALLOW_ORIGINS, MAX_UPLOAD_BYTES, MIGRATE_ON_START)
├── internal/certification/
│   ├── domain/                      # PURE Go — zero imports from adapters/SDKs
│   │   ├── certification.go         # aggregate root + behavior
│   │   ├── category.go              # Category entity + CategoryPath VO
│   │   ├── study_period.go          # StudyPeriod VO (+ intersectsYear)
│   │   ├── evidence.go              # AchievementEvidence VO, BR-EV1
│   │   ├── attachment.go            # Attachment entity, kind rules
│   │   ├── status.go                # AchievementStatus
│   │   ├── events.go                # domain events (modeled only — §6.6)
│   │   └── errors.go                # ErrNotFound, ErrValidation{Violations}, sentinel errors
│   ├── app/
│   │   ├── port/
│   │   │   ├── in/                  # CreateCertification, ListCertifications, … (one file per use case)
│   │   │   └── out/                 # CertificationRepository, CategoryRepository, FileStorage, Clock, IDGenerator
│   │   └── usecase/                 # createService, listService, … implement the in-ports
│   └── adapter/
│       ├── in/http/                 # stdlib net/http (Go 1.22 method+pattern mux)
│       │   ├── router.go            # route table + middleware chain
│       │   ├── handlers_*.go        # thin: decode → validate shape → call use case → encode envelope
│       │   ├── dto.go               # request/response structs mirroring openapi.yaml
│       │   ├── errors.go            # domain error → HTTP status + error body (single translation point)
│       │   └── middleware.go        # request logging (slog), CORS, recover, body limits
│       └── out/
│           ├── postgres/            # pgx v5 repositories + row↔domain mapping (no ORM)
│           └── fsstore/             # DiskFileStorage (STORAGE_DIR on a volume)
├── Dockerfile                       # multi-stage: golang:1.24-alpine → distroless/static
├── Makefile                         # test, lint, run, migrate, docker targets
└── go.mod
```

### 9.2 Decisions & trade-offs

| Concern | Choice | Why |
|---|---|---|
| HTTP framework | **stdlib `net/http`** (1.22+ pattern routing) | Matches the lab's minimal-dependency ethos; chi/gin add nothing needed for 11 routes. |
| DB driver | **pgx v5**, hand-written SQL in the adapter | ORMs put persistence semantics in the domain's blast radius (banned anti-pattern); 3 tables don't justify sqlc codegen yet — sqlc is the documented next step if query count grows. |
| Domain purity | grep-clean: no `pgx`, `http`, `uuid` imports inside `domain/` | Manifesto §2.2 rule of thumb; enforced by a unit test that walks imports (cheap ArchUnit equivalent). |
| DI | constructor injection, wired only in `cmd/api/main.go` | Manifesto §4; no container library — Go needs none. |
| Errors | domain sentinel/typed errors → one HTTP translation table | Never `errors.New("500")` in use cases; adapters own status codes (mirror of the frontend rule that codes never leak *past* adapters). |
| Validation | shape in HTTP adapter, invariants in domain | Two layers, one 422 shape (§8.3); duplicating business rules in DTO tags is drift risk, so DTOs check only types/lengths. |
| Logging | stdlib `log/slog`, JSON handler, request middleware (method, path, status, duration, request id) | Structured from day one; no logging framework. |
| Config | env vars only, parsed once in `configs/config.go`, injected | 12-factor; no config files configuring configuration. |
| Concurrency | plain synchronous handlers | No async domain requirement (KISS). |
| Uploads | `http.MaxBytesReader` + content sniffing (`DetectContentType`) before trusting the declared type | 413/415 guarantees are enforced deterministically, not by prompt-level trust in the client. |

### 9.3 Request flow (list example)

`GET /api/v1/certifications?…` → middleware (log, CORS, recover) →
`handlers_list.go` decodes+shape-validates query into `ListQuery` →
`ListCertifications.Execute(ctx, query)` → repository `FindPage` builds one
SQL statement (WHERE composed from filters, `count(*) OVER()` window for
totals) → domain objects → handler maps to DTOs → `{data, meta}` envelope.

---

## 10. Frontend Architecture — evolving `afwilto-certifications-web-ui`

### 10.1 MFE topology (unchanged)

Shell (:3000) keeps lazy-mounting `certifications/App` for
`/certifications/**`; federation config, shared singletons and the
`VITE_REMOTE_CERTIFICATIONS_URL` override are untouched. **No shell changes
are required** except none — this is the payoff of the Spec 00 gateway design.

### 10.2 App structure (target)

```
apps/afwilto-certifications-web-ui/src/
├── App.tsx                          # exposed module — <Routes> relative table
├── application/ports/
│   └── ICertificationJourneyService.ts   # NEW port (replaces ICertificationService)
├── infrastructure/adapters/
│   ├── http/CertificationHttpAdapter.ts  # implements the port via @afwilto/http-client
│   └── memory/InMemoryCertificationAdapter.ts  # rewritten static adapter → test fake + offline dev
├── di/container.ts                  # picks adapter: VITE_CERTIFICATIONS_API_URL ?? in-memory
├── di/ServiceProvider.tsx           # useServices() (unchanged pattern)
├── domain/timeline/                 # PURE presentation logic, framework-free
│   ├── assignLanes.ts               # interval → lane algorithm (§12.3)
│   └── categoryColor.ts             # stable category→palette hash (§12.4)
├── hooks/
│   ├── useCertificationList.ts      # query-state (page/filters/sort) + fetch lifecycle
│   ├── useCertification.ts
│   └── useTimeline.ts               # year state + lane shaping
└── pages/
    ├── Journey/JourneyListPage.tsx  # route ''      — table + filters + pagination
    ├── Timeline/TimelinePage.tsx    # route 'timeline'
    ├── Form/CertificationFormPage.tsx  # routes 'new', ':id/edit' (one form, two modes)
    ├── Detail/CertificationDetailPage.tsx  # route ':id' — detail + evidence + uploads
    └── shared/                      # StatusBadge mapping, CategoryPill, EmptyStates
```

Route table (relative, wildcard last): `''`, `timeline`, `new`, `:id`,
`:id/edit`, `*` → local 404. Static-before-parameterised ordering rule holds
(`timeline`/`new` precede `:id`).

### 10.3 Port contract (frontend)

```ts
export type AchievementStatus = 'planned' | 'in_progress' | 'achieved'

export interface CertificationJourneyItem { /* mirrors §8.3 Certification */ }
export interface CertificationPage { items: CertificationJourneyItem[]; meta: ListMeta }
export interface ListQuery {
  page?: number; pageSize?: number; search?: string
  status?: AchievementStatus[]; category?: string; year?: number
  sort?: 'name'|'studyStartDate'|'expectedExamDate'|'achievedDate'|'createdAt'
  order?: 'asc'|'desc'
}

export interface ICertificationJourneyService {
  list(query: ListQuery): Promise<CertificationPage>
  getById(id: string): Promise<CertificationJourneyItem | null>   // null = valid empty
  create(input: CreateCertificationInput): Promise<CertificationJourneyItem>
  update(id: string, patch: UpdateCertificationInput): Promise<CertificationJourneyItem>
  remove(id: string): Promise<void>
  listCategories(): Promise<CategorySummary[]>
  uploadAttachment(certId: string, kind: AttachmentKind, file: File): Promise<AttachmentMeta>
  attachmentUrl(attachmentId: string): string                     // for <a download>
  removeAttachment(attachmentId: string): Promise<void>
}
```

Adapter rules (inherited): explicit property + constructor assignment
(`erasableSyntaxOnly`), unwrap `{data}`, translate every non-2xx into
`new Error('<human message>')` using the API's `error.message`; 404 on
`getById` → `null` (valid empty, not an error). Multipart upload goes through
`fetch` **inside the adapter** — if `@afwilto/http-client`'s `IHttpClient`
lacks multipart, extend the package with a `postMultipart` method rather than
bypassing the port.

### 10.4 State management

**React hooks + URL as state — no external state library.** Justification:
server state here is page-scoped (list query, one detail record); the list's
filter/sort/page state belongs in the **URL search params** (shareable,
back-button-correct, survives MFE remount). No cross-page client state exists
that outlives navigation. TanStack Query was evaluated and rejected for now:
caching/invalidation complexity for a single-user app is negative value, and
external libraries require explicit approval per platform rules. The hooks
isolate fetch lifecycle (loading/error/data + abort on unmount) so introducing
a query library later would touch only `hooks/`.

### 10.5 Testing strategy (frontend)

- **Port/adapter:** `CertificationHttpAdapter` unit-tested against a stubbed
  `IHttpClient` fake (error translation table, envelope unwrap, query-string
  building). `InMemoryCertificationAdapter` tested against the same behavioral
  suite → both adapters proven substitutable (LSP made executable).
- **Domain (frontend):** `assignLanes`, `categoryColor`, date/intersection
  helpers — pure Vitest, exhaustive edge cases (§12.3 lists them).
- **Components/pages:** RTL with the in-memory adapter injected via a test
  `ServiceProvider` — pages never know which adapter they got.
- **Contract drift guard:** adapter tests feed responses copied from
  `openapi.yaml` examples, so a contract change fails frontend tests loudly.

---

## 11. Design System

### 11.1 Reconciliation with the AFWILTO design system

The lab's design system is the **existing dark theme** (`surface-base #181D35`,
navy surfaces, `primary-*` blue accent, Tailwind v4 `@theme` tokens). The
Certifications brief calls for *cyan/black/white/gray, dashboard-style,
dark-mode support*. Decision: **do not fork — extend.**

- Dark mode "support" is free: the platform *is* dark-first.
- Add an `accent-cyan` token family (`--color-cyan-300/400/500`, hue ≈ 190°)
  to `@afwilto/design-system` tokens as the **module accent** for the
  certifications MFE (interactive highlights, timeline today-marker, active
  filter pills). Black/white/gray map to existing `surface-*`/`neutral-*`.
- Rationale: one design system serving all MFEs is the entire point of Spec 01;
  a per-module palette fork would reintroduce the CSS drift MFEs were built to
  prevent. Cyan as an *accent within the system* honors the brief without
  breaking visual coherence.

### 11.2 Component gap analysis

Existing (reused as-is): `Button`, `Text`, `Input`, `Badge`, `Spinner`,
`Card`, `Alert`, `FormField`. New components required, each following the
package conventions (three-file structure, barrel exports, showcase entry,
layer discipline):

| Component | Layer | Notes |
|---|---|---|
| `Select` | atom | native `<select>` styled; used by sort/status/kind |
| `Textarea` | atom | goal field; posture matches `Input` |
| `Skeleton` | atom | shimmer block; sized by className |
| `Tag` | atom | dismissible pill (active filters) |
| `Dialog` | molecule | headless `<dialog>`-based; focus trap, `Esc`, backdrop; used for delete-confirm and the form on desktop |
| `Toast` + `ToastProvider` | molecule (+ context) | success/error notifications, auto-dismiss, `aria-live="polite"` |
| `Pagination` | molecule | page buttons + meta text |
| `EmptyState` | molecule | icon + title + description + CTA slot |
| `Table` | organism | semantic `<table>`, sortable headers (aria-sort), row hover, responsive collapse to cards under `sm` |
| `DateField` | molecule | wraps native `<input type="date">` in `FormField` — **no date-picker library** (YAGNI + no-external-libs rule) |

Timeline itself is **not** a design-system component in the MVP: it has exactly
one consumer and heavy domain coupling; per the three-cases rule it stays in
the app (`pages/Timeline` + `domain/timeline`). Promote later if a second
timeline appears.

### 11.3 States, accessibility, dark mode

- Every async surface ships all four states: skeleton (loading), `EmptyState`
  (no data), `Alert variant="error"` + retry button (failure), `Toast`
  (success after mutations).
- Accessibility requirements (acceptance-checked in component tests): all
  interactive elements keyboard-reachable with visible focus (`focus-visible`
  ring token); form fields labeled via `FormField`; dialogs trap focus and
  restore it on close; toasts announced via live region; timeline bars are
  real `<a>` elements with `aria-label` "*name*, *category*, *start* to
  *end*, *status*"; color is never the only status channel (badge text +
  icon); contrast ≥ 4.5:1 on `#181D35` per the existing token table.
- Mobile-first: form is a full page on `< md`, dialog on `≥ md`; table
  collapses to stacked cards; timeline uses the platform's scrollable-canvas
  pattern (overflow wrapper + `minWidth`, §9.4 of the monolith manifesto).

---

## 12. Timeline Component Design

### 12.1 Anatomy & visual hierarchy

```
┌ TimelinePage ────────────────────────────────────────────────┐
│ [◀ 2025]  2026  [2027 ▶]     [Category ▾] [Status ▾] [Clear] │  ← controls row
│ ┌ Card (overflow-hidden) ──────────────────────────────────┐ │
│ │ ┌ scroll wrapper (overflow-auto, minWidth 960px) ──────┐ │ │
│ │ │  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug … Dec        │ │ │  ← month header, sticky
│ │ │ ─────────────────┬─ today ───────────────────────────│ │ │  ← cyan today line
│ │ │ lane 0  ▐█████ AWS SAA          ● exam ▌ (cyan cat)  │ │ │
│ │ │ lane 1        ▐████████ CKA ▌ (violet cat)           │ │ │
│ │ │ lane 2  ◆ Scrum (point — only one date known)        │ │ │
│ │ └───────────────────────────────────────────────────────┘ │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ▸ Unscheduled (2)  — collapsible tray of dateless certs       │
│ Legend: ■ TI / Cloud  ■ TI / Development  ■ Soft Skills       │
└────────────────────────────────────────────────────────────────┘
```

Hierarchy: month grid is quiet (border-token hairlines); **bars are the
loudest element** (category color at full saturation for `in_progress`,
outline-only for `planned`, desaturated + ✓ for `achieved`); the today marker
is the single cyan accent line; text inside bars truncates with ellipsis and
full name in the hover card.

### 12.2 Rendering approach

CSS Grid (not SVG): `grid-template-columns: repeat(365|366, 1fr)` on a
`minWidth: 960px` inner div; each bar is an absolutely trivial
`grid-column: dayOfYear(start) / dayOfYear(end + 1)` on row `lane + 2`.
Rationale vs SVG: bars are interactive links with text, tooltips and focus
states — DOM elements give a11y for free; SVG text/focus management is the
platform's known pain point. Bars clip at the year edges with an arrow cap
when the range continues into an adjacent year.

### 12.3 Lane assignment (pure function, TDD target)

Greedy interval-graph coloring — sort items by start date (nulls resolved:
point items use their single date; ties by name for determinism), then place
each item in the **lowest-indexed lane whose last occupant ends before this
item starts** (with a 3-day visual gutter so adjacent bars don't kiss).
`O(n log n)`, deterministic, minimal lane count for interval graphs.
Edge cases pinned by tests: identical ranges, fully-nested ranges, point
items, ranges clipped by the year boundary, empty input, single item,
100-item stress (lane count ≤ theoretical max overlap).

### 12.4 Category colors

> **Superseded** — the §19 upgrade mentioned below has been specced and
> implemented: color is now persisted per category and user-chosen, not
> hash-derived. See the category-management specs referenced under FR-6.

Stable hash of the category **id** (not path — survives renames) into an
8-color curated palette (cyan, violet, amber, emerald, rose, sky, lime,
fuchsia — all pre-checked for 4.5:1 text contrast on `#181D35`). Collisions
accepted beyond 8 categories (legend disambiguates); a persisted per-category
color is the §19 upgrade.

### 12.5 Interactions

- **Hover / focus:** raise bar (existing `-translate-y` hover idiom) + hover
  card (name, category, dates, status, goal excerpt, "Open →").
- **Click / Enter:** navigate to `/certifications/:id`.
- **Year switch:** `◀ ▶` buttons + year in the URL (`?year=2026`) — deep-linkable.
- **Filters:** category multi-select pills + status pills; active filters shown
  as dismissible `Tag`s; "Clear" resets URL params.
- **Scroll:** vertical page scroll for many lanes; horizontal canvas scroll on
  narrow viewports (thin scrollbar, sticky month header). On mount, auto-scroll
  the today-marker into view for the current year.
- **Animations:** 150 ms color/opacity transitions and the hover lift only —
  no entrance keyframes (platform rule: no motion without semantic purpose).

### 12.6 Empty & degenerate states

Empty year → `EmptyState` with "Nothing planned for 2026" + create CTA
(GH-T5). All-filtered-out → "No matches — clear filters?" variant. Backend
error → `Alert` + retry. Unscheduled tray renders only when non-empty.

### 12.7 Future improvements (not now)

Drag-to-reschedule (PATCH on drop), multi-year horizontal scroll, quarter/
month zoom levels, dependency arrows between bars (§19 learning paths),
milestone sub-markers (study sessions), print/export view.

---

## 13. Docker Architecture

Additions to the existing root `afwilto-software-lab/docker-compose.yml`
(network `afwilto`, conventions from Spec 10 — healthchecks, no DB host ports,
`restart: unless-stopped`):

```yaml
  certifications-db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: certifications
      POSTGRES_USER: ${CERT_DB_USER:-certifications}
      POSTGRES_PASSWORD: ${CERT_DB_PASSWORD:-certifications}
    volumes: [certifications_pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U certifications -d certifications"]
      interval: 5s
      timeout: 3s
      retries: 10
    # debug profile only: ports 5435:5432

  certifications-mngr:
    build: ./backend/afwilto-certifications-mngr
    ports: ["8082:8082"]
    environment:
      PORT: "8082"
      DATABASE_URL: postgres://certifications:${CERT_DB_PASSWORD:-certifications}@certifications-db:5432/certifications?sslmode=disable
      STORAGE_DIR: /data/uploads
      MAX_UPLOAD_BYTES: "10485760"
      MIGRATE_ON_START: "true"
      ALLOW_ORIGINS: http://localhost:3000,http://localhost:3006
    volumes: [certifications_uploads:/data/uploads]
    depends_on:
      certifications-db: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "/app/healthcheck"]   # tiny static binary hitting /readyz
      interval: 10s
      retries: 6

volumes:
  certifications_pgdata:
  certifications_uploads:
```

- **Networking:** browser-resolved URLs stay `localhost:{port}` (Spec 10's key
  insight) — the MFE calls `http://localhost:8082`; only API↔DB traffic is
  container-to-container. CORS: the service echoes the configured origins
  (shell :3000 and standalone MFE :3006).
- **MFE image:** unchanged `Dockerfile.mfe`; the only frontend delta is the
  build-arg/env default `VITE_CERTIFICATIONS_API_URL=http://localhost:8082`
  baked at build time (same mechanism the finance MFE uses). Remember the
  memory-noted rule: **rebuild the MFE image (`docker compose build
  certifications`) after frontend changes** or they stay invisible.
- **Uploads volume:** named volume keeps files across `down`/`up` (mirrors the
  DB-volume durability guarantee of AC-5 in Spec 10).
- **Dev workflow (hot reload):** compose serves the *baked* platform; feature
  development runs `pnpm --filter afwilto-certifications-web-ui dev` (:3006)
  and `make run` (or `air` if approved) in the Go repo against
  `certifications-db` started via the debug profile — matching how the other
  services already split dev vs. platform mode.
- **Smoke script:** `scripts/smoke.sh` gains probes for `:8082/healthz` and a
  round-trip `POST`+`GET`+`DELETE` certification.
- **`.env.example`:** gains `CERT_DB_USER`, `CERT_DB_PASSWORD` with working
  defaults (zero-setup `up -d` stays true).

---

## 14. Testing Strategy (TDD end-to-end)

Non-negotiable (user-global rules): **no implementation before a failing
test**; every acceptance criterion in §5 maps to at least one test; Red →
Green → Refactor per behavior; commit at green.

### 14.1 Backend pyramid

| Level | Scope | Tooling | Infra |
|---|---|---|---|
| Domain unit | aggregate invariants (BR-EV1, date order, attachment replace, soft-delete guard), VOs, `intersectsYear`, category normalization | `go test`, table-driven | none — pure |
| Use case | each in-port against **in-memory fakes** of all out-ports (fake repo, fake clock at fixed instant, fake id sequence, fake storage) | `go test` | none |
| Repository (integration) | postgres adapter: CRUD, partial-index uniqueness (create→delete→create same name), filter/sort/pagination SQL, category get-or-create race (advisory lock or `ON CONFLICT`) | **testcontainers-go** postgres:17 | Docker |
| API (adapter-in) | `httptest` against the real router + real use cases + fake outs: status codes, envelopes, error model, multipart limits (413/415), CORS headers | `go test` | none |
| Contract | responses of API tests validated against `api/openapi.yaml` schemas | kin-openapi validator in tests | none |
| Architecture | domain package imports contain no tech vocabulary (grep test per manifesto §2.2) | `go test` walking AST imports | none |

Mock strategy: **hand-written fakes implementing out-ports — never mocks of
concrete classes** (manifesto §7). Fixtures: builder-style factories in
`internal/certification/domain/testing` (e.g. `NewCertBuilder().Achieved().Build()`)
so tests state only what they assert. Coverage goals: domain + use cases
≥ 95 %, adapters ≥ 80 %, overall ≥ 85 % — enforced informally via
`make test-cover` output in the PR checklist (no CI yet, per platform reality).

### 14.2 Frontend pyramid

| Level | Scope | Tooling |
|---|---|---|
| Pure logic | `assignLanes`, `categoryColor`, query-string builder, date helpers | Vitest |
| Adapter | HTTP adapter vs stubbed `IHttpClient` (error translation, envelope, 404→null); shared behavioral suite run against **both** adapters | Vitest |
| Component | new design-system components (states + a11y: focus trap, aria-sort, live regions) | Vitest + RTL + jsdom |
| Page | list/form/timeline/detail flows with the in-memory adapter via test provider; form validation messages; URL-state round-trips | Vitest + RTL |
| E2E | deferred to Roadmap Slice 10 as an *optional* platform-level Playwright suite (external dep — requires explicit approval); until then GH-I1/GH-X2 are covered by the smoke script + manual checklist | — |

Factories: `test/factories/certification.ts` mirrors the backend builder (no
inline object literals in tests). Independent review: every slice's PR is
reviewed by a **fresh instance without the generator's context** (user-global
mandatory rule) before merge.

### 14.3 Test data & determinism

Fixed clock (`2026-07-04T12:00:00Z`) in all fakes; UUID v7 sequences seeded
per test; date edge cases pinned explicitly (leap year 2028 on the 366-column
grid, year-boundary bars, timezone-free `date` handling — all dates are civil
dates, never `Date` objects at the boundary, ISO strings end-to-end).

---

## 15. Specification-Driven Development workflow

This document is the **module spec**. Each roadmap slice additionally gets a
**feature spec** before its first test, stored next to this file as
`docs/specs/11-certifications-journey/slice-NN-<name>.md`, using this template:

```
1. Functional specification   — what & why, scope, NON-GOALS
2. Business rules             — BR-xxx, categorical (no "handle gracefully")
3. Acceptance criteria        — Gherkin, references §5 IDs or adds new ones
4. OpenAPI contract delta     — exact paths/schemas added or changed
5. Database changes           — migration files planned (up + down)
6. Test plan                  — which pyramid levels, named test cases
7. Implementation notes       — files touched, ports added
8. Documentation              — README/spec updates required
```

Gate: **no implementation before the slice spec is approved** (a chat approval
from the owner counts; the spec status line records it). Implementation drift
= spec change first, code second. Every PR links its slice spec so acceptance
criteria are visible to the independent reviewer.

---

## 16. Development Roadmap — vertical slices

Each slice ends green (all tests pass, `docker compose up -d` still healthy),
is independently mergeable/deployable, and follows spec → contract → failing
tests → implementation → review.

| # | Slice | Delivers (deployable outcome) |
|---|---|---|
| 0 | **This spec approved** | scope frozen; Spec 08 non-goals formally superseded |
| 1 | **Contract & skeleton** | `afwilto-certifications-mngr` repo scaffold, full `api/openapi.yaml` v0.1.0, `/healthz`+`/readyz`, Dockerfile, compose entries (db+api), smoke probe — platform boots with the new service doing nothing yet |
| 2 | **Create + Get** | migrations 0001-0002, domain aggregate + VOs, `POST /certifications` + `GET /{id}`, category get-or-create; repository + API + contract tests |
| 3 | **List** | pagination/search/sort/filter/year query, `GET /categories`; the hardest SQL lands with exhaustive repo tests |
| 4 | **Update + status lifecycle** | PATCH with merge semantics, BR-EV1, evidence fields |
| 5 | **Soft delete** | DELETE, partial-index behaviors, name reuse after delete |
| 6 | **Frontend read path** | new port + HTTP & in-memory adapters, container swap, JourneyListPage (table, filters, pagination, URL state), detail page read-only; MFE image rebuilt; **first user-visible value** |
| 7 | **Frontend write path** | form (create/edit), delete with confirm dialog, toasts; design-system additions: Select, Textarea, DateField, Dialog, Toast, Tag, Pagination, EmptyState, Skeleton (+ showcase) |
| 8 | **Timeline** | `assignLanes` + grid + Table organism polish; TimelinePage with year/category/status filters, unscheduled tray, today marker |
| 9 | **Attachments** | migration 0003, FileStorage port + disk adapter, upload/download/delete endpoints, uploads volume, evidence UI on detail page |
| 10 | **Hardening & docs** | a11y pass, error/empty audits vs GH-X, smoke-script extension, README + spec status updates, coverage report, optional Playwright decision |

Dependency notes: 6 needs 2–3; 7 needs 4–5; 8 needs 3+6; 9 needs 4. Slices
2–5 are backend-only and deployable behind the untouched static frontend —
vertical value starts at 6, but every earlier slice is still shippable
platform-wide without user-facing risk.

---

## 17. Git Strategy

- **Repos:** monorepo-per-tier stays: backend service = new nested repo
  `backend/afwilto-certifications-mngr` (git-init'ed like its siblings, ignored
  by the lab root repo); frontend work in the `frontend/` monorepo; compose +
  smoke changes in the lab root repo. One slice may touch up to three repos —
  the slice spec lists the coordinated commits.
- **Branching:** trunk-based with short-lived branches
  `feat/cert-journey-s<NN>-<slug>` (e.g. `feat/cert-journey-s03-list-query`);
  merge to `main` per slice via PR; no long-lived develop branch (single dev).
- **Commits:** Conventional Commits, already the house style —
  `feat(certifications): …`, `fix(cert-mngr): …`, `test(…)`, `chore(compose): …`,
  `docs(specs): …`. Red/green TDD rhythm may commit at green only.
- **PRs:** one per slice; description links the slice spec + checks off its
  Gherkin IDs; reviewed by an independent instance; must state test evidence
  (`go test ./... ok`, `pnpm --filter … test ok`, smoke pass).
- **Versioning:** backend tags `v0.<slice>.x` (semver, `v1.0.0` at Slice 10);
  the MFE follows the workspace's package.json versioning; `api/openapi.yaml`
  carries its own `info.version` bumped on every contract change (contract
  version ≠ binary version, deliberately).
- **Releases:** "release" = compose rebuild at the lab root
  (`docker compose build certifications-mngr certifications && docker compose up -d`);
  a `docs(release)` commit in the root repo records the tag set.

---

## 18. Non-Functional Requirements

| Attribute | Requirement | Mechanism |
|---|---|---|
| Performance | list/timeline p95 < 300 ms local; create < 200 ms; uploads stream (no full buffering beyond the 10 MB cap) | indexed queries (§7), single-statement pagination, `http.MaxBytesReader` |
| Maintainability | domain grep-clean; one aggregate; spec per slice; no external deps without approval | arch test, PR checklist, this spec |
| Scalability | single-node now; nothing blocks: stateless API (files behind a port, no in-proc cache), UUID v7 keys, pagination everywhere | ports make DB/storage swaps composition-root changes |
| Security | inputs validated at two layers; content sniffing on uploads; URLs must be https; no secrets in code (env only); SQL always parameterized (pgx); CORS restricted to configured origins; no auth **by explicit scope** (localhost, single user) | deterministic enforcement in adapters, not conventions |
| Accessibility | WCAG 2.1 AA targets from §11.3, tested in component suites | RTL a11y assertions |
| Reliability | DB-health-gated startup; `/readyz` honest (DB ping); graceful shutdown (drain on SIGTERM); soft delete = recoverable data; named volumes survive restarts | compose healthchecks, `http.Server.Shutdown` |
| Observability | structured JSON logs (slog) with request id, latency, status; log lines for every 5xx with error chain | logging middleware |
| Metrics | **deferred** — no scraper exists on the platform; `/metrics` (Prometheus) is a one-middleware addition recorded here as the upgrade path | — |
| Cloud readiness | 12-factor config, distroless image, stateless process, migrations decoupled-able (`MIGRATE_ON_START=false` + job), storage port ready for S3 adapter | §7.3, §9.2 |
| Future microservices | new module = new `internal/<feature>` or new service repo + compose entry + MFE route — both paths proven by this very module | platform pattern |

---

## 19. Future Features (recommended, in rough value order)

| Feature | Sketch of the architecture hook already in place |
|---|---|
| **Study sessions & streaks** | `study_sessions` table FK→certifications; new in-ports; timeline gains session tick-marks; streak = pure domain calc |
| **Dashboard & statistics** | learning velocity, achieved-per-year, category distribution — read-only queries over existing schema; new `/stats` endpoints + a dashboard page |
| **Exam reminders / notifications** | first consumer of the modeled domain events (§6.6): outbox table + notifier adapter (email/push); reminder rules as domain policies |
| **Calendar integration (Google/Outlook)** | out-port `CalendarGateway`; study period ↔ calendar event sync; OAuth lands with platform auth |
| **Dependencies between certifications / learning paths** | `certification_dependencies (predecessor_id, successor_id)` DAG table; timeline draws arrows; cycle check in domain |
| **Skills graph / knowledge map** | `skills` + join table (the old Spec 08 model's `skills[]` returns properly normalized); graph visualization reuses the lab's existing graph-rendering experience |
| **Achievement gallery** | public read-only page over achieved certs + attachments; pairs with auth |
| **Credly synchronization** | out-port `CredentialProvider`; Credly HTTP adapter imports achieved badges; conflict rule: manual data wins, sync annotates |
| **Trash / restore UI** | `deleted_at` already preserves everything; needs list-deleted + restore endpoints |
| **Estimated completion / velocity forecasting** | derived from study sessions; pure domain service, no schema change |
| **Multi-user / auth** | platform-level (shell-owned session, per Spec 00 future note); module change = `owner_id` column + repository scoping |

---

## 20. Open Questions (to resolve at approval — defaults chosen if unanswered)

1. **Port 8082** for `certifications-mngr` — first free slot per Spec 10
   inventory. *(Default: yes.)*
2. **Old Catalog/Roadmap pages:** replaced by List/Timeline/Detail per §10.2,
   or kept as extra read-only views? *(Default: replaced — Roadmap ≈ Timeline,
   Catalog ≈ list filtered to achieved; keeping both duplicates surface area.)*
3. **`air` for Go hot reload** (dev-only dependency). *(Default: plain
   `make run`; add `air` only if the loop feels slow.)*
4. **Playwright E2E** at platform level in Slice 10 (external dependency
   needing explicit approval). *(Default: defer; smoke script covers GH-I1.)*
5. **Cyan accent tokens** added to the shared design system (§11.1) vs
   app-local CSS. *(Default: shared tokens — other MFEs may want accents too,
   and app-local theme CSS violates the single-source-of-truth token rule.)*
