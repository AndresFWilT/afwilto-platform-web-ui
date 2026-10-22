# AFWILTO Frontend — Microfrontend Monorepo

Module Federation platform composed of a host shell and six remotes, plus
shared workspace packages. Architecture and per-app specs live in
[`docs/specs/`](docs/specs/) (start with `00-system-architecture.md`).

## Apps & ports

| App | Remote name | URL slice | Dev port |
|---|---|---|---|
| `apps/afwilto-shell-web-ui` | host (`shell`) | gateway, `/design-system`, 404 | 3000 |
| `apps/afwilto-homepage-web-ui` | `afwilto_home` | `/` | 3001 |
| `apps/afwilto-slab-homepage-web-ui` | `slab_home` | `/slab` | 3002 |
| `apps/afwilto-slab-subject-ud-web-ui` | `ud` | `/slab/ud/**` | 3003 |
| `apps/afwilto-slab-subject-mati-web-ui` | `mati` | `/slab/mati/**` | 3004 |
| `apps/afwilto-financial-status-web-ui` | `finance` | `/finance/**` | 3005 |
| `apps/afwilto-certifications-web-ui` | `certifications` | `/certifications/**` | 3006 |
| `apps/afwilto-love-points-bank-web-ui` | `love_points_bank` | `/love-points-bank/**` | 3007 |
| `apps/afwilto-studies-web-ui` | `studies` | `/studies/**` | 3008 |
| `apps/afwilto-cidr-web-ui` | `cidr` | `/slab/cidr/**` | 3009 |

Packages: `@afwilto/design-system`, `@afwilto/shared-types`,
`@afwilto/http-client` (consumed as TypeScript source via `workspace:*`).

## Dev workflow

```bash
pnpm install

# Remotes must be BUILT to serve remoteEntry.js — build once (or --watch), then preview:
pnpm --filter afwilto-homepage-web-ui build && pnpm --filter afwilto-homepage-web-ui preview &
pnpm --filter afwilto-slab-homepage-web-ui build && pnpm --filter afwilto-slab-homepage-web-ui preview &
# ...same for ud / mati / finance / certifications (only those you need)

# Host (dev mode with HMR):
pnpm --filter afwilto-shell-web-ui dev   # http://localhost:3000
```

Any MFE also runs standalone (`pnpm --filter <app> dev`) — each serves its own
URL space (e.g. the UD app redirects `/` → `/slab/ud`).

## Quality gates

```bash
pnpm -r test        # all vitest suites
pnpm -r build       # tsc --noEmit + vite build per app
pnpm -r typecheck   # packages
```

Remote URLs are overridable per environment via host env vars:
`VITE_REMOTE_{AFWILTO_HOME,SLAB_HOME,UD,MATI,FINANCE,CERTIFICATIONS,LOVE_POINTS_BANK,STUDIES,CIDR}_URL`.

New MFEs follow the atomic design + screaming architecture standard in
[`CLAUDE.md`](CLAUDE.md); `apps/afwilto-cidr-web-ui` is the reference.

The legacy monolith (`afwilto-slab-homepage-web-ui/` at this directory's
root) is archived — see its README.
