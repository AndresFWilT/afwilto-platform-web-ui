# Microfrontend Migration Plan — AFWILTO Software Lab

> Generated: 2026-06-29  
> Scope: `frontend/afwilto-slab-homepage-web-ui` → Module Federation monorepo

---

## 1. Current State Diagnosis

### What we have

The current monolith `afwilto-slab-homepage-web-ui` violates the single-responsibility principle at the application level. It simultaneously owns:

| Responsibility | Evidence |
|---|---|
| Global shell (Navbar, Footer, BaseLayout) | `design-system/templates/BaseLayout`, `design-system/organisms/Navbar` |
| Landing page | `pages/Home/HomePage.tsx` |
| UD landing + 20-subject catalog | `pages/UniversidadDistrital/` |
| 14 interactive UD subject UIs | `pages/UniversidadDistrital/subjects/` (ai/, cs2/, cs3/, os/, …) |
| MATI/Uniandes section | `pages/Uniandes/` |
| DI composition root for all 30 services | `di/container.ts` |
| Design system | `design-system/` |

Adding `mfe-finance` and `mfe-certifications` to this monolith would deepen the coupling, not fix it.

### Backend is already right

The backend is split by feature:

| Backend Service | Port | Frontend Consumers |
|---|---|---|
| `cs-manager` | 8081 | CS1 (RBT), CS2 (14 algorithms), CS3 (CriticalPath, TruthTable) |
| `theater-manager` | 8085 | Databases II (full Theater App) |
| `encoding-manager` | 8086 | Network Comm 2 (Huffman, Shannon-Fano) |
| `physics-manager` | 8087 | Physics Lab wizard |
| `network-comm-manager` | 8086 | NC1 (Weather Dashboard), NC3 (Mail Client) |
| `or-manager` | 8088 | OR1 (GraphicalMethod, MixedInteger) |
| `os-manager` | 8089 | Operative Systems (RoundRobin, MLFQ) |
| `ai-manager` | 8090 | AI1 (A*, DFS) |
| `programming-manager` | 8091 | BasicProg (TicTacToe), OOP (Scrabble), PM2 (Chess) |

The frontend migration follows the same split the backend already established.

---

## 2. Target Architecture

### Technology Choice: Module Federation

`@module-federation/vite` plugin. Reasons:
- Already on Vite — zero build-tool switch
- Runtime composition: MFEs deploy independently; host loads them on demand
- `shared` config forces `react`, `react-dom`, `react-router-dom` to be singletons (one copy in the browser regardless of how many MFEs load)
- Each MFE can be developed, tested, and deployed in isolation

Rejected alternatives:
- **iframe**: Full-page context isolation kills shared navigation state, deep-linking, and CSS theme sharing
- **build-time npm packages**: Not true MFE — everything still bundles together at deploy time
- **Single SPA**: Heavier framework overhead; Module Federation is native to Vite

### Monorepo Tooling: pnpm workspaces

Simple, no orchestration overhead for a solo developer. Add `nx` later if build caching becomes important.

---

## 3. Naming Convention

Three tiers, each with a distinct semantic:

| Pattern | Meaning | Rule |
|---|---|---|
| `afwilto-shell-web-ui` | Neutral infrastructure | The composition layer — hosts all MFEs, belongs to no specific domain |
| `afwilto-[domain]-web-ui` | Personal product domain | No academic affiliation (finance, certifications, root homepage) |
| `afwilto-slab-[domain]-web-ui` | Software lab — academic, no backend subject-manager counterpart | Slab-level pages that bridge domains (slab homepage) |
| `afwilto-slab-subject-[domain]-web-ui` | Academic subject MFE | Has a `afwilto-subject-[domain]-mngr` backend counterpart; `slab` marks it as frontend, `subject` mirrors the backend |

Backend naming reference (different pattern — do not copy into frontend): `afwilto-subject-[domain]-mngr`

### App names

