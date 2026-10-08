import { z } from "zod";

// Espejo de las reglas del backend (RD-1..RD-4). Los mensajes dicen qué hacer,
// no qué pasó: son la voz de la interfaz.

export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 5;
export const MIN_REASON = 10;

// Cuenta caracteres útiles tras recortar espacios, igual que el dominio en Go.
const trimmedLength = (s: string) => s.trim().length;

export const reasonSchema = z
  .string()
  .refine((s) => trimmedLength(s) >= MIN_REASON, {
    message:
      "La justificación necesita al menos 10 caracteres. Cuenta qué fue lo que te gustó.",
  });

export const amountSchema = z
  .number({ invalid_type_error: "Elige cuántos puntitos." })
  .int("Los puntitos son enteros.")
  .min(MIN_AMOUNT, "Mínimo un puntito.")
  .max(MAX_AMOUNT, "Máximo cinco puntitos.");

// occurred_at no puede ser futura (RD-4). Se recibe como Date local.
export const occurredAtSchema = z.date().refine((d) => d.getTime() <= Date.now(), {
  message: "La fecha del hecho no puede ser en el futuro.",
});

export const awardSchema = z.object({
  awardedTo: z.string().uuid("Elige a quién le abonas."),
  amount: amountSchema,
  reason: reasonSchema,
  occurredAt: occurredAtSchema,
});

export const editSchema = z.object({
  amount: amountSchema,
  reason: reasonSchema,
  occurredAt: occurredAtSchema,
});

export type AwardInput = z.infer<typeof awardSchema>;
export type EditInput = z.infer<typeof editSchema>;

// --- Fase 2: catálogo (RD-CAT-*) y canjes (RD-CAN-*) ---

export const MIN_COST = 1;
export const MIN_ITEM_NAME = 3;

export const catalogSchema = z.object({
  name: z
    .string()
    .refine((s) => s.trim().length >= MIN_ITEM_NAME, {
      message: "El nombre del plan necesita al menos 3 caracteres.",
    }),
  description: z.string().optional().default(""),
  cost: z
    .number({ invalid_type_error: "Escribe cuánto cuesta." })
    .int("El costo es un número entero.")
    .min(MIN_COST, "El costo debe ser al menos 1."),
});

export type CatalogInput = z.infer<typeof catalogSchema>;

// El canje valida monto y nota; la regla de saldo (no sobregiro) se comprueba contra el
// disponible en vivo en el componente, no en el esquema.
export const redeemSchema = z.object({
  catalogItemId: z.string().min(1, "Elige un plan."),
  amount: z
    .number({ invalid_type_error: "Escribe cuántos puntitos." })
    .int("Los puntitos son enteros.")
    .min(1, "Gasta al menos un puntito."),
  note: reasonSchema, // RD-CAN-9: el porqué del canje, ≥10 útiles, mismo mensaje
});

export type RedeemInput = z.infer<typeof redeemSchema>;
