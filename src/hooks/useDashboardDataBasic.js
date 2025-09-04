import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "../config/supabase.js";
import { normalizeProductData, isLowStock, getEffectiveStock, isExpiringSoon, getExpiryStatus } from "../services/stockService.js";
import { STOCK_THRESHOLDS } from "../utils/constants.js";

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

        // 2. Get all products to check stock status with centralized logic
        const { data: allProducts, error: allProductsError } = await supabase
          .from("products")
          .select("*")
          .eq("is_archived", false);

        if (allProductsError) throw allProductsError;

        // Use centralized stock service to identify low stock products
        const normalizedProducts = (allProducts || []).map(normalizeProductData);
        const lowStockData = normalizedProducts.filter(product => 
          isLowStock(product, STOCK_THRESHOLDS.LOW)
        );


        // 3. Filter expiring products using centralized expiry logic
        const expiringData = normalizedProducts
          .filter(product => isExpiringSoon(product, 30))
          .map(product => ({
            ...product,
            expiryStatus: getExpiryStatus(product)
          }))
          .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
        
        console.log(`🔍 Found ${expiringData.length} products expiring within 30 days`);
        console.log('Sample expiring products:', expiringData.slice(0, 3).map(p => ({ name: p.name, expiry_date: p.expiry_date, status: p.expiryStatus?.text })));

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
              lowStockData?.filter((p) => getEffectiveStock(p) <= STOCK_THRESHOLDS.CRITICAL)?.length || 0,
            expiringSoonCount: expiringData?.length || 0,
            lowStockProducts: lowStockData || [],
            criticalStockItems:
              lowStockData?.filter((p) => getEffectiveStock(p) <= STOCK_THRESHOLDS.CRITICAL) || [],
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