| App | Repo name | Reasoning |
|---|---|---|
| Host shell | `afwilto-shell-web-ui` | Neutral infrastructure — no domain, hosts all MFEs |
| afwilto root homepage | `afwilto-homepage-web-ui` | Top-level personal brand landing — links to all products |
| Slab homepage | `afwilto-slab-homepage-web-ui` | Already exists; re-scoped to slab landing only (UD + MATI) |
| UD MFE | `afwilto-slab-subject-ud-web-ui` | Academic + mirrors `afwilto-subject-*-mngr` backend services |
| MATI MFE | `afwilto-slab-subject-mati-web-ui` | Same logic |
| Finance | `afwilto-financial-status-web-ui` | Personal product — no slab, no subject qualifier |
| Certifications | `afwilto-certifications-web-ui` | Same |

### Package names

| Package | Name |
|---|---|
| Design system | `@afwilto/design-system` |
| Shared types | `@afwilto/shared-types` |
| HTTP client | `@afwilto/http-client` |

**Note on the existing monolith:** `afwilto-slab-homepage-web-ui` currently handles everything (home, all UD routes, MATI). After migration it owns only `/slab/` — the slab landing page showing UD and MATI cards. The name finally becomes accurate without any rename.

**Note on the shell:** `afwilto-shell-web-ui` having no domain qualifier is intentional, not an anti-pattern. It composes all domains — academic and personal — so it belongs to none of them.

---

## 5. Monorepo Structure

```
afwilto-software-lab/
  frontend/
    apps/
      afwilto-shell-web-ui/                    ← Shell app (Module Federation HOST)
      afwilto-homepage-web-ui/                 ← afwilto root homepage MFE (NEW)
      afwilto-slab-homepage-web-ui/            ← Slab homepage MFE (existing repo, re-scoped)
      afwilto-slab-subject-ud-web-ui/          ← Universidad Distrital MFE
      afwilto-slab-subject-mati-web-ui/        ← MATI / Uniandes MFE
      afwilto-financial-status-web-ui/         ← Financial Status MFE
      afwilto-certifications-web-ui/           ← Certifications & Goals MFE
    packages/
      design-system/              ← @afwilto/design-system (shared)
      shared-types/               ← @afwilto/shared-types (Result, domain types)
      http-client/                ← @afwilto/http-client (IHttpClient, FetchHttpClient)
    pnpm-workspace.yaml
  backend/                        ← (unchanged)
```

---

## 6. Role of Each App

### 4.1 HOST (`apps/host`)

**Owns:**
- The global `<Navbar>` — links to all top-level sections
- The global `<Footer>`
- `<BaseLayout>` template (Navbar + Footer wrapper)
- Root React Router that dispatches URL prefixes to MFEs
- `<NotFoundPage>` (404)
- `<DesignSystemPage>` showcase at `/design-system`
- Global `<ErrorBoundary>` wrapping each MFE slot
- `<Suspense>` loading state while MFE chunks load

**Does NOT own:**
- Any business page
- Any service port or adapter
- Any university or domain data

**URL gateway (host router):**
```
/                → afwilto-homepage-web-ui   (RemoteApp: AfwiltoHomeApp)
/slab            → afwilto-slab-homepage-web-ui (RemoteApp: SlabHomeApp)
/slab/ud/**      → afwilto-slab-subject-ud-web-ui (RemoteApp: UDApp)
/slab/mati/**    → afwilto-slab-subject-mati-web-ui (RemoteApp: MATIApp)
/finance/**      → afwilto-financial-status-web-ui (RemoteApp: FinanceApp)
/certifications/**→ afwilto-certifications-web-ui (RemoteApp: CertificationsApp)
/design-system   → host-local DesignSystemPage
*                → NotFoundPage
```

The host uses `React.lazy(() => import('afwilto_home/App'))` for each remote — Module Federation resolves these at runtime from each MFE's served bundle.

**Module Federation host config (vite.config.ts):**
```ts
federation({
  name: 'shell',
  remotes: {
    afwilto_home:     'http://localhost:3001/assets/remoteEntry.js',
    slab_home:        'http://localhost:3002/assets/remoteEntry.js',
    ud:               'http://localhost:3003/assets/remoteEntry.js',
    mati:             'http://localhost:3004/assets/remoteEntry.js',
    finance:          'http://localhost:3005/assets/remoteEntry.js',
    certifications:   'http://localhost:3006/assets/remoteEntry.js',
  },
  shared: ['react', 'react-dom', 'react-router-dom'],
})
```

