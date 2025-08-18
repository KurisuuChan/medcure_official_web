import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../services/productService.js";

export const useInventorySummary = () => {
  return useQuery({
    queryKey: ["inventory-summary"],
    queryFn: async () => {
      try {
        const products = await getProducts();

        const summary = {
          products: products.length,
          lowStock: products.filter(
            (p) => p.stock > 0 && p.stock <= (p.minimum_stock || 10)
          ).length,
          outOfStock: products.filter((p) => p.stock === 0).length,
          totalUnits: products.reduce((acc, p) => acc + (p.stock || 0), 0),
          totalValue: products.reduce(
            (acc, p) => acc + (p.stock || 0) * (p.price || 0),
            0
          ),
          avgCost: products.length
            ? (
                products.reduce((acc, p) => acc + (p.price || 0), 0) /
                products.length
              ).toFixed(2)
            : 0,
        };

        return summary;
      } catch (error) {
        console.error("Error fetching inventory summary:", error);
        throw new Error("Failed to load inventory summary");
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
