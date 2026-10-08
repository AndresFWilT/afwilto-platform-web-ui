import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BaseLayout } from "@afwilto/design-system";
import { Cover } from "./components/Cover";
import { DepositSlip } from "./components/DepositSlip";
import { Ledger } from "./components/Ledger";
import { RedemptionSlip } from "./components/RedemptionSlip";
import { RedemptionList } from "./components/RedemptionList";
import { CatalogForm } from "./components/CatalogForm";
import { CatalogList } from "./components/CatalogList";
import { TabBar, type TabKey } from "./components/TabBar";
import { useBalances, useMembers } from "./hooks/useBalances";
import { useCurrentMember } from "./hooks/useCurrentMember";
import { flattenLedger, useAward, useEdit, useLedger, useVoid } from "./hooks/useLedger";
import { useActiveCatalog, useCatalog, useCreateItem, useEditItem } from "./hooks/useCatalog";
import { useRedeem, useRedemptions, useVoidRedemption } from "./hooks/useRedemptions";
import { useTab } from "./hooks/useTab";
import styles from "./App.module.css";
// Global tokens/reset lived only in main.tsx, which Module Federation never loads —
// the shell host imports `./App` directly. Without these, every `var(--color-*)` in
// the CSS Modules resolves to nothing and the remote renders unstyled.
import "./styles/tokens.css";
import "./styles/global.css";
// Tailwind + design-system tokens — needed for the shared BaseLayout/Navbar chrome
// below, which is styled with @afwilto/design-system's Tailwind utility classes.
import "./index.css";

// El QueryClient vive aquí (no en main.tsx) porque App.tsx es la raíz que Module
// Federation expone al shell host de AFWILTO: el remote debe traer sus propios
// providers, ya que el host no conoce (ni debe conocer) TanStack Query. Se crea por
// instancia de App (useState lazy-init), no a nivel de módulo, para que cada montaje
// (cada test, cada remount) arranque con caché limpia — igual que renderWithClient
// hacía antes de que el provider viviera aquí.
export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 10_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BaseLayout>
        <AppShell />
      </BaseLayout>
    </QueryClientProvider>
  );
}

function AppShell() {
  const [currentMember, chooseMember] = useCurrentMember();
  const [tab, setTab] = useTab();
  const members = useMembers();
  const balances = useBalances();

  const member = currentMember ?? "";
  const memberList = members.data ?? [];

  if (members.isError) {
    return (
      <div className={styles.fatal}>
        <p>No se pudo abrir la libreta. ¿Está la API arriba?</p>
      </div>
    );
  }

  const availableFor = (id: string) =>
    balances.data?.find((b) => b.member_id === id)?.points_available ?? 0;

  return (
    <div className={styles.app}>
      <div className={styles.shell}>
        <Cover
          members={memberList}
          balances={balances.data ?? []}
          currentMember={currentMember}
          onChooseMember={chooseMember}
        />
        <TabBar active={tab} onChange={setTab} />

        {!currentMember ? (
          <p className={styles.pickFirst}>Elige tu nombre arriba para empezar.</p>
        ) : (
          <Panel
            tab={tab}
            currentMember={member}
            availableForCurrent={availableFor(member)}
            members={memberList}
          />
        )}
      </div>
    </div>
  );
}

interface PanelProps {
  tab: TabKey;
  currentMember: string;
  availableForCurrent: number;
  members: { id: string; display_name: string; color: string }[];
}

function Panel({ tab, currentMember, availableForCurrent, members }: PanelProps) {
  const ledger = useLedger();
  const award = useAward(currentMember);
  const edit = useEdit(currentMember);
  const voidEntry = useVoid(currentMember);

  const catalog = useCatalog();
  const activeCatalog = useActiveCatalog();
  const createItem = useCreateItem(currentMember);
  const editItem = useEditItem(currentMember);

  const redemptions = useRedemptions();
  const redeem = useRedeem(currentMember);
  const voidRedemption = useVoidRedemption(currentMember);

  const panelProps = { id: `panel-${tab}`, role: "tabpanel", "aria-labelledby": `tab-${tab}` };

  if (tab === "movimientos") {
    return (
      <div {...panelProps} className={styles.panel}>
        <DepositSlip
          members={members}
          currentMember={currentMember}
          onAward={(body) => award.mutateAsync(body)}
        />
        <Ledger
          entries={flattenLedger(ledger.data?.pages)}
          members={members}
          currentMember={currentMember}
          isLoading={ledger.isLoading}
          hasNextPage={!!ledger.hasNextPage}
          isFetchingNextPage={ledger.isFetchingNextPage}
          onLoadMore={() => ledger.fetchNextPage()}
          onEdit={(id, body) => edit.mutateAsync({ id, body })}
          onVoid={(id) => voidEntry.mutateAsync(id)}
        />
      </div>
    );
  }

  if (tab === "canjear") {
    return (
      <div {...panelProps} className={styles.panel}>
        <RedemptionSlip
          items={activeCatalog.data ?? []}
          available={availableForCurrent}
          onRedeem={(body) => redeem.mutateAsync(body)}
        />
        <RedemptionList
          redemptions={redemptions.data ?? []}
          items={catalog.data ?? []}
          currentMember={currentMember}
          isLoading={redemptions.isLoading}
          onVoid={(id) => voidRedemption.mutateAsync(id)}
        />
      </div>
    );
  }

  return (
    <div {...panelProps} className={styles.panel}>
      <CatalogForm onCreate={(body) => createItem.mutateAsync(body)} />
      <CatalogList
        items={catalog.data ?? []}
        isLoading={catalog.isLoading}
        onEdit={(id, body) => editItem.mutateAsync({ id, body })}
      />
    </div>
  );
}

// Default export required by the shell host's `React.lazy(() => import('love_points_bank/App'))` —
// a named-export-only module resolves through Module Federation as a namespace object,
// not a component (React error #306).
export default App;
