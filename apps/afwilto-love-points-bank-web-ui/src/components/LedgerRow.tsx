import { useState, type KeyboardEvent } from "react";
import type { Entry, Member } from "../api/types";
import type { EditBody } from "../api/entries";
import { AmountDots } from "./AmountDots";
import { formatEventDate, formatFull, toDateInputValue, fromDateInputValue } from "../domain/dates";
import { editSchema, MAX_AMOUNT } from "../domain/rules";
import { ApiError } from "../api/client";
import styles from "./Ledger.module.css";

interface Props {
  entry: Entry;
  members: Member[];
  currentMember: string | null;
  onEdit: (id: string, body: EditBody) => Promise<unknown>;
  onVoid: (id: string) => Promise<unknown>;
}

type Mode = "view" | "edit" | "confirm-void";

export function LedgerRow({ entry, members, currentMember, onEdit, onVoid }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [amount, setAmount] = useState(entry.amount);
  const [reason, setReason] = useState(entry.reason);
  const [date, setDate] = useState(toDateInputValue(new Date(entry.occurred_at)));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const recipient = members.find((m) => m.id === entry.awarded_to);
  const isVoided = entry.status === "voided";
  const canModify = currentMember === entry.awarded_by && !isVoided;
  const wasEdited = entry.updated_at !== entry.created_at && !isVoided;

  const startEdit = () => {
    setAmount(entry.amount);
    setReason(entry.reason);
    setDate(toDateInputValue(new Date(entry.occurred_at)));
    setError(null);
    setMode("edit");
  };

  const cancel = () => {
    setError(null);
    setMode("view");
  };

  const save = async () => {
    const occurredAt = fromDateInputValue(date);
    const parsed = editSchema.safeParse({ amount, reason, occurredAt });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Revisa los datos.");
      return;
    }
    setBusy(true);
    try {
      await onEdit(entry.id, {
        amount,
        reason: reason.trim(),
        occurred_at: occurredAt.toISOString(),
      });
      setMode("view");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || "No se pudo guardar." : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  };

  const confirmVoid = async () => {
    setBusy(true);
    try {
      await onVoid(entry.id);
      setMode("view");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || "No se pudo anular." : "No se pudo anular.");
      setMode("view");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (mode !== "edit") return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (mode === "edit") {
    return (
      <tr className={styles.row} onKeyDown={onKeyDown}>
        <td className={styles.cellDate}>
          <input
            className={styles.editDate}
            type="date"
            max={toDateInputValue(new Date())}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Fecha del hecho"
          />
        </td>
        <td className={styles.cellAmount}>
          <select
            className={styles.editAmount}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Cantidad de puntitos"
          >
            {Array.from({ length: MAX_AMOUNT }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </td>
        <td className={styles.cellReason}>
          <textarea
            className={styles.editReason}
            value={reason}
            rows={2}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Justificación"
            autoFocus
          />
          {error && <p className={styles.rowError}>{error}</p>}
          <div className={styles.editActions}>
            <button type="button" className={styles.primaryAction} onClick={() => void save()} disabled={busy}>
              Guardar
            </button>
            <button type="button" className={styles.ghostAction} onClick={cancel} disabled={busy}>
              Cancelar
            </button>
            <span className={styles.hint}>Enter guarda · Esc cancela</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`${styles.row} ${isVoided ? styles.voided : ""}`}>
      <td className={styles.cellDate}>
        <time dateTime={entry.occurred_at} title={formatFull(entry.occurred_at)}>
          {formatEventDate(entry.occurred_at)}
        </time>
      </td>
      <td className={styles.cellAmount}>
        <AmountDots amount={entry.amount} muted={isVoided} />
      </td>
      <td className={styles.cellReason}>
        <div className={styles.reasonLine}>
          <span className={styles.recipient}>a {recipient?.display_name ?? "—"}</span>
          {wasEdited && (
            <span className={styles.editedMark} title={`Editado el ${formatFull(entry.updated_at)}`}>
              · editado
            </span>
          )}
          {isVoided && <span className={styles.voidedMark}>· anulado</span>}
        </div>
        <p className={styles.reasonText}>{entry.reason}</p>

        {canModify && mode === "view" && (
          <div className={styles.rowActions}>
            <button type="button" className={styles.ghostAction} onClick={startEdit}>
              Editar
            </button>
            <button type="button" className={styles.ghostAction} onClick={() => setMode("confirm-void")}>
              Anular
            </button>
          </div>
        )}

        {mode === "confirm-void" && (
          <div className={styles.rowActions}>
            <span className={styles.confirmText}>¿Anular este abono?</span>
            <button type="button" className={styles.dangerAction} onClick={() => void confirmVoid()} disabled={busy}>
              Sí, anular
            </button>
            <button type="button" className={styles.ghostAction} onClick={cancel} disabled={busy}>
              No
            </button>
          </div>
        )}
        {error && <p className={styles.rowError}>{error}</p>}
      </td>
    </tr>
  );
}
