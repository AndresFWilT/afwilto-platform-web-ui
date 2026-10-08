import { describe, expect, it } from "vitest";
import { formatEventDate, fromDateInputValue, toDateInputValue } from "./dates";

// Ancla "ahora" a un instante conocido en Bogotá: 2026-09-11 10:00 UTC = 05:00 Bogotá.
const now = new Date("2026-09-11T10:00:00Z");

describe("formatEventDate (America/Bogota)", () => {
  it("dice 'Hoy' para un hecho del mismo día en Bogotá", () => {
    expect(formatEventDate("2026-09-11T14:00:00Z", now)).toBe("Hoy");
  });

  it("dice 'Ayer' para el día anterior", () => {
    expect(formatEventDate("2026-09-10T14:00:00Z", now)).toBe("Ayer");
  });

  it("usa 'DD MES' para fechas más viejas del mismo año", () => {
    expect(formatEventDate("2026-09-05T14:00:00Z", now)).toBe("05 SEP");
  });

  it("agrega el año cuando no es el actual", () => {
    expect(formatEventDate("2025-12-31T14:00:00Z", now)).toBe("31 DIC 2025");
  });

  it("respeta el corte de día por zona horaria", () => {
    // 2026-09-11T02:00Z = 2026-09-10 21:00 en Bogotá → 'Ayer', no 'Hoy'.
    expect(formatEventDate("2026-09-11T02:00:00Z", now)).toBe("Ayer");
  });
});

describe("ida y vuelta del input de fecha", () => {
  it("no cruza de día al convertir a UTC y de vuelta", () => {
    const d = fromDateInputValue("2026-09-08");
    expect(toDateInputValue(d)).toBe("2026-09-08");
  });
});