In production, replace `localhost` URLs with CDN/deployment URLs via env vars.

---

### 4.2 AFWILTO ROOT HOMEPAGE (`apps/afwilto-homepage-web-ui`)

**Owns:** `/` — the top-level personal brand landing page.

**New MFE.** The entry point for the entire afwilto ecosystem.

**Content:** Shows all sub-products with navigation cards:
- Software Lab (→ `/slab`) — academic projects
- Financial Status (→ `/finance`) — personal finance tracker
- Certifications (→ `/certifications`) — certs catalog and learning roadmap

**No backend calls** — pure presentation. Must be the fastest-loading MFE.

**Exposes to host:**
```ts
exposes: { './App': './src/App.tsx' }
```

---

### 4.3 SLAB HOMEPAGE (`apps/afwilto-slab-homepage-web-ui`)

**Owns:** `/slab` — the software lab landing page.

**Re-scoped from:** existing `afwilto-slab-homepage-web-ui` monolith.

**What it keeps:** `pages/Home/HomePage.tsx` content (university cards for UD and MATI). The current "HomePage" IS the slab homepage — it shows UD and Uniandes cards. Renamed internally to `SlabPage` for clarity.

**What it loses:** All `/universidad-distrital/**` and `/uniandes/**` routes (those move to their own MFEs). The root `/` route (that moves to `afwilto-homepage-web-ui`).

**No backend calls** — pure presentation.

**Exposes to host:**
```ts
exposes: { './App': './src/App.tsx' }
```

---

### 4.4 UNIVERSIDAD DISTRITAL MFE (`apps/afwilto-slab-subject-ud-web-ui`)

**Owns:** `/slab/ud/**`

This is the largest MFE — it absorbs the entire `pages/UniversidadDistrital/` tree from the monolith. Internally, it follows the same **feature-by-backend-service** split the backend already uses, implemented as **lazy-loaded code chunks** (not separate Module Federation remotes, which would create excessive overhead for a solo dev).

**Exposes to host:**
```ts
exposes: { './App': './src/App.tsx' }
```

**Internal feature structure (matches backend microservices):**

```
afwilto-slab-subject-ud-web-ui/src/
  App.tsx                         ← internal BrowserRouter for /slab/ud/**
  pages/
    UniversidadDistritalPage.tsx  ← UD landing: subject grid
  features/
    cs/                           ← Backend: cs-manager:8081
    │   CS1 (RBT), CS2 (14 algos), CS3 (CriticalPath, TruthTable)
    programming/                  ← Backend: programming-manager:8091
    │   BasicProg (TicTacToe), OOP (Scrabble), PM2 (Chess)
    os/                           ← Backend: os-manager:8089
    │   Operative Systems (RoundRobin, MLFQ)
    ai/                           ← Backend: ai-manager:8090
    │   AI1 (A*, DFS)
    networks/                     ← Backend: network-comm:8086 + encoding:8086
    │   NC1 (Weather), NC2 (Encoding), NC3 (MailClient)
    databases/                    ← Backend: theater-manager:8085
    │   DB1 (placeholder), DB2 (Theater App)
    or/                           ← Backend: or-manager:8088
    │   OR1 (GraphicalMethod, MixedInteger)
    physics/                      ← Backend: physics-manager:8087
    │   Physics Lab wizard
  application/ports/              ← only UD-relevant service ports
  infrastructure/adapters/        ← only UD-relevant adapters
  di/container.ts                 ← only UD services, not finance/certs
  design-system/                  ← consumed from @afwilto/design-system
```

**Why not separate Module Federation remotes per UD subject group?**

For a personal portfolio (single developer), the overhead of 8 additional repos, 8 CI pipelines, 8 deployment targets, and 8 Module Federation remote configurations outweighs the benefit. Code isolation (lazy chunks) achieves the same development-time independence. The split into separate MFEs makes sense when different teams own different subject groups, or when deploy frequency diverges significantly (e.g., the OR module gets updated weekly while the databases module is stable for months). For now, keep UD as one MFE and track the feature boundaries explicitly in the folder structure.

