import type { Tier } from "../api/types";

// Espejo de domain.TierFor en el backend y de la columna generada en Postgres.
// Umbrales: ≤5 baratito, 6..50 medio, ≥51 alto. Fuente única en el front.
export function tierFor(cost: number): Tier {
  if (cost <= 5) return "baratito";
  if (cost <= 50) return "medio";
  return "alto";
}

export const TIER_LABEL: Record<Tier, string> = {
  baratito: "Baratito",
  medio: "Medio",
  alto: "Alto",
};

// El nivel "alto" usa el oro; los otros, tonos teal tenues. Única fuente de la
// asociación nivel → color en el front (token CSS).
export const TIER_COLOR_VAR: Record<Tier, string> = {
  baratito: "var(--tier-baratito)",
  medio: "var(--tier-medio)",
  alto: "var(--tier-alto)",
};

export const TIER_ORDER: Tier[] = ["baratito", "medio", "alto"];
