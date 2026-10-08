import { describe, expect, it } from "vitest";
import { awardSchema, catalogSchema, editSchema, redeemSchema } from "./rules";

const validBase = {
  awardedTo: "11111111-1111-4111-8111-111111111111",
  amount: 3,
  reason: "porque me contó del susto de anoche",
  occurredAt: new Date(Date.now() - 3600_000),
};

describe("reglas (espejo de RD-1..RD-4)", () => {
  it("acepta un abono válido", () => {
    expect(awardSchema.safeParse(validBase).success).toBe(true);
  });

  // RD-1
  it.each([0, -1, 6, 100])("rechaza monto %s", (amount) => {
    expect(awardSchema.safeParse({ ...validBase, amount }).success).toBe(false);
  });

  it("acepta los bordes 1 y 5", () => {
    expect(awardSchema.safeParse({ ...validBase, amount: 1 }).success).toBe(true);
    expect(awardSchema.safeParse({ ...validBase, amount: 5 }).success).toBe(true);
  });

  // RD-2
  it.each(["", "   ", "por linda", "  hola  "])("rechaza razón corta %j", (reason) => {
    expect(awardSchema.safeParse({ ...validBase, reason }).success).toBe(false);
  });

  it("cuenta caracteres útiles tras recortar", () => {
    expect(awardSchema.safeParse({ ...validBase, reason: "  diez chars  " }).success).toBe(true);
  });

  // RD-4
  it("rechaza fecha futura", () => {
    const future = new Date(Date.now() + 3600_000);
    expect(awardSchema.safeParse({ ...validBase, occurredAt: future }).success).toBe(false);
  });

  it("editSchema aplica las mismas reglas de monto y razón", () => {
    expect(editSchema.safeParse({ amount: 0, reason: validBase.reason, occurredAt: validBase.occurredAt }).success).toBe(false);
    expect(editSchema.safeParse({ amount: 2, reason: "corto", occurredAt: validBase.occurredAt }).success).toBe(false);
    expect(editSchema.safeParse({ amount: 2, reason: validBase.reason, occurredAt: validBase.occurredAt }).success).toBe(true);
  });
});

describe("reglas fase 2", () => {
  // RD-CAT-1, RD-CAT-2
  it("catalogSchema rechaza costo 0 y nombre corto", () => {
    expect(catalogSchema.safeParse({ name: "Noche de película", cost: 0 }).success).toBe(false);
    expect(catalogSchema.safeParse({ name: "ab", cost: 8 }).success).toBe(false);
    expect(catalogSchema.safeParse({ name: "Noche de película", cost: 8 }).success).toBe(true);
  });

  // RD-CAN-1, RD-CAN-9
  it("redeemSchema rechaza monto 0 y nota corta", () => {
    const uuid = "11111111-1111-4111-8111-111111111111";
    expect(redeemSchema.safeParse({ catalogItemId: uuid, amount: 0, note: "porque nos lo merecemos hoy" }).success).toBe(false);
    expect(redeemSchema.safeParse({ catalogItemId: uuid, amount: 3, note: "corto" }).success).toBe(false);
    expect(redeemSchema.safeParse({ catalogItemId: uuid, amount: 3, note: "porque nos lo merecemos hoy" }).success).toBe(true);
  });
});
