// Tipos del contrato HTTP (api/openapi.yaml). Espejo de los DTO del backend.

export type EntryStatus = "active" | "voided";

export interface Entry {
  id: string;
  awarded_to: string;
  awarded_by: string;
  amount: number;
  reason: string;
  occurred_at: string; // ISO 8601, UTC
  status: EntryStatus;
  created_at: string;
  updated_at: string;
}

export interface LedgerPage {
  entries: Entry[];
  next_cursor: string | null;
}

export interface Balance {
  member_id: string;
  display_name: string;
  points_earned: number;
  entries_count: number;
  last_entry_at: string | null;
  points_redeemed: number;
  points_available: number;
}

export type Tier = "baratito" | "medio" | "alto";

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  tier: Tier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  member_id: string;
  catalog_item_id: string;
  cost_at_redemption: number;
  note: string;
  status: EntryStatus;
  redeemed_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  display_name: string;
  color: string;
}

export interface LedgerFilter {
  awardedTo?: string;
  status?: EntryStatus;
  pageSize?: number;
  cursor?: string;
}
