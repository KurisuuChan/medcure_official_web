import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../services/productService.js";

/**
 * Hook for fetching and managing inventory data from the backend
 */
export const useInventoryData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await getProducts();

      if (fetchError) {
        throw new Error(fetchError);
      }

      setProducts(data || []);
    } catch (err) {
      console.error("Error loading inventory data:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, products, refresh: load };
};
