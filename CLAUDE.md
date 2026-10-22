# CLAUDE.md — Frontend workspace (`afwilto-platform-web-ui`)

Binding rules for every agent or human working in `frontend/`. Specs live in
`docs/specs/` (start at `00-system-architecture.md`). Spec-driven, test-first: no app
code without an approved spec and a failing test.

## Workspace facts

- pnpm workspace: `apps/*` (Module Federation host + remotes), `packages/*`
  (`@afwilto/design-system`, `@afwilto/http-client`, `@afwilto/shared-types`).
- Every remote exposes exactly `./App` and shares only `react`, `react-dom` and
  `react-router-dom` as singletons. It renders `<Routes>` inside the shell's router and
  never creates a second router when federated.
- Tests: `pnpm --filter <app> test` (Vitest + jsdom + Testing Library);
  `pnpm --filter <app> build` runs `tsc --noEmit` and then `vite build`.
- Ports: the shell is :3000; remotes are :3001–:3009; the next free remote port is
  **:3010**.

## MFE standard — atomic design + screaming architecture (spec 17 §9)

**Every MFE created from 2026-10-21 on MUST follow this standard.** Older apps are
grandfathered: don't restructure them unless a spec asks for it. The reference
implementation is `apps/afwilto-cidr-web-ui`.

### 1. Screaming top level

`src/` contains only these folders, plus `main.tsx` (the standalone entry) and
`vite-env.d.ts`:

```
src/
  app/                 # wiring only: App.tsx (the federated entry), routes, index.css,
                       # di/container.ts (the composition root; the only place that knows adapters)
  <bounded-context>/   # named after the business, e.g. cidr/, studies/ — never "core" or "common"
    domain/            # types and pure rules; no React, no I/O
    application/ports/ # interfaces the UI depends on (I<Thing>), plus domain errors
    infrastructure/    # adapters implementing the ports (http/, memory/ …)
  features/            # one folder per USE CASE, named after what the user does
    <use-case>/ui/{atoms,molecules,organisms,templates,pages}   # only the levels it needs
  shared/
    di/                # React context exposing the ports (no concrete adapter imports)
    lib/               # pure helpers and hooks
    ui/{atoms,molecules,organisms,templates}
```

Feature folders are named after behaviour (`cidr-to-range`, `address-aggregation`),
**never** after a technical role (`forms/`, `tables/`, `components/`, `utils/`).

### 2. Atomic levels

Inside any `ui/`, the levels rank `atoms < molecules < organisms < templates < pages`.

- A file imports only from its own level or a lower one. This applies across folders:
  a feature organism may use a shared molecule, never a shared template.
- **Atoms:** a single, domain-flavoured element (for example `MonoValue`). Generic
  atoms such as Button, Input, Text, Card and Alert come from `@afwilto/design-system`;
  don't re-create them.
- **Molecules:** small groups of atoms with one job.
- **Organisms:** self-contained sections such as forms and result tables. They get
  data through props and never call a service.
- **Templates:** layout and chrome only. They take slots (`children`) and know no data.
- **Pages:** the only level that calls `useServices()`, the port hook, and the only one
  that orchestrates loading, error and result state.

### 3. Dependency direction

- `features/*` may import `shared/*` plus `<context>/domain` and
  `<context>/application`.
- `features/*` never import each other or `app/`.
- `shared/` and `<context>/` never import `features/` or `app/`.
- Only `app/` imports `<context>/infrastructure`. Nothing calls `fetch(` outside
  `<context>/infrastructure`.
- HTTP status codes never cross a port. Adapters translate them into domain errors
  (for example a 422 becomes `<Context>ValidationError`).

### 4. Enforced by tests, not by this file

Every standard MFE ships two tests, and both run in `pnpm test`:

- `test/architecture.test.ts` scans every import under `src/` and fails on any
  violation of rules 1–3. Copy it from `apps/afwilto-cidr-web-ui`.
- `test/twoTailwindBuilds.test.ts`: the shell and each remote ship separate Tailwind
  builds, so never pair a base display, flex-direction or grid-cols utility with its
  responsive override (`hidden lg:block`, `grid-cols-1 md:grid-cols-2`). Use
  intrinsic layouts (`flex-wrap`, `grid-cols-[repeat(auto-fill,minmax(…))]`) or decide
  in JS.

### 5. Wiring checklist for a new remote

1. Create `apps/<name>` with `vite.config.ts` (federation `name`, `exposes:
   { './App': './src/app/App.tsx' }`) and a fixed `server`/`preview` port.
2. Add `.env.development` and `.env.production` with `VITE_API_URL`; don't commit
   secrets.
3. In the shell, add the remote in `vite.config.ts` (with a `VITE_REMOTE_<NAME>_URL`
   override), the `declare module` in `src/remotes/federation.d.ts`, the `lazy()` in
   `remotes.ts`, and the route in `router/AppRoutes.tsx`, each with a test.
4. In the root repo, add the compose service built from `docker/Dockerfile.mfe` and
   the `scripts/smoke.sh` probes for the remote entry and its cache policy.
