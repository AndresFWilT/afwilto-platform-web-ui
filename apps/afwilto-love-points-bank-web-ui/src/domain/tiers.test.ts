import { describe, expect, it } from "vitest";
import { tierFor } from "./tiers";

// Espejo del backend: ≤5 baratito, 6..50 medio, ≥51 alto.
describe("tierFor (derivación del nivel)", () => {
  it.each([
    [1, "baratito"],
    [5, "baratito"],
    [6, "medio"],
    [50, "medio"],
    [51, "alto"],
    [500, "alto"],
  ] as const)("cost %i → %s", (cost, expected) => {
    expect(tierFor(cost)).toBe(expected);
  });
});
