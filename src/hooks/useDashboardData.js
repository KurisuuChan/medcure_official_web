import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getSalesSummary,
  getSalesByCategory,
  getSalesByHour,
} from "../services/salesService.js";
import { getLowStockProducts } from "../services/productService.js";

/**
 * Hook for fetching all dashboard data
 * Combines multiple data sources for the dashboard view
 */
export function useDashboardData() {
  // Get today's date for hourly sales
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  return useQuery({
    queryKey: ["dashboard", today],
    queryFn: async () => {
      try {
        // Fetch all dashboard data in parallel
        const [
          todaySummary,
          weekSummary,
          monthSummary,
          salesByCategory,
          lowStockProducts,
          salesByHour,
        ] = await Promise.all([
          getSalesSummary("today"),
          getSalesSummary("week"),
          getSalesSummary("month"),
          getSalesByCategory(),
          getLowStockProducts(10),
          getSalesByHour(today),
        ]);

        // Calculate additional metrics
        const criticalStockItems = lowStockProducts.filter((p) => p.stock <= 5);
        const expiringSoon = []; // TODO: Add expiration date logic when product schema is updated

        // Format data for dashboard cards with safe fallbacks
        const summaryCards = [
          {
            title: "Today's Revenue",
            value: "₱" + (todaySummary?.totalRevenue || 0).toLocaleString(),
            iconBg: "bg-emerald-50 text-emerald-600",
          },
          {
            title: "Today's Sales",
            value: todaySummary?.totalTransactions || 0,
            iconBg: "bg-blue-50 text-blue-600",
          },
          {
            title: "Low Stock",
            value: lowStockProducts?.length || 0,
            iconBg: "bg-amber-50 text-amber-600",
          },
          {
            title: "Critical Stock",
            value: criticalStockItems?.length || 0,
            iconBg: "bg-red-50 text-red-600",
          },
          {
            title: "Week Revenue",
            value: "₱" + (weekSummary?.totalRevenue || 0).toLocaleString(),
            iconBg: "bg-indigo-50 text-indigo-600",
          },
          {
            title: "Avg Transaction",
            value: "₱" + (todaySummary?.averageTransaction || 0).toFixed(2),
            iconBg: "bg-fuchsia-50 text-fuchsia-600",
          },
        ];

        return {
          loading: false,
          error: null,
          summaryCards,
          salesByHourData: salesByHour || [],
          salesByCategory: salesByCategory || [],
          bestSellers: [], // TODO: Calculate from sales data
          expiringSoon: expiringSoon || [],
          lowStockItems: lowStockProducts || [],
          recentSales: [], // TODO: Get recent sales from sales service
          sales: {
            today: todaySummary || {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
            week: weekSummary || {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
            month: monthSummary || {
              totalRevenue: 0,
              totalTransactions: 0,
              averageTransaction: 0,
            },
          },
          inventory: {
            lowStockCount: lowStockProducts?.length || 0,
            criticalStockCount: criticalStockItems?.length || 0,
            lowStockProducts: lowStockProducts || [],
            criticalStockItems: criticalStockItems || [],
          },
          analytics: {
            salesByCategory: salesByCategory || [],
            salesByHour: salesByHour || [],
          },
        };
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw new Error("Failed to load dashboard data");
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export default useDashboardData;
