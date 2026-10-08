import { request } from "./client";
import type { Redemption } from "./types";

export interface RedeemBody {
  catalog_item_id: string;
  amount: number;
  note: string;
}

export function redeem(member: string, body: RedeemBody): Promise<Redemption> {
  return request<Redemption>("/redemptions", { method: "POST", body, member });
}

export function listRedemptions(memberId?: string): Promise<Redemption[]> {
  const q = memberId ? `?member_id=${encodeURIComponent(memberId)}` : "";
  return request<Redemption[]>(`/redemptions${q}`);
}

export function voidRedemption(member: string, id: string): Promise<Redemption> {
  return request<Redemption>(`/redemptions/${id}/void`, { method: "POST", member });
}
