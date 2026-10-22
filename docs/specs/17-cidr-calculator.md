# Spec 17 — CIDR Calculator (full-stack slab app: `afwilto-cidr-web-ui` + `afwilto-slab-cidr-mngr`)

> Status: **Implemented 2026-10-21** (slices 01–09; independent review: no blockers or majors — see §13).
> Approved 2026-10-21 (owner chat — OQ-1..OQ-3 resolved, see §12)
> Owner: afwilto · Created: 2026-10-21
> Owner answers already folded in (chat 2026-10-21):
> - Scope: CIDR → range (IPv4 + IPv6), IP range → CIDR list, IPv4 aggregation, prefix tables.
> - Backend: Ruby + Sinatra + RSpec, built and tested in Docker (the host only has Ruby 2.6).
> - Studies content: a seed migration in `afwilto-studies-mngr`.
> - Commits: small Conventional Commits, local only, no push.
>
> Depends on: `00-system-architecture.md`, `02-shell-host.md`, `03-slab-homepage-mfe.md`,
> `10-docker-compose-platform.md`, `16-studies.md` (seed target), `backend/CLAUDE.md`
> (microservice manifesto; this spec adds its §11.6 Ruby layout), `frontend/CLAUDE.md`
> (the MFE standard this spec introduces, §9).

---

## 0. Context — what this module builds on

| Inherited decision | Source | Consequence here |
|---|---|---|
| Shell host :3000 + Module Federation remotes exposing `./App`; shared singletons `react` / `react-dom` / `react-router-dom` | Spec 00, 02 | New remote **`cidr`** at **:3009**, owning **`/slab/cidr/*`** |
| `/slab` landing is `afwilto-slab-homepage-web-ui` (Hero + "Academic Institutions") | Spec 03 | It gains a **"Software Engineering"** section **above** the academic one, with one card per project |
| Frontend hexagon: page → `useServices()` → port → adapter; composition root `di/container.ts` | Spec 00 §1.4, 16 | Same, inside a screaming + atomic layout (§9) |
| Envelope `{ "data": … }`; errors `{ "error": { code, message, details? } }` with `details[] = { field, rule, message }` | Spec 11 §8.1 | Same conventions in Ruby |
| Single `docker compose up -d`, network `afwilto`, `scripts/smoke.sh` | Spec 10 | New services `cidr` (:3009) and `cidr-mngr` (:8092) |
| Ports in use: frontends 3000–3008; APIs 8080–8091 | `docker-compose.yml` (verified 2026-10-21) | **MFE :3009, API :8092** |
| Studies: category tree → subject → Markdown note, tags, `slabLinks`, logical deletion | Spec 16 FR-0..FR-7 | Seed **TI → Networks → CIDR → note** (FR-10) |

**Golden rule of this module: every calculation happens in the Ruby backend.** The
frontend parses nothing numerically. It only splits a pasted address list into lines
(input handling) and groups digit strings with thousands separators (presentation).

---

## 1. Product vision

### 1.1 Purpose

A slab "Software Engineering" project: a CIDR calculator modelled on
ipaddressguide.com's IPv4 and IPv6 CIDR tools, built as a hexagonal Ruby service and an
atomic + screaming-architecture MFE. A Studies note explains the theory and links to
the calculator, and the calculator links back to the note.

### 1.2 MVP scope

1. **CIDR → range** for IPv4 and IPv6. The family is detected from the input.
2. **IP range → CIDR list:** the minimal set of blocks that exactly covers `[first, last]`.
3. **IPv4 aggregation:** 1–1000 addresses merged into the fewest CIDR blocks.
4. **Prefix tables:** /32…/0 for IPv4 (with subnet mask) and /128…/0 for IPv6,
   computed by the API.
5. A new slab section "Software Engineering" with a CIDR Calculator card.
6. A Studies seed: category **TI → Networks** → subject **CIDR** → note
   **"IPv4 and IPv6 CIDR — guide and tables"**.
7. A written standard for every new MFE (atomic design + screaming architecture,
   §9), enforced by an architecture test.

### 1.3 Non-goals

- No ASN lookup. The reference shows an "Associated ASN" field, but it needs an
  external data source.
