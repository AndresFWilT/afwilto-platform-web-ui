# Spec 13 — Financial Status: English-only + Goal/Credit 404 Fix

> Status: **Approved 2026-07-05 — Implemented**
> Scope: `apps/afwilto-financial-status-web-ui`.

---

## 1. Context / problem

Two bugs in the Financial Status feature:

1. **Order-dependent 404 opening a goal.** The finance MFE is mounted at
   `/finance/*` in both the shell and standalone (`main.tsx`), so every intra-app
   link must be the absolute path `/finance/...`. The **Goals grid** navigates to
   `/goals/${id}` (missing the `/finance` prefix) → the shell has no such route →
   404. The **Dashboard** goal list correctly uses `/finance/goals/${id}`. So a
   goal opens fine from the dashboard but 404s from the goals page — which looks
   "random / order-dependent" depending on where the user clicked. The **Credits
   grid** has the identical defect (`/credits/${id}`).

2. **Spanglish.** The UI mixes Spanish and English ("Metas", "Créditos",
   "Ingresos", "Gastos", "Resumen", "Cuota", "Deuda", "Fecha", "Monto",
   "Guardar", "Agregar…", "Transacciones", "Año", "por concepto/categoría", …).
   Everything user-facing must be English.

---

## 2. Non-goals

- No backend, data-model, route-path, or slug changes.
- No change to chart internal `dataKey` identifiers (they are not user-facing);
  only the display `name=` labels change.
- No new i18n framework — strings are translated in place (single-locale app).

---

## 3. Business rules

**BR-NAV1:** Every intra-app navigation target is the absolute path
`/finance/<section>[/<id>]` so it resolves identically under the shell and
standalone mounts.

**BR-I18N1:** No user-visible Spanish text remains. Canonical glossary:
Metas→Goals, Meta→Goal, Créditos→Credits, Crédito(loan)→Loan,
Tarjeta de Crédito→Credit Card, Cuota→Installment, Deuda→Debt, Ingresos→Income,
Gastos→Expenses, Resumen→Summary, Cancelar→Cancel, Agregar→Add, Nuevo→New,
Fecha→Date, Monto→Amount, Guardar→Save, Ahorro→Savings, Saldo→Balance,
Año→Year, mensual→monthly, activa→active, período→period,
Transacciones→Transactions, registrados→recorded, por concepto→by source,
por categoría→by category, financiero→financial, Préstamo→Loan.

---

## 4. Acceptance criteria

### AC-1 — Goal opens from the goals grid
Given goals exist, when the user clicks a goal card on `/finance/goals`,
then the app navigates to `/finance/goals/:id` and the goal detail renders
(no 404 / "not found").

### AC-2 — Credit opens from the credits grid
Given credits exist, when the user clicks a credit card on `/finance/credits`,
then the app navigates to `/finance/credits/:id` and the credit detail renders.

### AC-3 — Consistency
There is no intra-app navigation to a bare `/goals/...` or `/credits/...`
(missing the `/finance` prefix) anywhere in the app.

### AC-4 — English navigation
The finance sub-nav shows **"Goals"** and **"Credits"** (not "Metas"/"Créditos").

### AC-5 — No Spanish on rendered pages
Rendering the dashboard, incomes, expenses, goals and credits pages produces no
Spanish text from the glossary (BR-I18N1) — e.g. "Metas", "Créditos", "Ingresos",
"Gastos", "Resumen", "Deuda", "Cuota", "Fecha", "Monto", "Guardar".

---

## 5. Test plan

| Test file | Cases |
|---|---|
| `test/finance-fixes.test.tsx` | AC-1 goal card → detail renders under `/finance/goals/:id`; AC-2 credit card → detail; AC-4 nav labels "Goals"/"Credits"; AC-5 Spanish-blocklist absent on `/finance`, `/finance/incomes`, `/finance/expenses` |
| existing `test/App.test.tsx` | must stay green |

---

## 6. Implementation notes

- `pages/goals/GoalsPage.tsx` — `navigate(\`/goals/${goal.id}\`)` →
  `navigate(\`/finance/goals/${goal.id}\`)`.
- `pages/credits/CreditsPage.tsx` — `navigate(\`/credits/${c.id}\`)` →
  `navigate(\`/finance/credits/${c.id}\`)`.
- `layouts/AppLayout.tsx` — nav labels "Metas"→"Goals", "Créditos"→"Credits".
- Translate all Spanish per the glossary in: `pages/dashboard/DashboardPage.tsx`,
  `pages/incomes/IncomesPage.tsx`, `pages/expenses/ExpensesPage.tsx`,
  `pages/goals/GoalsPage.tsx`, `pages/goals/GoalDetailPage.tsx`,
  `pages/credits/CreditsPage.tsx`, `pages/credits/CreditDetailPage.tsx`.
  Chart `dataKey`s stay; only `name=` labels and visible copy change.
