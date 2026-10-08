import { useState } from "react";
import { catalogSchema } from "../domain/rules";
import { tierFor, TIER_LABEL } from "../domain/tiers";
import { ApiError } from "../api/client";
import type { CatalogItemBody } from "../api/catalog";
import styles from "./DepositSlip.module.css";

interface Props {
  onCreate: (body: CatalogItemBody) => Promise<unknown>;
}

// El formulario del plan. No hay campo de nivel: se muestra el nivel derivado en vivo
// al lado del costo (RD-CAT-3).
export function CatalogForm({ onCreate }: Props) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = catalogSchema.safeParse({ name, cost, description });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Revisa los datos.");
      return;
    }
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), cost, description: description.trim() });
      setName("");
      setCost(0);
      setDescription("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || "No se pudo crear." : "No se pudo crear.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.slip} onSubmit={submit} aria-label="Nuevo plan" noValidate>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Nuevo plan</span>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Nombre</span>
        <input
          className={styles.select}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Noche de película"
          aria-label="Nombre del plan"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Cuánto cuesta</span>
        <input
          className={styles.date}
          type="number"
          min={1}
          value={cost || ""}
          onChange={(e) => setCost(Number(e.target.value))}
          aria-label="Costo del plan"
        />
        {cost > 0 && (
          <span className={styles.fieldLabel}>
            cuesta {cost} → nivel {TIER_LABEL[tierFor(cost)]}
          </span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Descripción (opcional)</span>
        <textarea
          className={styles.reason}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Descripción del plan"
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.submit} disabled={busy}>
        {busy ? "Guardando…" : "Crear plan"}
      </button>
    </form>
  );
}
