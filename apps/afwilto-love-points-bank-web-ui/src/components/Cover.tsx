import type { Balance, Member } from "../api/types";
import styles from "./Cover.module.css";

interface Props {
  members: Member[];
  balances: Balance[];
  currentMember: string | null;
  onChooseMember: (id: string) => void;
}

// La tapa de la libreta: nombre del banco, saldos de los dos titulares y el selector
// discreto de quién está usando la app.
export function Cover({ members, balances, currentMember, onChooseMember }: Props) {
  const balanceOf = (id: string) => balances.find((b) => b.member_id === id);

  return (
    <header className={styles.cover}>
      <div className={styles.brand}>
        <h1 className={styles.title}>Banco de Puntitos</h1>
        <p className={styles.tagline}>Cada puntito, con su porqué.</p>
      </div>

      <div className={styles.balances}>
        {members.map((m) => {
          const b = balanceOf(m.id);
          const available = b?.points_available ?? b?.points_earned ?? 0;
          const earned = b?.points_earned ?? 0;
          const redeemed = b?.points_redeemed ?? 0;
          return (
            <div key={m.id} className={styles.holder}>
              <span className={styles.holderName}>{m.display_name}</span>
              <span className={styles.holderPoints}>{available}</span>
              <span className={styles.holderUnit}>disponibles</span>
              {redeemed > 0 && (
                <span className={styles.holderContext}>
                  {earned} ganados · {redeemed} canjeados
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.selector}>
        <label htmlFor="member-select" className={styles.selectorLabel}>
          Estás usando la libreta como
        </label>
        <select
          id="member-select"
          className={styles.select}
          value={currentMember ?? ""}
          onChange={(e) => onChooseMember(e.target.value)}
        >
          <option value="" disabled>
            Elige tu nombre
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
