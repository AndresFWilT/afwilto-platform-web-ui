import type { CatalogItem } from "../api/types";
import type { CatalogItemEditBody } from "../api/catalog";
import { CatalogRow } from "./CatalogRow";
import { tierFor, TIER_LABEL, TIER_ORDER, TIER_COLOR_VAR } from "../domain/tiers";
import ledger from "./Ledger.module.css";
import styles from "./Catalog.module.css";

interface Props {
  items: CatalogItem[];
  isLoading: boolean;
  onEdit: (id: string, body: CatalogItemEditBody) => Promise<unknown>;
}

// Los planes agrupados por nivel derivado (baratito / medio / alto en oro).
export function CatalogList({ items, isLoading, onEdit }: Props) {
  return (
    <section className={ledger.ledger} aria-label="Catálogo de planes">
      <div className={ledger.head}>
        <h2 className={ledger.heading}>Catálogo</h2>
      </div>

      {isLoading ? (
        <p className={ledger.state}>Abriendo el catálogo…</p>
      ) : items.length === 0 ? (
        <div className={ledger.empty}>
          <p className={ledger.emptyText}>
            Todavía no hay planes. Crea el primero: algo por lo que valga la pena juntar
            puntitos.
          </p>
        </div>
      ) : (
        TIER_ORDER.map((tier) => {
          const group = items.filter((i) => tierFor(i.cost) === tier);
          if (group.length === 0) return null;
          return (
            <div key={tier} className={styles.group}>
              <h3 className={styles.groupTitle} style={{ color: TIER_COLOR_VAR[tier] }}>
                {TIER_LABEL[tier]}
              </h3>
              <ul className={styles.list}>
                {group
                  .sort((a, b) => a.cost - b.cost)
                  .map((item) => (
                    <CatalogRow key={item.id} item={item} onEdit={onEdit} />
                  ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
