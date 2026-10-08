import { useState } from "react";
import type { CatalogItem } from "../api/types";
import type { CatalogItemEditBody } from "../api/catalog";
import { catalogSchema } from "../domain/rules";
import { tierFor, TIER_LABEL, TIER_COLOR_VAR } from "../domain/tiers";
import { ApiError } from "../api/client";
import styles from "./Catalog.module.css";

interface Props {
  item: CatalogItem;
  onEdit: (id: string, body: CatalogItemEditBody) => Promise<unknown>;
}

export function CatalogRow({ item, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [cost, setCost] = useState(item.cost);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (over: Partial<CatalogItemEditBody> = {}) => {
    const body: CatalogItemEditBody = {
      name: name.trim(),
      cost,
      description: item.description,
      is_active: item.is_active,
      ...over,
    };
    const parsed = catalogSchema.safeParse({ name: body.name, cost: body.cost, description: body.description });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Revisa los datos.");
      return;
    }
    setBusy(true);
    try {
      await onEdit(item.id, body);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || "No se pudo guardar." : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <li className={styles.row}>
        <input className={styles.editName} value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del plan" />
        <input
          className={styles.editCost}
          type="number"
          min={1}
          value={cost || ""}
          onChange={(e) => setCost(Number(e.target.value))}
          aria-label="Costo del plan"
        />
        <span className={styles.tierHint}>→ {TIER_LABEL[tierFor(cost)]}</span>
        <div className={styles.rowActions}>
          <button type="button" className={styles.primaryAction} onClick={() => void save()} disabled={busy}>
            Guardar
          </button>
          <button type="button" className={styles.ghostAction} onClick={() => setEditing(false)} disabled={busy}>
            Cancelar
          </button>
        </div>
        {error && <p className={styles.rowError}>{error}</p>}
      </li>
    );
  }

  return (
    <li className={`${styles.row} ${item.is_active ? "" : styles.inactive}`}>
      <span className={styles.name}>{item.name}</span>
      <span className={styles.cost} style={{ color: TIER_COLOR_VAR[tierFor(item.cost)] }}>
        {item.cost}
      </span>
      {!item.is_active && <span className={styles.inactiveMark}>inactivo</span>}
      <div className={styles.rowActions}>
        <button type="button" className={styles.ghostAction} onClick={() => setEditing(true)}>
          Editar
        </button>
        <button
          type="button"
          className={styles.ghostAction}
          onClick={() => void save({ is_active: !item.is_active })}
          disabled={busy}
        >
          {item.is_active ? "Desactivar" : "Reactivar"}
        </button>
      </div>
      {error && <p className={styles.rowError}>{error}</p>}
    </li>
  );
}
