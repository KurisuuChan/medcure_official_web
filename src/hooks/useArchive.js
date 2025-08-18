import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getArchivedItems,
  archiveProduct,
  restoreArchivedProduct,
  permanentlyDeleteArchivedItem,
  bulkArchiveProducts,
  getArchivedItemsByType,
  searchArchivedItems,
} from "../services/archiveService.js";

/**
 * Hook for fetching all archived items
 */
export function useArchivedItems() {
  return useQuery({
    queryKey: ["archived-items"],
    queryFn: getArchivedItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for archiving a product
 */
export function useArchiveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ product, reason, archivedBy }) =>
      archiveProduct(product, reason, archivedBy),
    onSuccess: () => {
      // Invalidate both products and archived items queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
    onError: (error) => {
      console.error("Failed to archive product:", error);
    },
  });
}

/**
 * Hook for restoring an archived product
 */
export function useRestoreArchivedProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreArchivedProduct,
    onSuccess: () => {
      // Invalidate both products and archived items queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
    onError: (error) => {
      console.error("Failed to restore archived product:", error);
    },
  });
}

/**
 * Hook for permanently deleting an archived item
 */
export function usePermanentlyDeleteArchivedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentlyDeleteArchivedItem,
    onSuccess: () => {
      // Invalidate archived items query
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
    onError: (error) => {
      console.error("Failed to permanently delete archived item:", error);
    },
  });
}

/**
 * Hook for bulk archiving products
 */
export function useBulkArchiveProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ products, reason, archivedBy }) =>
      bulkArchiveProducts(products, reason, archivedBy),
    onSuccess: () => {
      // Invalidate both products and archived items queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
    onError: (error) => {
      console.error("Failed to bulk archive products:", error);
    },
  });
}

/**
 * Hook for fetching archived items by type
 */
export function useArchivedItemsByType(type) {
  return useQuery({
    queryKey: ["archived-items", "type", type],
    queryFn: () => getArchivedItemsByType(type),
    enabled: !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for searching archived items
 */
export function useSearchArchivedItems(searchTerm) {
  return useQuery({
    queryKey: ["archived-items", "search", searchTerm],
    queryFn: () => searchArchivedItems(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
