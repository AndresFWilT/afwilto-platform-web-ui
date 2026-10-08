import { request } from "./client";
import type { CatalogItem } from "./types";

export interface CatalogItemBody {
  name: string;
  description?: string;
  cost: number;
}

export interface CatalogItemEditBody {
  name: string;
  description?: string;
  cost: number;
  is_active: boolean;
}

export function createCatalogItem(member: string, body: CatalogItemBody): Promise<CatalogItem> {
  return request<CatalogItem>("/catalog-items", { method: "POST", body, member });
}

export function listCatalogItems(onlyActive = false): Promise<CatalogItem[]> {
  return request<CatalogItem[]>(`/catalog-items${onlyActive ? "?active=true" : ""}`);
}

export function editCatalogItem(
  member: string,
  id: string,
  body: CatalogItemEditBody,
): Promise<CatalogItem> {
  return request<CatalogItem>(`/catalog-items/${id}`, { method: "PATCH", body, member });
}
