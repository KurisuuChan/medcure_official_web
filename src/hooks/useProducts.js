import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  bulkAddProducts,
  getLowStockProducts,
  searchProducts,
} from "../services/productService.js";

/**
 * Hook for fetching all products
 */
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a single product
 */
export function useProduct(id) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

/**
 * Hook for adding a new product
 */
export function useAddProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to add product:", error);
    },
  });
}

/**
 * Hook for updating a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateProduct(id, updates),
    onSuccess: (data, { id }) => {
      // Update the specific product in cache
      queryClient.setQueryData(["product", id], data);
      // Invalidate products list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to update product:", error);
    },
  });
}

/**
 * Hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
    },
  });
}

/**
 * Hook for bulk adding products (CSV import)
 */
export function useBulkAddProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkAddProducts,
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to bulk add products:", error);
    },
  });
}

/**
 * Hook for fetching low stock products
 */
export function useLowStockProducts(threshold = 10) {
  return useQuery({
    queryKey: ["products", "low-stock", threshold],
    queryFn: () => getLowStockProducts(threshold),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for searching products
 */
export function useSearchProducts(searchTerm) {
  return useQuery({
    queryKey: ["products", "search", searchTerm],
    queryFn: () => searchProducts(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Legacy hook for backward compatibility with existing code
 * Maps to the new useProducts hook structure
 */
export function useInventoryData() {
  const {
    data: products = [],
    isLoading: loading,
    error,
    refetch,
  } = useProducts();

  return {
    products,
    loading,
    error: error?.message || "",
    refresh: refetch,
  };
}
