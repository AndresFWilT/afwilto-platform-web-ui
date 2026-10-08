import { request } from "./client";
import type { Entry, LedgerFilter, LedgerPage } from "./types";

export interface AwardBody {
  awarded_to: string;
  amount: number;
  reason: string;
  occurred_at: string; // ISO UTC
}

export interface EditBody {
  amount: number;
  reason: string;
  occurred_at: string;
}

export function awardEntry(member: string, body: AwardBody): Promise<Entry> {
  return request<Entry>("/entries", { method: "POST", body, member });
}

export function listLedger(filter: LedgerFilter = {}): Promise<LedgerPage> {
  const q = new URLSearchParams();
  if (filter.awardedTo) q.set("awarded_to", filter.awardedTo);
  if (filter.status) q.set("status", filter.status);
  if (filter.pageSize) q.set("page_size", String(filter.pageSize));
  if (filter.cursor) q.set("cursor", filter.cursor);
  const qs = q.toString();
  return request<LedgerPage>(`/entries${qs ? `?${qs}` : ""}`);
}

export function editEntry(member: string, id: string, body: EditBody): Promise<Entry> {
  return request<Entry>(`/entries/${id}`, { method: "PATCH", body, member });
}

export function voidEntry(member: string, id: string): Promise<Entry> {
  return request<Entry>(`/entries/${id}/void`, { method: "POST", member });
}