**Future split trigger:** If mfe-ud's bundle exceeds ~2MB gzipped or if any feature group starts having its own backend deploys ahead of the rest, extract it to its own MFE at that point.

---

#### UD Subject Analysis: What Goes Where

| Subject | Feature Group | Backend | Components | Complexity |
|---|---|---|---|---|
| Computer Science 1 | `features/cs` | cs-manager | RBT Visualizer (interactive canvas) | Medium |
| Computer Science 2 | `features/cs` | cs-manager | 14 algorithm visualizers (graphs, trees, hashing) | High |
| Computer Science 3 | `features/cs` | cs-manager | CriticalPath network graph, TruthTable | Medium |
| Basic Programming | `features/programming` | programming-manager | TicTacToe game board | Low |
| Object-Oriented Programming | `features/programming` | programming-manager | Scrabble board + tile rack | Medium |
| Programming Models 2 | `features/programming` | programming-manager | Chess board + full game logic | High |
| Operative Systems | `features/os` | os-manager | RoundRobin + MLFQ schedulers, Gantt charts | High |
| Artificial Intelligence 1 | `features/ai` | ai-manager | A* graph canvas, DFS stack visualizer | Medium |
| Network Comm 1 | `features/networks` | network-comm-manager | Weather dashboard with charts | Medium |
| Network Comm 2 | `features/networks` | encoding-manager | Huffman + Shannon-Fano encoding app | Medium |
| Network Comm 3 | `features/networks` | network-comm-manager | Mail client (login, inbox, compose, view) | High |
| Databases I | `features/databases` | — | Placeholder (SubjectPage) | Low |
| Databases II | `features/databases` | theater-manager | Theater management (8 views, auth flow) | High |
| Physics Lab | `features/physics` | physics-manager | Multi-step measurement wizard | Medium |
| Operations Research 1 | `features/or` | or-manager | LP graphical method, MIP solver | High |

Subjects still at placeholder state (`SubjectPage` with no children):
`advanced-programming`, `programming-models-1`, `software-engineer-fundamentals`, `advanced-software-engineering`, `artificial-intelligence-2`, `database-1` → stay as SubjectPage stubs within mfe-ud, no feature folder needed until content is built.

---

### 4.5 MATI MFE (`apps/afwilto-slab-subject-mati-web-ui`)

**Owns:** `/slab/mati/**`

**Migrated from:** `pages/Uniandes/`

**Current state:** Landing page exists (`UniandesPage`), subjects are mostly stubs. MATI content is "soon".

**Structure:**
```
afwilto-slab-subject-mati-web-ui/src/
  App.tsx
  pages/
    MatiPage.tsx          ← subject grid (renamed from UniandesPage)
    data.ts               ← UNIANDES_INFO, UNIANDES_SUBJECTS
  features/               ← populated as MATI content arrives
```

This MFE starts small (just the landing) and grows as MATI modules are built, without touching any other MFE.

---

### 4.6 FINANCE MFE (`apps/afwilto-financial-status-web-ui`)

**Owns:** `/finance/**`

**Source:** `personal-financial-status/afwt-financial-status-frontend/`

The finance frontend uses a different internal architecture (feature-based, not hexagonal). **Do not refactor its internals during MFE integration.** Wrap it as-is.

**Integration strategy:**
1. Copy/symlink the finance frontend into `apps/mfe-finance` (or use it in-place with pnpm workspace)
2. Add Module Federation remote configuration to its `vite.config.ts`
3. Expose `./App` pointing to its root component
4. Adapt its Navbar/Footer: replace with the design system `<BaseLayout>` (from `@afwilto/design-system`) so global shell is consistent — OR simply remove its Navbar/Footer and let the host shell handle them
5. Change its router base from `/` to `/finance`

**Concern:** The finance app currently has its own design tokens (`src/tokens.ts`). Decision: accept style divergence initially (the finance domain has a different visual identity) and align tokens in a follow-up pass after the MFE wiring is working.

