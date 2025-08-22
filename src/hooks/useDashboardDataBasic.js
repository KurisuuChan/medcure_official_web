import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "../config/supabase.js";

/**
 * Simplified Dashboard Data Hook - Uses direct Supabase queries
 * This avoids complex functions that might be failing
 */
export function useDashboardDataBasic() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  return useQuery({
    queryKey: ["dashboard-basic", today],
    queryFn: async () => {
      try {
        // 1. Get total products count
        const { count: totalProducts, error: productsError } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_archived", false);

        if (productsError) throw productsError;

        // 2. Get low stock products (stock <= 10)
        const { data: lowStockData, error: lowStockError } = await supabase
          .from("products")
          .select("id, name, stock")
          .eq("is_archived", false)
          .lte("stock", 10)
          .order("stock", { ascending: true });

        if (lowStockError) throw lowStockError;

        // 3. Get expiring products (within 30 days)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const { data: expiringData, error: expiringError } = await supabase
          .from("products")
          .select("id, name, expiration_date")
          .eq("is_archived", false)
          .not("expiration_date", "is", null)
          .lte("expiration_date", futureDate.toISOString())
          .order("expiration_date", { ascending: true });

        if (expiringError) throw expiringError;

        // 4. Get today's sales total
        const todayStart = new Date(today + "T00:00:00Z").toISOString();
        const todayEnd = new Date(today + "T23:59:59Z").toISOString();

        const { data: todaySales, error: salesError } = await supabase
          .from("sales")
          .select("total")
          .gte("created_at", todayStart)
          .lte("created_at", todayEnd);

        if (salesError) throw salesError;

        // Calculate today's revenue
        const todayRevenue =
          todaySales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;

        // 5. Get recent sales (last 10)
        const { data: recentSales, error: recentError } = await supabase
          .from("sales")
          .select(
            `
            id,
            total,
            payment_method,
            created_at,
            sale_items (
              quantity,
              unit_price,
              products (name)
            )
          `
          )
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentError) throw recentError;

        // Prepare summary cards
        const summaryCards = [
          {
            title: "Total Products",
            value: totalProducts || 0,
            trend: "Active inventory items",
          },
          {
            title: "Low Stock",
            value: lowStockData?.length || 0,
            trend: "Needs attention",
          },
          {
            title: "Expiring Soon",
            value: expiringData?.length || 0,
            trend: "Check expiry dates",
          },
          {
            title: "Today Sales",
            value: "₱" + (todayRevenue || 0).toLocaleString(),
            trend: "vs last period",
          },
        ];

        return {
          loading: false,
          error: null,
          summaryCards,
          salesByHourData: [], // Empty for now
          salesByCategory: [], // Empty for now
          bestSellers: [], // Empty for now
          expiringSoon: expiringData || [],
          lowStockItems: lowStockData || [],
          recentSales: recentSales || [],
          sales: {
            today: {
              totalRevenue: todayRevenue,
              totalTransactions: todaySales?.length || 0,
              averageTransaction: todaySales?.length
                ? todayRevenue / todaySales.length
                : 0,
            },
            week: {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
            month: {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
          },
          inventory: {
            totalProducts: totalProducts || 0,
            lowStockCount: lowStockData?.length || 0,
            criticalStockCount:
              lowStockData?.filter((p) => p.stock === 0)?.length || 0,
            expiringSoonCount: expiringData?.length || 0,
            lowStockProducts: lowStockData || [],
            criticalStockItems:
              lowStockData?.filter((p) => p.stock === 0) || [],
            expiringSoon: expiringData || [],
          },
          analytics: {
            salesByCategory: [],
            salesByHour: [],
            bestSellers: [],
          },
        };
      } catch (error) {
        return {
          loading: false,
          error: error.message,
          summaryCards: [
            {
              title: "Total Products",
              value: "Error",
              trend: "Unable to load",
            },
            { title: "Low Stock", value: "Error", trend: "Unable to load" },
            { title: "Expiring Soon", value: "Error", trend: "Unable to load" },
            { title: "Today Sales", value: "Error", trend: "Unable to load" },
          ],
          salesByHourData: [],
          salesByCategory: [],
          bestSellers: [],
          expiringSoon: [],
          lowStockItems: [],
          recentSales: [],
          sales: {
            today: {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
            week: {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
            month: {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
          },
          inventory: {
            totalProducts: 0,
            lowStockCount: 0,
            criticalStockCount: 0,
            expiringSoonCount: 0,
            lowStockProducts: [],
            criticalStockItems: [],
            expiringSoon: [],
          },
          analytics: {
            salesByCategory: [],
            salesByHour: [],
            bestSellers: [],
          },
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 2,
    retryDelay: 1000,
  });
}

export default useDashboardDataBasic;
