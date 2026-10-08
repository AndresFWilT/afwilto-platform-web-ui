import { useCallback, useEffect, useState } from "react";
import { TABS, type TabKey } from "../components/TabBar";

const KEYS = TABS.map((t) => t.key);

function fromHash(): TabKey {
  const h = window.location.hash.replace(/^#/, "") as TabKey;
  return KEYS.includes(h) ? h : "movimientos";
}

// El chip activo se refleja en el hash de la URL para que recargar no pierda la vista.
export function useTab(): [TabKey, (key: TabKey) => void] {
  const [tab, setTab] = useState<TabKey>(fromHash);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const choose = useCallback((key: TabKey) => {
    window.location.hash = key;
    setTab(key);
  }, []);

  return [tab, choose];
}
