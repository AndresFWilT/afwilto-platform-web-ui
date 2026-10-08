import type { Entry, Member } from "../api/types";
import type { EditBody } from "../api/entries";
import { LedgerRow } from "./LedgerRow";
import { EmptyLedger } from "./EmptyLedger";
import styles from "./Ledger.module.css";

interface Props {
  entries: Entry[];
  members: Member[];
  currentMember: string | null;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onEdit: (id: string, body: EditBody) => Promise<unknown>;
  onVoid: (id: string) => Promise<unknown>;
}

// El listado es una <table> de verdad: un extracto es una tabla, no una galería.
export function Ledger({
  entries,
  members,
  currentMember,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEdit,
  onVoid,
}: Props) {
  return (
    <section className={styles.ledger} aria-label="Movimientos">
      <div className={styles.head}>
        <h2 className={styles.heading}>Movimientos</h2>
      </div>

      {isLoading ? (
        <p className={styles.state}>Abriendo la libreta…</p>
      ) : entries.length === 0 ? (
        <EmptyLedger />
      ) : (
        <>
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
                  Concepto
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <LedgerRow
                  key={e.id}
                  entry={e}
                  members={members}
                  currentMember={currentMember}
                  onEdit={onEdit}
                  onVoid={onVoid}
                />
              ))}
            </tbody>
          </table>

          {hasNextPage && (
            <button className={styles.more} onClick={onLoadMore} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Cargando…" : "Ver movimientos anteriores"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
