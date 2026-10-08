import { useCallback, useEffect, useState } from "react";

const KEY = "puntitos.currentMember";

// El selector de titular de v1: se elige una vez y se guarda en localStorage.
export function useCurrentMember(): [string | null, (id: string) => void] {
  const [member, setMember] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Sincroniza entre pestañas.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setMember(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const choose = useCallback((id: string) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* modo privado sin storage: se mantiene en memoria */
    }
    setMember(id);
  }, []);

  return [member, choose];
}
