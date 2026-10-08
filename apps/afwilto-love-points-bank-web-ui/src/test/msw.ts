import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { Balance, CatalogItem, Entry, Member, Redemption } from "../api/types";

export const MEMBER_A = "11111111-1111-4111-8111-111111111111";
export const MEMBER_B = "22222222-2222-4222-8222-222222222222";

export const members: Member[] = [
  { id: MEMBER_A, display_name: "Ana", color: "#008080" },
  { id: MEMBER_B, display_name: "Beto", color: "#0B192C" },
];

export const defaultBalances: Balance[] = [
  { member_id: MEMBER_A, display_name: "Ana", points_earned: 5, entries_count: 2, last_entry_at: "2026-09-10T15:00:00Z", points_redeemed: 0, points_available: 5 },
  { member_id: MEMBER_B, display_name: "Beto", points_earned: 0, entries_count: 0, last_entry_at: null, points_redeemed: 0, points_available: 0 },
];

export function makeItem(over: Partial<CatalogItem> = {}): CatalogItem {
  const base: CatalogItem = {
    id: "item-1",
    name: "Noche de película",
    description: "",
    cost: 8,
    tier: "medio",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  };
  return { ...base, ...over };
}

export function makeRedemption(over: Partial<Redemption> = {}): Redemption {
  const base: Redemption = {
    id: "red-1",
    member_id: MEMBER_B,
    catalog_item_id: "item-1",
    cost_at_redemption: 8,
    note: "porque nos lo merecemos hoy sin duda",
    status: "active",
    redeemed_at: "2026-09-10T18:00:00Z",
    updated_at: "2026-09-10T18:00:00Z",
  };
  return { ...base, ...over };
}

export function makeEntry(over: Partial<Entry> = {}): Entry {
  const base: Entry = {
    id: "e-1",
    awarded_to: MEMBER_A,
    awarded_by: MEMBER_B,
    amount: 3,
    reason: "porque me contó del susto de anoche",
    occurred_at: "2026-09-10T15:00:00Z",
    status: "active",
    created_at: "2026-09-10T16:00:00Z",
    updated_at: "2026-09-10T16:00:00Z",
  };
  return { ...base, ...over };
}

// Handlers por defecto; los tests los sobrescriben con server.use(...).
export const handlers = [
  http.get("/api/v1/members", () => HttpResponse.json(members)),
  http.get("/api/v1/balances", () => HttpResponse.json(defaultBalances)),
  http.get("/api/v1/entries", () => HttpResponse.json({ entries: [], next_cursor: null })),
  http.get("/api/v1/catalog-items", () => HttpResponse.json([])),
  http.get("/api/v1/redemptions", () => HttpResponse.json([])),
];

export const server = setupServer(...handlers);