---

### 4.7 CERTIFICATIONS MFE (`apps/afwilto-certifications-web-ui`)

**Owns:** `/certifications/**`

**New project.** Start from the same template as `mfe-ud` (Vite + React 19 + TypeScript + Tailwind v4 + Module Federation).

**Proposed feature set:**
- **Catalog page**: grid of obtained certifications (provider, name, date, badge image, link)
- **Roadmap page**: goals/target certifications with status (planned, in-progress, obtained)
- **Detail page**: individual cert with description, skills, relevance

**Architecture:**
- No backend initially — data sourced from static JSON or TypeScript data files
- Hexagonal boundary still applies (even for static data, use a port `ICertificationService` with a static adapter) so future API backend can be swapped in without touching pages
- Consumes `@afwilto/design-system`

---

## 7. Shared Packages

### 5.1 `@afwilto/design-system`

**Extracted from:** `src/design-system/` + `src/index.css`

Contains:
- `tokens/` — colors, spacing, typography
- `atoms/` — Button, Text, Input, Badge, Spinner
- `molecules/` — Card, Alert, FormField, ErrorBoundary
- `organisms/` — Navbar, Footer
- `templates/` — BaseLayout, AuthLayout

All current CLAUDE.md rules (Atomic Design boundaries, Tailwind v4 gotchas, dark theme) carry forward into this package's own CLAUDE.md.

**Consumed by:** host, mfe-home, mfe-ud, mfe-mati, mfe-certifications (and eventually mfe-finance after token alignment)

**Distribution:** pnpm workspace local package. No npm publish needed while everything lives in the same monorepo.

```json
// package.json in each app
{
  "dependencies": {
    "@afwilto/design-system": "workspace:*"
  }
}
```

At build time, Module Federation's `shared` config is used for React and React Router, but NOT for `@afwilto/design-system` — it gets bundled into each MFE separately. This avoids version mismatch issues and keeps MFEs truly independent at the CSS level.

### 5.2 `@afwilto/shared-types`

**Extracted from:** `src/domain/shared/Result.ts`

Contains: `Result<T, E>` type and any future shared domain primitives.

### 5.3 `@afwilto/http-client`

**Extracted from:** `src/application/ports/IHttpClient.ts` + `src/infrastructure/adapters/http/FetchHttpClient.ts`

Contains the `IHttpClient` interface and `FetchHttpClient` implementation.

Consumed by all MFEs that talk to a backend (mfe-ud, mfe-finance).

---

## 8. Cross-MFE Communication

With horizontal split (URL-based), MFEs have minimal need to communicate. The primary mechanisms:

| Need | Solution |
|---|---|
| Navigation between sections | URL: `<a href="/finance">` or React Router `<Link>` to cross-MFE links |
| Design consistency | Shared `@afwilto/design-system` package |
| Global auth (future) | Custom Event bus or shared localStorage; host injects auth context via Module Federation `shared` |
| Loading state | Host shows `<Suspense>` spinner while MFE chunk loads |

No event bus is needed today. Do not add one preemptively.

---

## 9. Migration Phases

### Phase 0 — Monorepo + Packages (Target: 2 weeks)

**Goal:** Zero functional change. The existing app still works. Packages exist. Infrastructure is ready.

Steps:
1. Add `pnpm-workspace.yaml` at `frontend/` root
2. Create `packages/design-system/` — copy `src/design-system/` + `src/index.css` (tokens)
3. Create `packages/shared-types/` — copy `domain/shared/Result.ts`
4. Create `packages/http-client/` — copy `IHttpClient.ts` + `FetchHttpClient.ts`
5. Update `afwilto-slab-homepage-web-ui` to import from packages instead of local `src/design-system`
6. Confirm `npm run build` still passes 0 errors

**Acceptance criteria:** Existing app builds and runs identically. Packages each have their own `package.json` and `tsconfig.json`.

---

### Phase 1 — Host App (Target: 1 week)

**Goal:** A host shell that renders the existing monolith as one big remote (strangler fig pattern).

