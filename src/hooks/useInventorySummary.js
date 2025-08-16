import { useEffect, useState } from "react";
import {
  getInventorySummary,
  getProducts,
} from "../services/productService.js";

/**
 * Hook for fetching inventory summary data from the backend
 */
export const useInventorySummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    products: 0,
    lowStock: 0,
    outOfStock: 0,
    totalUnits: 0,
    totalValue: 0,
    avgCost: 0,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        // Get summary from backend
        const { data: summaryData, error: summaryError } =
          await getInventorySummary();

        if (summaryError) {
          throw new Error(summaryError);
        }

        // Get detailed products for additional calculations
        const { data: productsData, error: productsError } =
          await getProducts();

        if (productsError) {
          throw new Error(productsError);
        }

        if (cancelled) return;

        const products = productsData || [];
        const lowStock = products.filter(
          (p) => p.total_stock > 0 && p.total_stock <= p.critical_level
        ).length;
        const outOfStock = products.filter((p) => p.total_stock === 0).length;
        const totalUnits = summaryData?.totalStock || 0;
        const totalValue = summaryData?.totalValue || 0;
        const avgCost =
          totalUnits > 0 ? (totalValue / totalUnits).toFixed(2) : 0;

        setSummary({
          products: summaryData?.totalProducts || 0,
          lowStock,
          outOfStock,
          totalUnits,
          totalValue,
          avgCost: parseFloat(avgCost),
        });
      } catch (err) {
        console.error("Error loading inventory summary:", err);
        if (!cancelled) {
          setError(err.message || "Failed to load summary");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error, summary };
};
