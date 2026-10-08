import { type KeyboardEvent, useRef } from "react";
import styles from "./TabBar.module.css";

export type TabKey = "movimientos" | "canjear" | "planes";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "movimientos", label: "Movimientos" },
  { key: "canjear", label: "Canjear" },
  { key: "planes", label: "Planes" },
];

interface Props {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

// Chips de navegación con el patrón ARIA de tabs: flechas mueven el foco, Home/End saltan.
export function TabBar({ active, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    onChange(TABS[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div className={styles.tablist} role="tablist" aria-label="Secciones de la libreta">
      {TABS.map((tab, i) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.key}`}
            tabIndex={selected ? 0 : -1}
            className={`${styles.chip} ${selected ? styles.active : ""}`}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
