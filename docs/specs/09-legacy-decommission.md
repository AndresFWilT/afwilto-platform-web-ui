# Spec 09 — Phase 8: Decommission `mfe_legacy`

> Status: **Approved** · Phase 8 (final) of the MFE migration
> Depends on: all previous specs

---

## 1. Architecture

### 1.1 Goal

The strangler is empty: since Phase 5 the legacy remote serves only its `*`
404. Remove it from the host entirely, let the host own the `*` route with
its local NotFoundPage, and archive the monolith.

### 1.2 Final gateway

| Path | Target |
|---|---|
| `/` | `afwilto_home/App` |
| `/design-system` | host DesignSystemPage |
| `/slab` | `slab_home/App` |
| `/slab/ud/*` | `ud/App` |
| `/slab/mati/*` | `mati/App` |
| `/finance/*` | `finance/App` |
| `/certifications/*` | `certifications/App` |
| `*` | host NotFoundPage |

## 2. Changes

| Module | Change |
|---|---|
| host `remotes.ts` / `federation.d.ts` / `vite.config.ts` | `mfe_legacy` entries removed |
| host `AppRoutes.tsx` | `*` → host NotFoundPage |
| `pnpm-workspace.yaml` | legacy monolith removed from workspace |
| monolith repo | README marked ARCHIVED; source preserved in its own git repo |

## 3–10. (Unchanged)

Interfaces, data model, flows, business logic, NFRs, technologies and error
handling are the union of Specs 02–08 final states; no new elements.

## 11. Acceptance Criteria

1. **AC-1** Host at `/home`, `/universidad-distrital/x`, `/uniandes`, or any
   unknown URL renders the host NotFoundPage (no legacy slot).
2. **AC-2** No reference to `mfe_legacy` remains in host source or config.
3. **AC-3** `pnpm -r build` and `pnpm -r test` pass across the workspace
   (legacy excluded from the workspace).
4. **AC-4** The archived monolith keeps its own git history with an ARCHIVED
   notice.
