import { useState } from "react";
import type { CatalogItem, Redemption } from "../api/types";
import { formatEventDate, formatFull } from "../domain/dates";
import { ApiError } from "../api/client";
import styles from "./Ledger.module.css";

interface Props {
  redemption: Redemption;
  items: CatalogItem[];
  currentMember: string | null;
  onVoid: (id: string) => Promise<unknown>;
}

export function RedemptionRow({ redemption, items, currentMember, onVoid }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = items.find((i) => i.id === redemption.catalog_item_id);
  const isVoided = redemption.status === "voided";
  const canVoid = currentMember === redemption.member_id && !isVoided;

  const confirmVoid = async () => {
    setBusy(true);
    try {
      await onVoid(redemption.id);
      setConfirming(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || "No se pudo anular." : "No se pudo anular.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className={`${styles.row} ${isVoided ? styles.voided : ""}`}>
      <td className={styles.cellDate}>
        <time dateTime={redemption.redeemed_at} title={formatFull(redemption.redeemed_at)}>
          {formatEventDate(redemption.redeemed_at)}
        </time>
      </td>
      <td className={styles.cellAmount}>
        <span className={styles.spend} aria-label={`menos ${redemption.cost_at_redemption} puntitos`}>
          −{redemption.cost_at_redemption}
        </span>
      </td>
      <td className={styles.cellReason}>
        <div className={styles.reasonLine}>
          <span className={styles.recipient}>{plan?.name ?? "Plan"}</span>
          {isVoided && <span className={styles.voidedMark}>· anulado</span>}
        </div>
        <p className={styles.reasonText}>{redemption.note}</p>

        {canVoid && !confirming && (
          <div className={styles.rowActions}>
            <button type="button" className={styles.ghostAction} onClick={() => setConfirming(true)}>
              Anular
            </button>
          </div>
        )}
        {confirming && (
          <div className={styles.rowActions}>
            <span className={styles.confirmText}>¿Anular este canje? Devuelve los puntitos.</span>
            <button type="button" className={styles.dangerAction} onClick={() => void confirmVoid()} disabled={busy}>
              Sí, anular
            </button>
            <button type="button" className={styles.ghostAction} onClick={() => setConfirming(false)} disabled={busy}>
              No
            </button>
          </div>
        )}
        {error && <p className={styles.rowError}>{error}</p>}
      </td>
    </tr>
  );
}
