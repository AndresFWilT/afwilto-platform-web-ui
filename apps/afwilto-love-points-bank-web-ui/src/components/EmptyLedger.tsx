import styles from "./Ledger.module.css";

// La primera pantalla no dice "No hay datos": dice qué hacer.
export function EmptyLedger() {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyText}>
        Todavía no hay movimientos. El primero puede ser por algo mínimo, pero tiene que
        estar justificado.
      </p>
    </div>
  );
}
