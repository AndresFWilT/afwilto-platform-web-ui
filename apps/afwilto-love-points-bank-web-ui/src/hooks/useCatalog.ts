import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCatalogItem,
  editCatalogItem,
  listCatalogItems,
  type CatalogItemBody,
  type CatalogItemEditBody,
} from "../api/catalog";

// Lista completa (incluye inactivos) para la vista Planes.
export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: () => listCatalogItems(false) });
}

// Solo activos, para el selector de la boleta de canje.
export function useActiveCatalog() {
  return useQuery({ queryKey: ["catalog", "active"], queryFn: () => listCatalogItems(true) });
}

function invalidateCatalog(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["catalog"] });
}

export function useCreateItem(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CatalogItemBody) => createCatalogItem(member, body),
    onSuccess: () => invalidateCatalog(qc),
  });
}

export function useEditItem(member: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CatalogItemEditBody }) =>
      editCatalogItem(member, id, body),
    onSuccess: () => invalidateCatalog(qc),
  });
}
