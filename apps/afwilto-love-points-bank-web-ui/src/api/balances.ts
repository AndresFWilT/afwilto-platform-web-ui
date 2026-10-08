import { request } from "./client";
import type { Balance, Member } from "./types";

export function getBalances(): Promise<Balance[]> {
  return request<Balance[]>("/balances");
}

export function listMembers(): Promise<Member[]> {
  return request<Member[]>("/members");
}
