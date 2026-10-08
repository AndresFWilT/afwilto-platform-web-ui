import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { awardSchema, type AwardInput, MAX_AMOUNT } from "../domain/rules";
import { fromDateInputValue, toDateInputValue } from "../domain/dates";
import { ApiError } from "../api/client";
import type { AwardBody } from "../api/entries";
import type { Member } from "../api/types";
import styles from "./DepositSlip.module.css";

interface Props {
  members: Member[];
  currentMember: string;
  onAward: (body: AwardBody) => Promise<unknown>;
}

// mapea el code de dominio del backend al campo del formulario (plan §5: el mensaje
// aparece junto al campo correcto).
const FIELD_BY_CODE: Record<string, keyof AwardInput> = {
  reason_too_short: "reason",
  amount_out_of_range: "amount",
  future_date: "occurredAt",
  self_award: "awardedTo",
  member_not_found: "awardedTo",
};

// La boleta de abono: el formulario está presente, no detrás de un botón "+".
// El campo grande es la justificación; el monto es un detalle.
export function DepositSlip({ members, currentMember, onAward }: Props) {
  const other = members.find((m) => m.id !== currentMember);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AwardInput>({
    resolver: zodResolver(awardSchema),
    defaultValues: {
      awardedTo: other?.id ?? "",
      amount: 1,
      reason: "",
      occurredAt: new Date(),
    },
  });

  // Si cambia el titular actual, el destinatario por defecto es el otro.
  useEffect(() => {
    if (other) setValue("awardedTo", other.id);
  }, [other, setValue]);

  const amount = watch("amount");
  const awardedTo = watch("awardedTo");
  const [justSealed, setJustSealed] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    const body: AwardBody = {
      awarded_to: data.awardedTo,
      amount: data.amount,
      reason: data.reason.trim(),
      occurred_at: data.occurredAt.toISOString(),
    };
    try {
      await onAward(body);
      // Al guardar bien: se limpia el porqué, se conserva destinatario, gesto de sellado.
      reset({ awardedTo: data.awardedTo, amount: 1, reason: "", occurredAt: new Date() });
      setJustSealed(true);
      window.setTimeout(() => setJustSealed(false), 220);
    } catch (err) {
      // La API falló: el texto NO se pierde (no reseteamos). Mostramos junto al campo.
      if (err instanceof ApiError) {
        const field = FIELD_BY_CODE[err.code];
        setError(field ?? "reason", { message: err.detail || "No se pudo guardar. Intenta otra vez." });
      } else {
        setError("reason", { message: "No se pudo guardar. Revisa tu conexión e intenta otra vez." });
      }
    }
  });

  const recipient = members.find((m) => m.id === awardedTo);

  return (
    <form
      className={`${styles.slip} ${justSealed ? styles.sealed : ""}`}
      onSubmit={onSubmit}
      aria-label="Boleta de abono"
      noValidate
    >
      <div className={styles.header}>
        <span className={styles.headerLabel}>Boleta de abono</span>
        {recipient && <span className={styles.headerTo}>a {recipient.display_name}</span>}
      </div>

      {members.length > 2 && (
        <label className={styles.field}>
          <span className={styles.fieldLabel}>A quién</span>
          <select className={styles.select} {...register("awardedTo")}>
            {members
              .filter((m) => m.id !== currentMember)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
          </select>
        </label>
      )}

      <fieldset className={styles.field}>
        <legend className={styles.fieldLabel}>Cuántos puntitos</legend>
        <div className={styles.amountRow} role="radiogroup" aria-label="Cantidad de puntitos">
          {Array.from({ length: MAX_AMOUNT }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={amount === n}
              className={`${styles.amountBtn} ${amount === n ? styles.amountActive : ""}`}
              onClick={() => setValue("amount", n, { shouldValidate: true })}
            >
              {n}
            </button>
          ))}
        </div>
        {errors.amount && <p className={styles.error}>{errors.amount.message}</p>}
      </fieldset>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>El porqué</span>
        <textarea
          className={styles.reason}
          rows={4}
          placeholder="Cuenta qué fue lo que te gustó."
          aria-invalid={!!errors.reason}
          {...register("reason")}
        />
        {errors.reason && <p className={styles.error}>{errors.reason.message}</p>}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>De qué día</span>
        <input
          className={styles.date}
          type="date"
          max={toDateInputValue(new Date())}
          defaultValue={toDateInputValue(new Date())}
          onChange={(e) => setValue("occurredAt", fromDateInputValue(e.target.value), { shouldValidate: true })}
        />
        {errors.occurredAt && <p className={styles.error}>{errors.occurredAt.message}</p>}
        {errors.awardedTo && <p className={styles.error}>{errors.awardedTo.message}</p>}
      </label>

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Sellando…" : "Sellar abono"}
      </button>
    </form>
  );
}
