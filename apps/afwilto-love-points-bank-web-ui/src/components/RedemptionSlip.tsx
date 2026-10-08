import { useState } from "react";
import { redeemSchema } from "../domain/rules";
import { ApiError } from "../api/client";
import type { RedeemBody } from "../api/redemptions";
import type { CatalogItem } from "../api/types";
import { tierFor } from "../domain/tiers";
import styles from "./DepositSlip.module.css";

interface Props {
  items: CatalogItem[]; // solo activos
  available: number; // saldo disponible de quien canjea
  onRedeem: (body: RedeemBody) => Promise<unknown>;
}

// La boleta de canje: elegir un plan precarga su costo (híbrido), el monto es editable y
// se valida contra el saldo disponible en vivo. La nota (el porqué) es obligatoria.
export function RedemptionSlip({ items, available, onRedeem }: Props) {
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justSealed, setJustSealed] = useState(false);

  const selected = items.find((i) => i.id === itemId);

  const chooseItem = (id: string) => {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    if (item) setAmount(item.cost); // RD-CAN-5: precarga el costo del plan
    setError(null);
  };

  const overBalance = amount > available;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = redeemSchema.safeParse({ catalogItemId: itemId, amount, note });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Revisa los datos.");
      return;
    }
    if (overBalance) {
      setError(`No te alcanza: tienes ${available} disponibles.`);
      return;
    }
    setBusy(true);
    try {
      await onRedeem({ catalog_item_id: itemId, amount, note: note.trim() });
      setNote("");
      setAmount(selected ? selected.cost : 0);
      setJustSealed(true);
      window.setTimeout(() => setJustSealed(false), 220);
    } catch (err) {
      // El texto no se pierde. Mostramos el mensaje del backend (p. ej. carrera perdida).
      setError(err instanceof ApiError ? err.detail || "No se pudo canjear." : "No se pudo canjear.");
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.slip}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>Boleta de canje</span>
        </div>
        <p className={styles.fieldLabel}>
          Todavía no hay planes activos. Crea uno en la pestaña Planes.
        </p>
      </div>
    );
  }

  return (
    <form
      className={`${styles.slip} ${justSealed ? styles.sealed : ""}`}
      onSubmit={submit}
      aria-label="Boleta de canje"
      noValidate
    >
      <div className={styles.header}>
        <span className={styles.headerLabel}>Boleta de canje</span>
        <span className={styles.headerTo}>{available} disponibles</span>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Qué plan</span>
        <select
          className={styles.select}
          value={itemId}
          onChange={(e) => chooseItem(e.target.value)}
          aria-label="Plan a canjear"
        >
          <option value="" disabled>
            Elige un plan
          </option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} — cuesta {i.cost}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Cuántos puntitos</span>
        <input
          className={styles.date}
          type="number"
          min={1}
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          aria-label="Puntitos a gastar"
          aria-invalid={overBalance}
        />
        {selected && (
          <span className={styles.fieldLabel}>
            {selected.name} cuesta {selected.cost} · nivel {tierFor(selected.cost)}
          </span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>El porqué del canje</span>
        <textarea
          className={styles.reason}
          rows={3}
          placeholder="Cuenta por qué lo canjean."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-invalid={!!error}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={busy || overBalance || !itemId}>
        {busy ? "Sellando…" : "Sellar canje"}
      </button>
    </form>
  );
}
