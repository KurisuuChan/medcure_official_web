import { useEffect, useState } from "react";
import { mockFetchProducts } from "@/utils/mockApi";

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
        const data = await mockFetchProducts();
        if (cancelled) return;
        const products = data.length;
        const lowStock = data.filter(
          (p) => p.quantity > 0 && p.quantity <= 10
        ).length;
        const outOfStock = data.filter((p) => p.quantity === 0).length;
        const totalUnits = data.reduce((acc, p) => acc + p.quantity, 0);
        const totalValue = data.reduce(
          (acc, p) => acc + p.quantity * p.cost_price,
          0
        );
        const avgCost = products
          ? (totalValue / totalUnits || 0).toFixed(2)
          : 0;
        setSummary({
          products,
          lowStock,
          outOfStock,
          totalUnits,
          totalValue,
          avgCost,
        });
      } catch {
        setError("Failed to load summary");
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
