import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listRedemptions, redeem, voidRedemption, type RedeemBody } from "../api/redemptions";

export function useRedemptions() {
  return useQuery({ queryKey: ["redemptions"], queryFn: () => listRedemptions() });
}

// Al canjear/anular cambian tanto el historial de canjes como los saldos disponibles.
function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["redemptions"] });
  qc.invalidateQueries({ queryKey: ["balances"] });
}

export function useRedeem(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RedeemBody) => redeem(member, body),
    onSuccess: () => invalidate(qc),
  });
}

export function useVoidRedemption(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidRedemption(member, id),
    onSuccess: () => invalidate(qc),
  });
}
