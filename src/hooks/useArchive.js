import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getArchivedProducts,
  archiveProduct,
  restoreArchivedProduct,
  permanentlyDeleteProduct,
  bulkArchiveProducts,
  searchArchivedProducts,
  getArchiveStats,
} from "../services/archiveService.js";

/**
 * Hook for fetching all archived items
 */
export function useArchivedItems() {
  return useQuery({
    queryKey: ["archived-items"],
    queryFn: getArchivedProducts,
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
    mutationFn: ({ productId, deletedBy }) =>
      permanentlyDeleteProduct(productId, deletedBy),
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
    mutationFn: ({ productIds, reason, archivedBy }) =>
      bulkArchiveProducts(productIds, reason, archivedBy),
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
 * Hook for fetching archived products (replaces getArchivedItemsByType)
 */
export function useArchivedProducts() {
  return useQuery({
    queryKey: ["archived-products"],
    queryFn: getArchivedProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for searching archived items
 */
export function useSearchArchivedItems(searchTerm) {
  return useQuery({
    queryKey: ["archived-items", "search", searchTerm],
    queryFn: () => searchArchivedProducts(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for getting archive statistics
 */
export function useArchiveStats() {
  return useQuery({
    queryKey: ["archive-stats"],
    queryFn: getArchiveStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
