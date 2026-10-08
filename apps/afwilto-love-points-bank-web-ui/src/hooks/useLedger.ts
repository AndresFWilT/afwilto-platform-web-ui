import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  awardEntry,
  editEntry,
  listLedger,
  voidEntry,
  type AwardBody,
  type EditBody,
} from "../api/entries";
import type { Entry, LedgerPage } from "../api/types";

const PAGE_SIZE = 50;

export function useLedger() {
  return useInfiniteQuery({
    queryKey: ["ledger"],
    queryFn: ({ pageParam }) =>
      listLedger({ pageSize: PAGE_SIZE, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: LedgerPage) => last.next_cursor ?? undefined,
  });
}

// Aplana las páginas en una sola lista de entradas.
export function flattenLedger(pages: LedgerPage[] | undefined): Entry[] {
  if (!pages) return [];
  return pages.flatMap((p) => p.entries);
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["ledger"] });
  qc.invalidateQueries({ queryKey: ["balances"] });
}

// Guardado optimista (plan §5): el renglón aparece de inmediato; si la API falla,
// se retira y la boleta vuelve con el texto intacto — ese texto es el corazón de la app.
export function useAward(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AwardBody) => awardEntry(member, body),
    onMutate: async (body): Promise<{ tempId: string }> => {
      await qc.cancelQueries({ queryKey: ["ledger"] });
      const tempId = `optimistic-${crypto.randomUUID()}`;
      const optimistic: Entry = {
        id: tempId,
        awarded_to: body.awarded_to,
        awarded_by: member,
        amount: body.amount,
        reason: body.reason,
        occurred_at: body.occurred_at,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<{ pages: LedgerPage[]; pageParams: unknown[] }>(["ledger"], (old) => {
        if (!old) {
          return { pages: [{ entries: [optimistic], next_cursor: null }], pageParams: [undefined] };
        }
        const pages = [...old.pages];
        pages[0] = { ...pages[0], entries: prependSorted(pages[0].entries, optimistic) };
        return { ...old, pages };
      });
      return { tempId };
    },
    onError: (_err, _body, ctx) => {
      // Retira el renglón optimista; la boleta conserva su texto (no lo tocamos).
      if (!ctx) return;
      removeEntry(qc, ctx.tempId);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useEdit(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditBody }) => editEntry(member, id, body),
    onSuccess: () => invalidate(qc),
  });
}

export function useVoid(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidEntry(member, id),
    onSuccess: () => invalidate(qc),
  });
}

// --- helpers de caché ---

function prependSorted(entries: Entry[], e: Entry): Entry[] {
  const next = [e, ...entries];
  next.sort((a, b) => {
    if (a.occurred_at !== b.occurred_at) return a.occurred_at < b.occurred_at ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
  return next;
}

function removeEntry(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.setQueryData<{ pages: LedgerPage[]; pageParams: unknown[] }>(["ledger"], (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        entries: p.entries.filter((e) => e.id !== id),
      })),
    };
  });
}
