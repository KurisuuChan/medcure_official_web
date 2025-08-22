import { useQuery } from "@tanstack/react-query";
import { supabase } from "../config/supabase.js";

/**
 * Optimized Dashboard Hook - Eliminates waterfall requests
 */
export function useOptimizedDashboard() {
  return useQuery({
    queryKey: ["dashboard-optimized"],
    queryFn: async () => {
      // Single optimized query using database views and aggregations
      const { data, error } = await supabase.rpc("get_dashboard_analytics", {
        // Let database do the heavy lifting
        include_sales_today: true,
        include_inventory_stats: true,
        include_low_stock: true,
        include_recent_activity: true,
      });

      if (error) {
        // Fallback to parallel queries if RPC fails
        console.warn("RPC failed, using parallel queries:", error);

        const [
          productsResult,
          lowStockResult,
          salesTodayResult,
          recentSalesResult,
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id, stock, price", { count: "exact" })
            .eq("is_archived", false),
          supabase
            .from("products")
            .select("id, name, stock")
            .eq("is_archived", false)
            .lte("stock", 10),
          supabase
            .from("sales")
            .select("total, created_at")
            .gte("created_at", new Date().toISOString().split("T")[0]),
          supabase
            .from("sales")
            .select("id, total, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        // Handle errors gracefully
        if (productsResult.error) throw productsResult.error;

        return {
          totalProducts: productsResult.count || 0,
          lowStockProducts: lowStockResult.data || [],
          todaySales:
            salesTodayResult.data?.reduce((sum, sale) => sum + sale.total, 0) ||
            0,
          recentSales: recentSalesResult.data || [],
          lastUpdated: new Date().toISOString(),
        };
      }

      return data[0];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });
}
