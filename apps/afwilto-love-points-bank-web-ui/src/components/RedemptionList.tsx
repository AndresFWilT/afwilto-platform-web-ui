import type { CatalogItem, Redemption } from "../api/types";
import { RedemptionRow } from "./RedemptionRow";
import styles from "./Ledger.module.css";

interface Props {
  redemptions: Redemption[];
  items: CatalogItem[];
  currentMember: string | null;
  isLoading: boolean;
  onVoid: (id: string) => Promise<unknown>;
}

export function RedemptionList({ redemptions, items, currentMember, isLoading, onVoid }: Props) {
  return (
    <section className={styles.ledger} aria-label="Historial de canjes">
      <div className={styles.head}>
        <h2 className={styles.heading}>Historial de canjes</h2>
      </div>

      {isLoading ? (
        <p className={styles.state}>Abriendo el historial…</p>
      ) : redemptions.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            Todavía no han canjeado nada. Cuando gasten puntitos en un plan, quedará aquí.
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.thDate}>
                Fecha
              </th>
              <th scope="col" className={styles.thAmount}>
                Puntitos
              </th>
              <th scope="col" className={styles.thReason}>
                Plan y motivo
              </th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map((r) => (
              <RedemptionRow
                key={r.id}
                redemption={r}
                items={items}
                currentMember={currentMember}
                onVoid={onVoid}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
