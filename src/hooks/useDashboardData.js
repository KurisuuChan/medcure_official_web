import { useState, useEffect, useMemo } from "react";
import { format, isAfter, differenceInDays } from "date-fns";
import {
  getInventorySummary,
  getProducts,
} from "../services/productService.js";
import {
  getSalesSummary,
  getSalesTransactions,
  getHourlySales,
  getTopSellingProducts,
} from "../services/salesService.js";

/**
 * Hook for fetching and managing dashboard data from the backend
 */
export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return format(date, "MMM d");
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch inventory data
      const [inventoryResult, productsResult] = await Promise.all([
        getInventorySummary(),
        getProducts(),
      ]);

      if (inventoryResult.error) throw new Error(inventoryResult.error);
      if (productsResult.error) throw new Error(productsResult.error);

      setInventorySummary(inventoryResult.data);
      setProducts(productsResult.data || []);

      // Fetch sales data
      const [salesResult, transactionsResult, hourlyResult, topProductsResult] =
        await Promise.all([
          getSalesSummary("today"),
          getSalesTransactions({ limit: 5 }),
          getHourlySales(),
          getTopSellingProducts(5, "week"),
        ]);

      if (salesResult.error) throw new Error(salesResult.error);
      if (transactionsResult.error) throw new Error(transactionsResult.error);
      if (hourlyResult.error) throw new Error(hourlyResult.error);
      if (topProductsResult.error) throw new Error(topProductsResult.error);

      setTodaySales(salesResult.data);
      setRecentTransactions(transactionsResult.data || []);
      setHourlySales(hourlyResult.data || []);
      setTopProducts(topProductsResult.data || []);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate derived data
  const lowStockItems = useMemo(() => {
    return products
      .filter(
        (product) =>
          product.total_stock <= product.critical_level &&
          product.total_stock > 0
      )
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        quantity: product.total_stock,
        critical: product.critical_level,
      }));
  }, [products]);

  const expiringSoon = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return products
      .filter(
        (product) =>
          product.expiry_date &&
          isAfter(new Date(product.expiry_date), today) &&
          !isAfter(new Date(product.expiry_date), thirtyDaysFromNow)
      )
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        days: differenceInDays(new Date(product.expiry_date), today),
        expiryDate: product.expiry_date,
      }))
      .sort((a, b) => a.days - b.days);
  }, [products]);

  const salesByHourData = useMemo(() => {
    if (!hourlySales.length) {
      // Return empty data if no sales data
      return Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        sales: 0,
      }));
    }
    return hourlySales;
  }, [hourlySales]);

  // Calculate sales by category from products and recent transactions
  const salesByCategory = useMemo(() => {
    if (!recentTransactions.length) return [];

    const categoryTotals = {};

    recentTransactions.forEach((transaction) => {
      transaction.sales_items?.forEach((item) => {
        const category = item.products?.category || "Other";
        categoryTotals[category] =
          (categoryTotals[category] || 0) + item.line_total;
      });
    });

    return Object.entries(categoryTotals)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [recentTransactions]);

  const bestSellers = useMemo(() => {
    if (!topProducts || topProducts.length === 0) {
      return [];
    }
    
    return topProducts
      .filter(item => item && item.product && item.product.name) // Safety filter
      .map((item) => ({
        name: item.product.name,
        quantity: item.totalQuantity,
        revenue: item.totalRevenue,
      }));
  }, [topProducts]);

  const recentSales = useMemo(() => {
    return recentTransactions.slice(0, 4).map((transaction) => ({
      id: transaction.id,
      product: transaction.sales_items?.[0]?.products?.name || "Multiple items",
      qty:
        transaction.sales_items?.reduce(
          (sum, item) => sum + item.total_pieces,
          0
        ) || 0,
      price: transaction.total_amount,
      time: formatRelativeTime(transaction.created_at),
    }));
  }, [recentTransactions]);

  const summaryCards = useMemo(() => {
    const totalSales = todaySales?.totalSales || 0;
    const avgSales =
      hourlySales.length > 0
        ? hourlySales.reduce((sum, item) => sum + item.sales, 0) /
          hourlySales.filter((item) => item.sales > 0).length
        : 0;

    return [
      {
        title: "Total Products",
        value: inventorySummary?.totalProducts || 0,
        iconBg: "bg-blue-50 text-blue-600",
      },
      {
        title: "Low Stock",
        value: lowStockItems.length,
        iconBg: "bg-amber-50 text-amber-600",
      },
      {
        title: "Expiring Soon",
        value: expiringSoon.length,
        iconBg: "bg-red-50 text-red-600",
      },
      {
        title: "Today Sales",
        value: "₱" + totalSales.toLocaleString(),
        iconBg: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Avg / Hour",
        value: "₱" + Math.round(avgSales || 0).toLocaleString(),
        iconBg: "bg-indigo-50 text-indigo-600",
      },
      {
        title: "Best Seller Qty",
        value: bestSellers[0]?.quantity || 0,
        iconBg: "bg-fuchsia-50 text-fuchsia-600",
      },
    ];
  }, [
    inventorySummary,
    lowStockItems.length,
    expiringSoon.length,
    todaySales,
    hourlySales,
    bestSellers,
  ]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    loading,
    error,
    summaryCards,
    salesByHourData,
    salesByCategory,
    bestSellers,
    expiringSoon,
    lowStockItems,
    recentSales,
    refresh: fetchDashboardData,
  };
}

export default useDashboardData;