Steps:
1. Create `apps/host` (Vite + React + Module Federation host plugin)
2. Move `Navbar`, `Footer`, `BaseLayout` from monolith into host (consuming `@afwilto/design-system`)
3. Configure the existing `afwilto-slab-homepage-web-ui` as a temporary Module Federation remote named `mfe_legacy`
4. Host route `/**` → `mfe_legacy/App` — user sees no change
5. Move `DesignSystemPage` and `NotFoundPage` to host
6. Set the primary entry point to the host (update deployment / dev scripts)

**Acceptance criteria:** All existing routes still work. Host is the entry point. mfe_legacy serves everything else.

---

### Phase 2 — Slab Homepage MFE (Target: 3 days)

**Goal:** Re-scope the existing monolith to own only `/slab`.

Steps:
1. Strip `afwilto-slab-homepage-web-ui` down to only `UniversidadDistritalPage` + Uniandes card content (rename internally to `SlabPage`)
2. Configure as Module Federation remote (`exposes: { './App': './src/App.tsx' }`)
3. Register in host: `/slab` → `slab_home/App`
4. All other routes remain in mfe_legacy for now

**Acceptance criteria:** `/slab` shows the UD + MATI cards. The app runs standalone.

---

### Phase 3 — afwilto Root Homepage MFE (Target: 3 days)

**Goal:** Create the new top-level personal brand entry point.

Steps:
1. Create `apps/afwilto-homepage-web-ui` from Vite template
2. Build the root landing page with cards for: Software Lab (→ `/slab`), Finance (→ `/finance`), Certifications (→ `/certifications`)
3. Configure as Module Federation remote
4. Register in host: `/` → `afwilto_home/App`
5. Remove `/` and `/home` from mfe_legacy

**Acceptance criteria:** `/` shows the afwilto root landing. MFE runs standalone.

---

### Phase 4 — UD MFE (Target: 2 weeks)

**Goal:** All `/slab/ud/**` routes move out of mfe_legacy into `afwilto-slab-subject-ud-web-ui`.

Steps:
1. Create `apps/afwilto-slab-subject-ud-web-ui` with Module Federation remote config
2. Set up internal router for `/slab/ud/**`
3. Create `features/` folder structure (cs, programming, os, ai, networks, databases, or, physics)
4. **Migrate by feature group in this order** (least risky → most risky):
   a. `features/physics` — one wizard, one backend service, isolated
   b. `features/or` — two pages, one backend service
   c. `features/ai` — two pages, one backend service
   d. `features/os` — two schedulers, one backend service
   e. `features/programming` — TicTacToe, Scrabble, Chess
   f. `features/databases` — DB stubs + Theater App (most views)
   g. `features/networks` — Weather + Encoding + MailClient
   h. `features/cs` — largest (RBT + 14 CS2 algorithms + CS3)
5. Migrate ports + adapters only for UD services to this MFE's DI container
6. Migrate `UniversidadDistritalPage` + `data.ts` (UD landing at `/slab/ud`)
7. Register in host: `/slab/ud/**` → `ud/App`
8. Remove UD routes from mfe_legacy

Each step in 4a-4h is a separate commit. The DI container grows incrementally.

**URL change:** `/universidad-distrital/**` → `/slab/ud/**` (accepted breaking change).

**Acceptance criteria:** All UD routes work via host under the new prefix. MFE runs standalone.

---

### Phase 5 — MATI MFE (Target: 3 days)

Steps:
1. Create `apps/afwilto-slab-subject-mati-web-ui`
2. Migrate `UniandesPage` + `data.ts`, rename to `MatiPage`
3. Register in host: `/slab/mati/**` → `mati/App`
4. Remove Uniandes routes from mfe_legacy

**URL change:** `/uniandes/**` → `/slab/mati/**`.

---

### Phase 6 — Finance MFE (Target: 1 week)

Steps:
1. Copy `personal-financial-status/afwt-financial-status-frontend/` → `apps/afwilto-financial-status-web-ui`
2. Add `@module-federation/vite` plugin to its `vite.config.ts`
3. Expose `./App` pointing to its root component
4. Remove the finance app's Navbar/Footer — host shell provides them
5. Change its base router path to `/finance`
6. Register in host: `/finance/**` → `finance/App`

