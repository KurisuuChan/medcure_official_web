import { useCallback, useEffect, useState } from "react";
import { mockFetchProducts } from "@/utils/mockApi";

export const useInventoryData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await mockFetchProducts();
      setProducts(data);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, products, refresh: load };
};