- No embeddable HTML widget and no "related articles" block.
- No IPv6 aggregation. Aggregation is IPv4 only, as on the reference site.
- No CIDR entries in the aggregation list; it accepts plain addresses only.
- No split-CIDR, netmask→CIDR, ping, traceroute, DNS or IPv4→IPv6 conversion tools.
- No zone IDs (`fe80::1%eth0`) and no non-decimal IPv4 forms (`0x0A.0.0.1`,
  `10.1`, `167772160`).
- No persistence, auth or rate limiting. The service is stateless.
- No i18n. The UI is in English, like the other slab apps.
- No restructuring of existing MFEs into the new §9 standard. It applies to **new**
  MFEs; the slab homepage only gains a section.
- No change to the Studies schema or API. The seed is data only.
- No pushes, and no GitHub repository creation.

---

## 2. Functional requirements — backend `afwilto-slab-cidr-mngr`

### FR-1 Address and CIDR parsing (domain)

Input is trimmed of surrounding whitespace. Then:

- **IPv4 address:** exactly four decimal octets 0–255 separated by `.`. Leading zeros
  are rejected (`"010.0.0.1"` is ambiguous with octal); `"0"` itself is valid.
- **IPv6 address:** RFC 4291 §2.2 text forms, case-insensitive:
  - eight groups of 1–4 hex digits;
  - at most one `::`;
  - an embedded IPv4 tail, as in `::ffff:192.0.2.1`.
- **Family:** IPv6 if the text contains `:`, otherwise IPv4.
- **CIDR:** `<address>/<prefix>`, where the prefix is a decimal integer without sign or
  leading zeros, 0–32 for IPv4 and 0–128 for IPv6.
  - The prefix is **required**: `"10.0.0.1"` sent as a CIDR is rejected.
  - Host bits may be set (`10.0.0.5/24`); the block is normalised to its network
    address, as the reference does.
- Any field longer than 100 characters is rejected before parsing.

### FR-2 CIDR → range — `POST /api/v1/cidr/range`

Request `{ "cidr": "<text>" }`. The response `data` contains:

