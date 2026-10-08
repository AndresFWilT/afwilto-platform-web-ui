import { useQuery } from "@tanstack/react-query";
import { getBalances, listMembers } from "../api/balances";

export function useBalances() {
  return useQuery({ queryKey: ["balances"], queryFn: getBalances });
}

export function useMembers() {
  return useQuery({ queryKey: ["members"], queryFn: listMembers, staleTime: Infinity });
}
