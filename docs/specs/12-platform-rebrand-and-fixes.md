# Spec 12 — Platform Rebrand + UD & Certifications Fixes

> Status: **Approved 2026-07-05 — Implemented**
> Scope: shell/homepage branding, design-system chrome, UD "Databases" label bug,
> certifications create-flow navigation.

---

## 1. Context / problem

Four independent changes requested by the owner:

1. **Rebrand.** The platform-wide brand is currently "AFWILTO Software Lab", but
   *Software Lab* is actually one **product** of the academic career (the `/slab`
   MFE). The umbrella platform must be called **"AFWILTO Platform"**.
2. **Section title.** The home landing's section heading "Products" reads better
   as **"Features"**.
3. **Navbar.** The shared navbar must reflect the rebrand (and drop the dead
   `/projects` link).
4. **UD "Databases" bug.** In the Universidad Distrital MFE the project shown
   under **"Databases II"** is really a **Database I** project (TeatrosUD). DB II
   has no project of its own, so that entry must read **"Database I"**. The
   pre-existing empty "Database 1" stub is the redundant duplicate.
5. **Certifications create flow.** After creating a certification the app
   navigates to the new cert's **detail** page; it must instead return to the
   **certifications journey (list)**.

Backend check (requested): the theater manager (`TeatrosUD`) domain has **no**
"Databases II" nomenclature — it models theaters/plays/students only. No backend
change needed; the label lives purely in the UD MFE data.

---

## 2. Non-goals

- No change to product/route slugs (`databases-ii` slug is kept — only its display
  title changes — so the UD route contract stays green).
- No rewrite of the TeatrosUD project itself.
- No change to the certifications backend or the create payload.
- No new design-system components.

---

## 3. Acceptance criteria

### AC-1 — Brand renamed (navbar)
Given any page rendered through `BaseLayout`,
then the navbar brand reads **"AFWILTO Platform"** and never "AFWILTO Software Lab".

### AC-2 — Brand renamed (footer)
Given the footer,
then its copyright reads **"© {year} AFWILTO Platform. All rights reserved."**

### AC-3 — Home section title
Given the home landing page,
then the products section heading reads **"Features"** and there is no "Products"
heading.

### AC-4 — Navbar links
Given the default navbar,
then it contains a **Home** link (`/`) and links to the live products
(`/slab`, `/finance`, `/certifications`), and it contains **no** `/projects`
(dead) link.

### AC-5 — UD Databases label
Given the UD subject list,
then there is exactly **one** databases entry and its title is **"Database I"**;
there is **no** subject titled "Databases II" or "Database 1".
And the TeatrosUD project page badge reads **"Database I"**.

### AC-6 — UD route contract preserved
Given the UD route table,
then it still exposes the `databases-ii` slug (routing/pages untouched).

### AC-7 — Certifications create returns to the journey
Given the certification create form,
when a valid certification is created,
then a success toast is shown and the app navigates to the **certifications
list** (journey), not the detail page; the new certification is visible in the list.

---

## 4. Test plan

| Test file | Cases |
|---|---|
| `afwilto-homepage-web-ui/test/HomePage.test.tsx` | AC-1 brand "AFWILTO Platform" in banner; AC-2 footer brand; AC-3 "Features" heading + no "Products"; AC-4 nav links incl. Home + products, no `/projects` |
| `afwilto-slab-subject-ud-web-ui/test/databases-label.test.ts` | AC-5 UD_SUBJECTS: one "Database I", no "Databases II"/"Database 1" |
| `afwilto-slab-subject-ud-web-ui/test/routes-contract.test.ts` | AC-6 unchanged (still contains `databases-ii`) |
| `afwilto-certifications-web-ui/test/write.test.tsx` | AC-7 create navigates to list (update existing AC-1 case) |

---

## 5. Implementation notes

- `packages/design-system/src/templates/BaseLayout/BaseLayout.tsx` — brand
  `"AFWILTO Software Lab"` → `"AFWILTO Platform"`; `DEFAULT_NAV_LINKS` →
  `Home (/)`, `Software Lab (/slab)`, `Financial Status (/finance)`,
  `Certifications (/certifications)`.
- `packages/design-system/src/organisms/Footer/Footer.tsx` — brand string.
- `apps/afwilto-homepage-web-ui/src/pages/Home/HomePage.tsx` — "Products" → "Features".
- `apps/afwilto-shell-web-ui/src/pages/DesignSystem/DesignSystemPage.tsx` — brand
  mention → "AFWILTO Platform" (visible copy consistency).
- `apps/afwilto-slab-subject-ud-web-ui/src/pages/UniversidadDistrital/data.ts` —
  remove the `database-1` stub; rename the `databases-ii` entry title
  "Databases II" → "Database I" (DB-I description + TeatrosUD final project); keep slug.
- `.../subjects/databases-ii/TheaterApp.tsx` — Badge "Databases II" → "Database I".
- `apps/afwilto-certifications-web-ui/src/pages/Form/CertificationFormPage.tsx` —
  on submit `navigate('..')` (list) instead of `navigate('../${cert.id}')`.
