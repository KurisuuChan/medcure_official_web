// Legacy hook - now uses the new product service for backward compatibility
import { useProducts } from "./useProducts.js";

export const useInventoryData = () => {
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
};