| Field | IPv4 | IPv6 |
|---|---|---|
| `family` | `"ipv4"` | `"ipv6"` |
| `input` | the trimmed input, echoed | same |
| `cidr` | canonical block, e.g. `10.0.0.0/24` | canonical, RFC 5952 §4 compressed lowercase, e.g. `2001:4860::/32`. §5 mixed notation is not applied, so IPv4-mapped addresses render in hex. |
| `prefixLength` | integer | integer |
| `netmask` | dotted quad | `null` |
| `wildcardBits` | dotted quad | `null` |
| `firstIp` / `lastIp` | dotted quad | **fully expanded, uppercase** (as in the reference) |
| `firstIpDecimal` / `lastIpDecimal` | decimal **string** | decimal **string** |
| `totalHosts` | decimal string: every address in the block (the reference's "Total Host") | same |
| `usableHosts` | decimal string: `total − 2` for prefix ≤ 30; `2` for /31 (RFC 3021); `1` for /32 | `null` |

Numbers wider than 2⁵³ are always JSON **strings**. This rule applies to every endpoint.

### FR-3 IP range → CIDR list — `POST /api/v1/cidr/summarize`

- Request: `{ "firstIp": "<addr>", "lastIp": "<addr>" }`.
- Both addresses must belong to the same family; otherwise the request fails with rule
  `family_mismatch`. `first ≤ last` is required; otherwise rule `range_order`.
- Response `data`:
  - `family`;
  - `firstIp` and `lastIp`, normalised;
  - `blocks`: an array of canonical CIDR strings in ascending address order. It is the
    **minimal** set whose union is exactly `[first, last]`.
  - `blockCount`.

### FR-4 IPv4 aggregation — `POST /api/v1/cidr/aggregate`

- Request: `{ "addresses": ["<ipv4>", …] }`, holding 1–1000 entries.
- Duplicates are allowed and collapsed.
- An empty array fails with rule `required`. More than 1000 entries fails with rule
  `max_items`.
- An IPv6 entry fails with rule `unsupported_family`. Any other unparsable entry,
  including a blank or null one, fails with rule `format`.
- Each failing entry produces one `details` item with `field: "addresses[<index>]"`.
  At most the first 20 are listed.
- Response `data`:
  - `inputCount`;
  - `uniqueCount`;
  - `blocks`: the fewest canonical IPv4 CIDRs that exactly cover the set of unique
    addresses, ascending;
  - `blockCount`.

### FR-5 Prefix tables — `GET /api/v1/cidr/prefix-table?family=ipv4|ipv6`

- `family` is required. A missing or unknown value fails with rule `enum`.
- `data.rows` is ordered by `hostBits` ascending, so /32 comes first for IPv4 and /128
  first for IPv6, like the article.
- Each row is `{ hostBits, prefixLength, netmask, totalAddresses }`:
  - `netmask` is a dotted quad for IPv4 and `null` for IPv6;
  - `totalAddresses` is a decimal string equal to 2^hostBits.
- IPv4 returns 33 rows and IPv6 returns 129.

### FR-6 Platform endpoints and errors

- `GET /healthz` → 200 `{"data":{"status":"ok"}}`.
- Error codes form a closed set:

| Code | Status | When |
|---|---|---|
| `validation_failed` | 422 | Domain rule violated; `details[]` contains `{ field, rule, message }` |
| `invalid_json` | 400 | The body is not a JSON object |
| `validation_failed` | 422 | The query string is not valid URL encoding; detail `{ field: "query", rule: "format" }` |
| `unsupported_media_type` | 415 | A POST without `Content-Type: application/json` |
| `payload_too_large` | 413 | The body is larger than `MAX_BODY_BYTES` (default 65536) |
| `not_found` | 404 | Unknown route |
| `method_not_allowed` | 405 | Known path, wrong method |
| `internal` | 500 | Unexpected error; the response never includes a stack trace |

- Validation `rule` values form a closed set: `required`, `max_length`, `format`,
  `prefix_range`, `family_mismatch`, `range_order`, `max_items`,
  `unsupported_family`, `enum`.
- A wrong JSON type, such as `"cidr": 5`, fails with rule `format`.
- CORS allows only the origins listed in `ALLOW_ORIGINS` (default
  `http://localhost:3000,http://localhost:3009`).

---

## 3. Functional requirements — frontend `afwilto-cidr-web-ui`

### FR-7 Calculator MFE (remote `cidr`, :3009, `/slab/cidr/*`)

| Route | Page | Content |
|---|---|---|
| `/slab/cidr` | — | redirects to `/slab/cidr/range` |
| `/slab/cidr/range` | CIDR → Range | One CIDR input and a "Calculate" button. The result table shows the FR-2 fields; the IPv4-only rows are hidden for IPv6. |
| `/slab/cidr/summarize` | Range → CIDR | First and last IP inputs. The result is the block list with its count. |
| `/slab/cidr/aggregate` | Aggregate | A textarea where entries are split on whitespace, commas, semicolons or new lines and blanks are dropped. The result shows the blocks plus the input and unique counts. |
| `/slab/cidr/tables` | Prefix tables | An IPv4 / IPv6 toggle that switches between the FR-5 tables |
| anything else | — | in-app "Not found" |

- A tab bar is shared by the four pages, and each tab is a URL. The page header links
  back to `/slab` and to the Studies tag view `/studies/tags/cidr` ("Learn the theory").
- Results are displayed exactly as the API returns them. Only `totalHosts`,
  `usableHosts` and `totalAddresses` are grouped with `,` separators by a pure
  string function, with no numeric conversion.
- **Loading:** the submit button is disabled while a request is in flight.
- **API validation errors:** a 422 shows the API messages inline under the form, and
  the inputs keep their values.
- **Other failures:** any other failure shows a design-system `Alert` with the message.
  The remote never breaks the shell: `App` wraps everything in an `ErrorBoundary`.
- **Empty submit:** submitting an empty form does not call the API. A "required"
  message is shown instead. This is presence checking, not calculation.

### FR-8 Slab homepage — "Software Engineering" section

- `/slab` renders a new section titled **"Software Engineering"** between the Hero and
  **"Academic Institutions"**.
- The section shows one card per project from a typed catalog, `SE_PROJECTS` in
  `data.ts`. The MVP catalog has one entry:
  - **CIDR Calculator**, linking to `/slab/cidr`;
  - tags `IPv4`, `IPv6`, `Ruby`, `Sinatra`, `Hexagonal`.

### FR-9 Shell integration

- The shell gains a remote `cidr` with entry `VITE_REMOTE_CIDR_URL`, defaulting to
  `http://localhost:3009/remoteEntry.js`.
- It also gains the route `/slab/cidr/*` → `RemoteSlot(CidrApp)` and a
  `declare module 'cidr/App'`.

---

## 4. Functional requirement — Studies seed (repo `afwilto-studies-mngr`)

### FR-10 Migration `0008_seed_networks_cidr`

- **Idempotent find-or-create**, never clobbering existing data:
  1. The root category **TI** is reused if an alive root with that name exists
     (case-insensitive). Otherwise it is created with a fixed UUID and color `#64748B`.
     An existing TI keeps its color.
  2. The child category **Networks** under TI (color `#0EA5E9`) is found or created
     the same way, by alive sibling name.
  3. The subject **CIDR** in Networks is found or created the same way, with
     description "Classless Inter-Domain Routing for IPv4 and IPv6."
  4. The note **"IPv4 and IPv6 CIDR — guide and tables"** is created only if no alive
     note with that title exists in the subject. It has:
     - kind `Summary`, looked up by name; if `Summary` was renamed or deleted, the
       first alive kind alphabetically is used; with no alive kind at all, a `Summary`
       kind is created (fixed id `…-8017-000000000005`, removed again by the down migration);
     - tags `cidr`, `networking`, `ipv4`, `ipv6`, `subnetting`;
     - `slabLinks = [{ "label": "CIDR Calculator", "path": "/slab/cidr" }]`.
- **Note content** is Markdown written in our own words, not copied from the article:
  - covered topics: what CIDR is, the network and host portions, subnet masks, IPv6
    /64 and /48 practice, and the practical uses (allocation, aggregation,
    ACLs/firewalls, SLAAC);
  - the **full IPv4 and IPv6 tables**, generated by a script from 2^n and checked
    against an independent oracle;
  - a "Source" section crediting the IP2Location article by title, publisher and date.
    *Amended:* the owner pasted the article without its URL, and a URL is never guessed;
  - a correction note: the article's /78 row reads 1,125,899,906,842,620, while the
    correct value is 2⁵⁰ = 1,125,899,906,842,624.
- **Down migration:** logically deletes (`deleted_at = now()`) only the rows that carry
  the seed's fixed UUIDs, in the order note-tags → note → subject → Networks → TI. It never
  issues a SQL `DELETE` (Spec 16 FR-0).

---

## 5. Acceptance criteria

Each AC maps to at least one test. **B** = backend RSpec, **F** = frontend Vitest,
**S** = studies Go test, **P** = platform smoke.

### Backend

| ID | Given / When | Then |
|---|---|---|
| AC-B1 | `POST /range {"cidr":"10.0.0.0/24"}` | 200 with `cidr 10.0.0.0/24`, `netmask 255.255.255.0`, `wildcardBits 0.0.0.255`, `firstIp 10.0.0.0`, `firstIpDecimal "167772160"`, `lastIp 10.0.0.255`, `lastIpDecimal "167772415"`, `totalHosts "256"`, `usableHosts "254"` |
| AC-B2 | `{"cidr":"2001:4860:4860::8888/32"}` | `family ipv6`, `input "2001:4860:4860::8888/32"`, `cidr "2001:4860::/32"`, `firstIp "2001:4860:0000:0000:0000:0000:0000:0000"`, `firstIpDecimal "42541956101370907050197289607612071936"`, `lastIp "2001:4860:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF"`, `lastIpDecimal "42541956180599069564461627201156022271"`, `totalHosts "79228162514264337593543950336"`, `netmask` / `wildcardBits` / `usableHosts` all `null` |
| AC-B3 | `"10.0.0.5/24"` (host bits set) | `cidr 10.0.0.0/24`, `input "10.0.0.5/24"` |
| AC-B4 | `/31`, `/32`, `/0` IPv4 edges | `usableHosts` is `"2"`, `"1"` and `"4294967294"`; `/0` gives `totalHosts "4294967296"` and `netmask 0.0.0.0` |
| AC-B5 | `"::/0"` and `"::1/128"` | `totalHosts "340282366920938463463374607431768211456"` and `"1"` |
| AC-B6 | `"::ffff:192.0.2.1/128"` | `cidr "::ffff:c000:201/128"`, `firstIp "0000:0000:0000:0000:0000:FFFF:C000:0201"` |
| AC-B7 | invalid CIDRs: `"10.0.0.1"`, `"10.0.0.0/33"`, `"256.0.0.0/8"`, `"010.0.0.0/8"`, `"1::2::3/64"`, `"2001:db8::/129"`, `"fe80::1%eth0/64"`, `""`, a 101-char string | 422 `validation_failed`, field `cidr`, with rules `format` / `prefix_range` / `required` / `max_length` respectively |
| AC-B8 | `POST /summarize 192.168.1.10 → 192.168.1.20` | `blocks ["192.168.1.10/31","192.168.1.12/30","192.168.1.16/30","192.168.1.20/32"]`, `blockCount 4` |
| AC-B9 | `10.0.0.0 → 10.0.0.255` and `2001:db8:: → 2001:db8::ffff` | `["10.0.0.0/24"]` and `["2001:db8::/112"]` |
| AC-B10 | `2001:4860:4860::8888 → 2001:4860:ffff:ffff:ffff:ffff:ffff:ffff` (the reference's range) | `blockCount 86`, first three blocks `2001:4860:4860::8888/125`, `…::8890/124`, `…::88a0/123` |
| AC-B11 | `0.0.0.1 → 255.255.255.254` (worst case) | 62 blocks, the last one `255.255.255.254/32` |
| AC-B12 | first > last; mixed families | 422 with rules `range_order` and `family_mismatch` |
| AC-B13 | `POST /aggregate ["10.0.0.1","10.0.0.0","10.0.0.2","10.0.0.3","10.0.0.3","10.0.0.5"]` | `inputCount 6`, `uniqueCount 5`, `blocks ["10.0.0.0/30","10.0.0.5/32"]` |
| AC-B14 | aggregate `[]`, 1001 items, `["10.0.0.1","::1","x"]` | 422 with `required`; `max_items`; and two details (`addresses[1] unsupported_family`, `addresses[2] format`) |
| AC-B15 | the 256 addresses of 10.0.1.0/24, shuffled | `["10.0.1.0/24"]` |
| AC-B16 | `GET /prefix-table?family=ipv4` | 33 rows; row 0 is `{hostBits 0, prefixLength 32, netmask "255.255.255.255", totalAddresses "1"}`; row 8 is `/24 255.255.255.0 "256"`; row 32 is `/0 0.0.0.0 "4294967296"` |
| AC-B17 | `family=ipv6` | 129 rows; the `/78` row has `"1125899906842624"`; the `/0` row has `"340282366920938463463374607431768211456"` |
| AC-B18 | `family` missing or `ipv5` | 422 rule `enum` |
| AC-B19 | malformed JSON, a non-object body, no JSON content type, a body over the limit, an unknown path, `GET /range` | 400, 400, 415, 413, 404 and 405 respectively, each with the error envelope |
| AC-B20 | **Oracle property test:** 500 random IPv4 and 500 random IPv6 CIDRs, plus random ranges | Every range, decimal and block list equals the result of Ruby's stdlib `IPAddr`. `IPAddr` is used **only in specs**, never in `lib/` |
| AC-B21 | **Architecture test** | Files under `lib/cidr/domain` and `lib/cidr/application` never reference `Sinatra`, `Rack`, `JSON`, `IPAddr` or `require` of an adapter |
| AC-B22 | `GET /healthz`; CORS preflight from :3009 and from `http://evil.test` | 200 ok; `Access-Control-Allow-Origin` is present for :3009 and absent for the other origin |

### Frontend

| ID | Given / When | Then |
|---|---|---|
| AC-F1 | `/slab` renders | The "Software Engineering" heading appears **before** "Academic Institutions", with a "CIDR Calculator" card linking to `/slab/cidr` |
| AC-F2 | shell `/slab/cidr/range` | renders `RemoteSlot(CidrApp)`; `federation.test` sees the `cidr` remote at :3009 |
| AC-F3 | `/slab/cidr` | redirects to `/slab/cidr/range`; an unknown sub-path shows "Not found" |
| AC-F4 | Range page, a fake port returning the AC-B1 payload | All FR-2 rows are shown verbatim; `totalHosts` is shown as `256`; the IPv6 payload hides the netmask, wildcard and usable rows and shows `79,228,162,514,264,337,593,543,950,336` |
| AC-F5 | Range page, the port rejects with a validation error | The messages are shown under the form and the input keeps its value |
| AC-F6 | Range page, empty submit | The port is **not** called and a required message is shown |
| AC-F7 | Summarize page | renders the blocks and the count from the port |
| AC-F8 | Aggregate page, input `"10.0.0.1, 10.0.0.2\n\n 10.0.0.3"` | The port is called with `["10.0.0.1","10.0.0.2","10.0.0.3"]` |
| AC-F9 | Tables page | IPv4 is shown by default (33 rows); the toggle loads IPv6 (129 rows) |
| AC-F10 | `CidrHttpAdapter` against a fake `IHttpClient` | It unwraps `data`; a 422 becomes a `CidrValidationError` carrying `details`; other non-2xx statuses become an `Error` with the API message; no HTTP type crosses the port |
| AC-F11 | `groupDigits("79228162514264337593543950336")` | `"79,228,162,514,264,337,593,543,950,336"`; `"0"` → `"0"`; `"999"` → `"999"` |
| AC-F12 | **Architecture test** (§9 rules), scanning the imports under `src/` | A lower atomic level never imports a higher one; features never import each other; `shared/` and `cidr/` never import `features/`; no `fetch(` outside `cidr/infrastructure` |

### Studies seed and platform

| ID | Given / When | Then |
|---|---|---|
| AC-S1 | A fresh DB after all migrations | Alive categories `TI` (root) → `Networks` (depth 2), with subject "CIDR" holding one note (kind Summary, the five tags and a slab link to `/slab/cidr`) |
| AC-S2 | A DB that already has an alive root "ti" (and/or an alive "networks" child under it) | The migration reuses them; no duplicate is created and no existing row is modified, including TI's color |
| AC-S3 | Running the up migration, then down, then up | Clean each time; down sets `deleted_at` on the seeded rows only; no hard delete |
| AC-S4 | The note's content | Contains both tables; the IPv4 table has 33 rows and the IPv6 table 129; `/78` reads `1,125,899,906,842,624` |
| AC-P1 | `docker compose up -d` + `scripts/smoke.sh` | `remoteEntry :3009` OK, `cidr-mngr /healthz` 200, :3009 cache policy OK |

---

## 6. API contract

`api/openapi.yaml` in the manager repo is authoritative. Base path: `/api/v1/cidr`.

```
POST /range        {cidr}                → 200 {data: CidrRange}
POST /summarize    {firstIp, lastIp}     → 200 {data: RangeSummary}
POST /aggregate    {addresses: string[]} → 200 {data: Aggregation}
GET  /prefix-table ?family=ipv4|ipv6     → 200 {data: {family, rows: PrefixRow[]}}
GET  /healthz (root)                     → 200 {data: {status: "ok"}}
```

Calculations use POST with a JSON body. That keeps one input style across the
endpoints, the aggregate list does not fit in a URL, and no CIDR `/` needs encoding in
a query string.

---

## 7. Backend design (hexagonal, Ruby)

Repo `backend/afwilto-slab-cidr-mngr` is an independent git repository, like its
siblings, and is ignored by the root repo. Stack:

- Ruby 3.4 (`ruby:3.4-slim`), Sinatra 4, Puma, rack-cors;
- RSpec + rack-test for tests, Rake for tasks.

```
lib/cidr/                                   # bounded context — screams "cidr"
  domain/
    ip_family.rb          # IpFamily::V4 / V6: bit width, text formatting
    ip_address.rb         # value object: family + Integer; parse / to_s / expanded
    cidr_block.rb         # value object: network + prefix; first/last/size/netmask/wildcard
    ip_range.rb           # value object: first..last; to_blocks (minimal cover)
    address_set.rb        # dedupe → contiguous ranges → blocks (aggregation)
    prefix_table.rb       # rows for a family
    errors.rb             # ValidationError(field, rule, message), InvalidAddress …
  application/
    port/in/              # contracts (RSpec shared examples enforce the duck type)
      calculate_cidr_range.rb   summarize_ip_range.rb
      aggregate_addresses.rb    list_prefix_table.rb
    usecase/              # one class, one #call(command) → result value
      calculate_cidr_range_service.rb … (4)
  adapter/in/http/
    sinatra_cidr_api.rb   # routes, body parsing, envelope; depends on port-in objects only
    json_presenter.rb     # domain result → wire hash (Integers → strings)
    error_mapper.rb
config/container.rb       # composition root: the only place that calls .new on use cases
config.ru · Gemfile · Rakefile · Dockerfile · Makefile · api/openapi.yaml
spec/{domain,application,adapter,architecture}/
```

- **No port-out exists:** the service is stateless and calls nothing (YAGNI). The
  hexagon here is port-in plus a driving HTTP adapter.
- **Math is in-house:** plain `Integer` arithmetic on Ruby bignums. `IPAddr` appears
  only in specs, as the oracle (AC-B20).
- **Tooling:** the tests run via `make test`, which uses `docker run ruby:3.4-slim … bundle exec
  rspec` with a cached bundle volume. The host's Ruby 2.6 is never used.

---

## 8. Frontend design — `apps/afwilto-cidr-web-ui`

This is the first MFE under the §9 standard:

```
src/
  main.tsx                   # standalone entry (BrowserRouter → /slab/cidr/*)
  app/                       # wiring only: App.tsx (exposed as ./App), routes.tsx, index.css, di/container.ts
  cidr/                      # bounded context (no UI)
    domain/                  # types only: CidrRange, RangeSummary, Aggregation, PrefixRow, IpFamily
    application/ports/       # ICidrCalculator (+ errors.ts: CidrValidationError)
    infrastructure/http/     # CidrHttpAdapter (IHttpClient from @afwilto/http-client)
  features/                  # SCREAMING: one folder per use case
    cidr-to-range/ui/{molecules,organisms,pages}
    range-to-cidr/ui/{organisms,pages}
    address-aggregation/ui/{organisms,pages}
    prefix-tables/ui/{organisms,pages}
  shared/
    di/                      # ServiceProvider + useServices() over the port (no adapter imports)
    lib/                     # groupDigits, splitAddressList, useCalculation
    ui/{atoms,molecules,organisms,templates}   # MonoValue, ResultRow, ResultTable, BlockList, CalculatorTemplate (header + tabs)
```

There is **no in-memory calculator adapter**, because it would duplicate backend math.
Tests use a canned-response fake defined in `test/`. Without `VITE_API_URL`, the
container wires an `UnconfiguredCalculator` adapter whose every call rejects with "The
CIDR API is not configured (VITE_API_URL)". The pages show that message in an `Alert`.

*Amendment 2026-10-21 (slice 06):* `useServices()` lives in `shared/di`. `app/di`
holds only the composition root. This avoids a `features → app → features` cycle.

---

## 9. Standard — atomic design + screaming architecture for new MFEs

This section is codified as `frontend/CLAUDE.md` and is binding for every MFE created
from now on.

1. **Screaming top level:** `src/` contains only these folders:
   - `app/` (wiring);
   - `<bounded-context>/` (domain types, ports, adapters; no UI);
   - `features/<use-case>/` (named after what the user does, never after a technical
     role);
   - `shared/`.
2. **Atomic levels** inside any `ui/`: `atoms → molecules → organisms → templates →
   pages`.
   - A level imports only from its own level or below, across folders, or from
     `@afwilto/design-system`.
   - Pages are the only level that calls `useServices()`. Templates are layout only
     and receive slots.
3. **Dependency direction:**
   - `features/*` may import `shared/*` and the bounded context's `domain` and
     `application`.
   - `features/*` never import each other.
   - `shared/` never imports `features/`.
   - Only `app/di` imports `infrastructure/`.
4. **The design system first:** generic atoms (Button, Input, Card, Text, Alert…) come
   from `@afwilto/design-system`. An app-level atom exists only when it is
   domain-flavoured, such as `MonoValue`.
5. **Enforced, not just prompted:** every new MFE ships an architecture test
   (AC-F12) that fails the build when rules 1–3 are violated.

---

## 10. Platform changes

| Repo | Change |
|---|---|
| root (`afwilto-platform-iac`) | Compose services `cidr` (:3009) and `cidr-mngr` (:8092 → 8080, healthcheck through `ruby -e` with Net::HTTP); `scripts/smoke.sh` probes 3009 and 8092; `.gitignore` gains `/backend/afwilto-slab-cidr-mngr/`; README table row |
| `afwilto-platform-web-ui` (frontend) | This spec; `frontend/CLAUDE.md` (§9); the new app; shell remote and route; slab homepage section; README apps table |
| `afwilto-slab-cidr-mngr` (new, local `git init`) | The service |
| `afwilto-studies-mngr` | Migration 0008 + test |
| `backend/CLAUDE.md` (private, untracked) | Gains §11.6 Ruby layout |

---

## 11. Delivery slices (TDD per slice: red commit → green commit → refactor)

| Slice | Repo | Content | ACs |
|---|---|---|---|
| 01 | cidr-mngr | Skeleton: Gemfile, Docker test runner, Sinatra app, `/healthz`, error envelope, OpenAPI, architecture spec | B19, B21, B22 |
| 02 | cidr-mngr | Domain parsing + CIDR → range (v4/v6) | B1–B7, B20 (range part) |
| 03 | cidr-mngr | Range → CIDR list | B8–B12, B20 (blocks part) |
| 04 | cidr-mngr | IPv4 aggregation | B13–B15 |
| 05 | cidr-mngr | Prefix tables | B16–B18 |
| 06 | web-ui | §9 standard doc + MFE skeleton + adapter + range page + shell + slab section | F1–F6, F10–F12 |
| 07 | web-ui | Summarize, aggregate and tables pages | F7–F9 |
| 08 | studies-mngr | Seed migration 0008 | S1–S4 |
| 09 | root | Compose + smoke + README + gitignore; full-stack check in the browser | P1 |

After slice 09, an **independent reviewer** (a fresh agent without this session's
context) checks every AC and every non-goal before the work is marked done.

---

## 12. Resolved questions (owner, 2026-10-21)

- **OQ-1 Studies placement → `TI → Networks`.** The seed reuses the owner's existing
  `TI` root; FR-10 was updated.
- **OQ-2 `usableHosts` → included.** IPv4 only, with the /31 and /32 rules in FR-2.
- **OQ-3 URL space → `/slab/cidr/*`.** Each future SE project gets its own
  `/slab/<project>/*` remote and one catalog card.

## 13. Implementation record (2026-10-21)

| Repo | Commits | Suite |
|---|---|---|
| `afwilto-slab-cidr-mngr` (new, local) | slices 01–05, contract/README, review follow-ups | RSpec 157 examples in Docker (`make test`) |
| `afwilto-platform-web-ui` | spec, §9 standard, slices 06–07, review follow-ups | cidr 49 · shell 34 · slab-home 6 |
| `afwilto-studies-mngr` | seed 0008 (red/green), source assertion | `go test ./...` (testcontainers) |
| root `afwilto-platform-iac` | smoke probes (red), compose/README | `scripts/smoke.sh` — all CIDR + seed probes OK |

- **Browser check:** `/slab` shows the section; `2001:4860:4860::8888/32` matches the
  reference values; the seeded note renders with KaTeX, Mermaid and both tables under
  `TI / Networks / CIDR` (the owner's existing TI was reused).
- **Independent review** (a fresh agent without this session's context): no blockers or
  majors. Findings 1–4 and 8 were fixed test-first. Findings 5–7 were resolved in these
  docs: semicolons stay as separators, `shared/ui/pages` is documented, and the frontend
  README lists the app.
- **Accepted risk:** the revival path of seed 0008 (down, then up) re-attaches the
  seed's own tags and keeps any rename the owner made before the down. This is a dev-only
  path; the up migration never touches rows that are alive.
- **Out of scope, still open:** `theater-mngr` can fail if it starts before its database
  is ready (`57P03`); `docker compose restart theater-mngr` recovers it.

