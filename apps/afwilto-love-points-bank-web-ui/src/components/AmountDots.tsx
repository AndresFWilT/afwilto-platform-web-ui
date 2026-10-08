import styles from "./AmountDots.module.css";

interface Props {
  amount: number;
  muted?: boolean; // para renglones anulados
}

// El monto se dibuja como puntitos (●●●) en color de acento, no como número.
// Los puntos visuales son aria-hidden; el lector de pantalla oye el aria-label.
export function AmountDots({ amount, muted }: Props) {
  const dots = "●".repeat(Math.max(0, amount));
  return (
    <span
      className={`${styles.dots} ${muted ? styles.muted : ""}`}
      role="img"
      aria-label={`${amount} ${amount === 1 ? "puntito" : "puntitos"}`}
    >
      <span aria-hidden="true">{dots}</span>
    </span>
  );
}