**Note:** Do not refactor finance app internals during this phase. Integration first, alignment later.

---

### Phase 7 — Certifications MFE (Target: 1 week)

Steps:
1. Create `apps/afwilto-certifications-web-ui` from Vite template
2. Define `ICertificationService` port (static adapter for now, data in `.ts` files)
3. Build catalog + roadmap + detail pages
4. Register in host: `/certifications/**` → `certifications/App`
5. Remove mfe_legacy if it now serves no routes (or leave it as a safety net for a sprint)

---

### Phase 8 — Decommission mfe_legacy (Target: 1 week)

1. Verify no routes remain in mfe_legacy
2. Archive the original `afwilto-slab-homepage-web-ui` monolith source (it now lives re-scoped in `apps/`)
3. Update all CI/CD references
4. Final build verification across all MFEs

---

## 10. Dev Workflow

### Starting everything locally

```bash
# Terminal 1 — shared packages (watch mode)
pnpm --filter @afwilto/design-system dev

# Terminal 2 — host
pnpm --filter host dev          # http://localhost:3000

# Terminal 3..N — MFEs (only those being actively worked on)
pnpm --filter mfe-home dev      # http://localhost:3001
pnpm --filter mfe-ud dev        # http://localhost:3002
```

### Developing a single MFE in isolation

```bash
# mfe-ud starts standalone without the host
cd apps/mfe-ud
pnpm dev  # serves at :3002, has its own Navbar via @afwilto/design-system
```

### Port allocation

| App | Dev port |
|---|---|
| `afwilto-shell-web-ui` | 3000 |
| `afwilto-homepage-web-ui` | 3001 |
| `afwilto-slab-homepage-web-ui` | 3002 |
| `afwilto-slab-subject-ud-web-ui` | 3003 |
| `afwilto-slab-subject-mati-web-ui` | 3004 |
| `afwilto-financial-status-web-ui` | 3005 |
| `afwilto-certifications-web-ui` | 3006 |

---

## 11. Naming & Conventions Carried Forward

All current CLAUDE.md rules from `afwilto-slab-homepage-web-ui` carry into every new MFE that touches UD content. Specifically:
- Hexagonal boundary (pages never call `fetch` directly — ports via `useServices()`)
- Atomic Design layers within each MFE's design system consumption
- `erasableSyntaxOnly: true` — no TypeScript parameter properties
- Tailwind v4 CSS declaration order gotcha — overrides via `style={{}}`
- Dark theme always
- No external libraries without explicit instruction

Each MFE gets its own `CLAUDE.md` that `@import`s the relevant rules plus any MFE-specific additions.

---

## 12. What Each Thing Is — Summary

| App | Role | URL Slice | Backend Services | From |
|---|---|---|---|---|
| `afwilto-shell-web-ui` | Shell — Navbar, Footer, router, 404 | `*` (gateway) | None | New |
| `afwilto-homepage-web-ui` | afwilto root landing — links to all products | `/` | None | New |
| `afwilto-slab-homepage-web-ui` | Slab landing — UD + MATI cards | `/slab` | None | `pages/Home/` (re-scoped) |
| `afwilto-slab-subject-ud-web-ui` | All UD subjects | `/slab/ud/**` | cs, theater, encoding, physics, network-comm, or, os, ai, programming managers | `pages/UniversidadDistrital/` |
| `afwilto-slab-subject-mati-web-ui` | MATI / Uniandes subjects | `/slab/mati/**` | TBD | `pages/Uniandes/` |
| `afwilto-financial-status-web-ui` | Personal financial tracking | `/finance/**` | finance backend | existing app |
| `afwilto-certifications-web-ui` | Certs catalog + learning roadmap | `/certifications/**` | None (static initially) | New |
| `@afwilto/design-system` | Shared UI library | — | — | `src/design-system/` |
| `@afwilto/shared-types` | Shared domain primitives | — | — | `src/domain/shared/` |
| `@afwilto/http-client` | Shared HTTP abstraction | — | — | `src/infrastructure/adapters/http/` |
