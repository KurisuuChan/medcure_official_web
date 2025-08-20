import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getSalesSummary,
  getSalesByCategory,
  getSalesByHour,
  getRecentSales,
  getBestSellers,
} from "../services/salesService.js";
import {
  getLowStockProducts,
  getProductCount,
  getExpiringSoonProducts,
} from "../services/productService.js";

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
          recentSales,
          bestSellers,
          totalProducts,
          expiringSoon,
        ] = await Promise.all([
          getSalesSummary("today"),
          getSalesSummary("week"),
          getSalesSummary("month"),
          getSalesByCategory(),
          getLowStockProducts(10),
          getSalesByHour(today),
          getRecentSales(10),
          getBestSellers(5),
          getProductCount(),
          getExpiringSoonProducts(30), // 30 days
        ]);

        // Calculate additional metrics
        const criticalStockItems = lowStockProducts.filter((p) => p.stock <= 5);

        // Format data for dashboard cards with safe fallbacks
        const summaryCards = [
          {
            title: "Total Products",
            value: totalProducts || 0,
            trend: "Active inventory items",
          },
          {
            title: "Low Stock",
            value: lowStockProducts?.length || 0,
            trend: "Needs attention",
          },
          {
            title: "Expiring Soon",
            value: expiringSoon?.length || 0,
            trend: "Check expiry dates",
          },
          {
            title: "Today Sales",
            value: "₱" + (todaySummary?.totalRevenue || 0).toLocaleString(),
            trend: "vs last period",
          },
        ];

        return {
          loading: false,
          error: null,
          summaryCards,
          salesByHourData: salesByHour || [],
          salesByCategory: salesByCategory || [],
          bestSellers: bestSellers || [],
          expiringSoon: expiringSoon || [],
          lowStockItems: lowStockProducts || [],
          recentSales: recentSales || [],
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
            totalProducts: totalProducts || 0,
            lowStockCount: lowStockProducts?.length || 0,
            criticalStockCount: criticalStockItems?.length || 0,
            expiringSoonCount: expiringSoon?.length || 0,
            lowStockProducts: lowStockProducts || [],
            criticalStockItems: criticalStockItems || [],
            expiringSoon: expiringSoon || [],
          },
          analytics: {
            salesByCategory: salesByCategory || [],
            salesByHour: salesByHour || [],
            bestSellers: bestSellers || [],
          },
        };
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        // Return fallback data structure to prevent crashes
        return {
          loading: false,
          error: error.message,
          summaryCards: [
            { title: "Total Products", value: 0, trend: "No data" },
            { title: "Low Stock", value: 0, trend: "No data" },
            { title: "Expiring Soon", value: 0, trend: "No data" },
            { title: "Today Sales", value: "₱0", trend: "No data" },
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
    retry: 3,
    retryDelay: 1000,
  });
}

export default useDashboardData;
