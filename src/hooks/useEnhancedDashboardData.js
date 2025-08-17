import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  getDashboardAnalytics,
  getDashboardStats,
} from "../services/dashboardService.js";

/**
 * Enhanced Dashboard Hook with Accurate Backend Integration
 * Provides real-time, accurate dashboard data from the backend
 */
export function useEnhancedDashboardData() {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Core data states
  const [analytics, setAnalytics] = useState(null);
  const [quickStats, setQuickStats] = useState(null);

  // Refresh control
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Fetch quick stats for immediate display
   */
  const fetchQuickStats = useCallback(async () => {
    try {
      const result = await getDashboardStats();

      if (result.success) {
        setQuickStats(result.data);
        setError(null);
        return result.data;
      } else {
        throw new Error(result.error || "Failed to fetch quick stats");
      }
    } catch (err) {
      console.error("Error fetching quick stats:", err);
      setError(err.message);

      // Return fallback data on error
      return {
        totalProducts: 0,
        lowStockCount: 0,
        expiringCount: 0,
        todayRevenue: 0,
        todayTransactions: 0,
      };
    }
  }, []);

  /**
   * Fetch comprehensive analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    try {
      const result = await getDashboardAnalytics();

      if (result.success) {
        setAnalytics(result.data);
        setLastUpdated(new Date());
        setError(null);
        return result.data;
      } else {
        throw new Error(result.error || "Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message);

      // Keep existing analytics data on error, don't clear it
      return analytics;
    }
  }, [analytics]);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // Load quick stats first for immediate feedback
        const stats = await fetchQuickStats();

        // Then load comprehensive analytics
        const analyticsData = await fetchAnalytics();

        return { stats, analytics: analyticsData };
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchQuickStats, fetchAnalytics]
  );

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboardData(false);
    setIsRefreshing(false);
  }, [loadDashboardData]);

  /**
   * Auto-refresh every 5 minutes
   */
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refresh]);

  // Initial load
  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Computed summary cards with real data
  const summaryCards = useMemo(() => {
    if (!quickStats && !analytics) {
      return [
        {
          title: "Total Products",
          value: "Loading...",
          iconBg: "bg-blue-50 text-blue-600",
        },
        {
          title: "Low Stock",
          value: "Loading...",
          iconBg: "bg-amber-50 text-amber-600",
        },
        {
          title: "Expiring Soon",
          value: "Loading...",
          iconBg: "bg-red-50 text-red-600",
        },
        {
          title: "Today Sales",
          value: "Loading...",
          iconBg: "bg-emerald-50 text-emerald-600",
        },
      ];
    }

    const stats = quickStats || {};
    const salesData = analytics?.sales?.today || {};

    return [
      {
        title: "Total Products",
        value: stats.totalProducts || 0,
        iconBg: "bg-blue-50 text-blue-600",
        trend: analytics?.inventory
          ? `₱${(
              analytics.inventory.totalRetailValue || 0
            ).toLocaleString()} value`
          : null,
      },
      {
        title: "Low Stock",
        value: stats.lowStockCount || 0,
        iconBg: "bg-amber-50 text-amber-600",
        trend: stats.lowStockCount > 0 ? "Needs attention" : "All good",
      },
      {
        title: "Expiring Soon",
        value: stats.expiringCount || 0,
        iconBg: "bg-red-50 text-red-600",
        trend: stats.expiringCount > 0 ? "Check expiry dates" : "No issues",
      },
      {
        title: "Today Sales",
        value: `₱${(stats.todayRevenue || 0).toLocaleString()}`,
        iconBg: "bg-emerald-50 text-emerald-600",
        trend: `${stats.todayTransactions || 0} transactions`,
      },
      {
        title: "Avg / Transaction",
        value:
          stats.todayTransactions > 0
            ? `₱${Math.round(
                (stats.todayRevenue || 0) / stats.todayTransactions
              ).toLocaleString()}`
            : "₱0",
        iconBg: "bg-indigo-50 text-indigo-600",
        trend: salesData.averageTransactionValue
          ? "Based on completed sales"
          : "No sales today",
      },
      {
        title: "Items Sold",
        value: salesData.totalItemsSold || 0,
        iconBg: "bg-purple-50 text-purple-600",
        trend: salesData.averageItemsPerTransaction
          ? `${Math.round(
              salesData.averageItemsPerTransaction || 0
            )} avg/transaction`
          : "No data",
      },
    ];
  }, [quickStats, analytics]);

  // Computed hourly sales data
  const salesByHourData = useMemo(() => {
    if (!analytics?.sales?.hourly) {
      // Return empty data structure while loading
      return Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        sales: 0,
        revenue: 0,
        transactions: 0,
      }));
    }

    return analytics.sales.hourly;
  }, [analytics]);

  // Computed recent sales with accurate data
  const recentSales = useMemo(() => {
    if (!analytics?.transactions) {
      return [];
    }

    return analytics.transactions.slice(0, 6).map((transaction) => ({
      id: transaction.id,
      product: transaction.mainProduct,
      qty: transaction.totalPieces,
      price: transaction.totalAmount,
      time: transaction.formattedTime,
      transactionNumber: transaction.transactionNumber,
      paymentMethod: transaction.paymentMethod,
    }));
  }, [analytics]);

  // Computed sales by category
  const salesByCategory = useMemo(() => {
    if (!analytics?.sales?.byCategory) {
      return [];
    }

    return analytics.sales.byCategory.map((category) => ({
      category: category.category,
      value: category.revenue,
      quantity: category.quantity,
      transactions: category.transactions,
    }));
  }, [analytics]);

  // Computed best sellers
  const bestSellers = useMemo(() => {
    if (!analytics?.products?.topSelling) {
      return [];
    }

    return analytics.products.topSelling.map((product) => ({
      name: product.name,
      quantity: product.totalQuantity,
      revenue: product.totalRevenue,
      category: product.category,
      transactionCount: product.transactionCount,
    }));
  }, [analytics]);

  // Computed low stock items
  const lowStockItems = useMemo(() => {
    if (!analytics?.products?.lowStock) {
      return [];
    }

    return analytics.products.lowStock.slice(0, 10).map((product) => ({
      name: product.name,
      quantity: product.currentStock,
      critical: product.criticalLevel,
      category: product.category,
      urgency: product.urgency,
      status: product.status,
    }));
  }, [analytics]);

  // Computed expiring items
  const expiringSoon = useMemo(() => {
    if (!analytics?.products?.expiring) {
      return [];
    }

    return analytics.products.expiring.slice(0, 10).map((product) => ({
      name: product.name,
      days: product.daysUntilExpiry,
      expiryDate: product.expiryDate,
      stock: product.totalStock,
      potentialLoss: product.potentialLoss,
      urgency: product.urgency,
      category: product.category,
    }));
  }, [analytics]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const todayData = analytics?.sales?.today;
    const weekData = analytics?.sales?.week;
    const monthData = analytics?.sales?.month;

    if (!todayData || !weekData || !monthData) {
      return {
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        todayGrowth: 0,
        weekGrowth: 0,
        conversionRate: 0,
      };
    }

    return {
      todayRevenue: todayData.totalRevenue || 0,
      weekRevenue: weekData.totalRevenue || 0,
      monthRevenue: monthData.totalRevenue || 0,
      todayTransactions: todayData.totalTransactions || 0,
      weekTransactions: weekData.totalTransactions || 0,
      monthTransactions: monthData.totalTransactions || 0,
      averageOrderValue: todayData.averageTransactionValue || 0,
      itemsPerTransaction: todayData.averageItemsPerTransaction || 0,
    };
  }, [analytics]);

  // Data status
  const dataStatus = useMemo(() => {
    return {
      hasData: !!(quickStats || analytics),
      isComplete: !!(quickStats && analytics),
      lastUpdated: lastUpdated ? format(lastUpdated, "HH:mm:ss") : null,
      isStale: lastUpdated
        ? Date.now() - lastUpdated.getTime() > 10 * 60 * 1000
        : false, // 10 minutes
    };
  }, [quickStats, analytics, lastUpdated]);

  return {
    // Core data
    summaryCards,
    salesByHourData,
    salesByCategory,
    bestSellers,
    lowStockItems,
    expiringSoon,
    recentSales,
    performanceMetrics,

    // Raw data
    analytics,
    quickStats,

    // State
    loading,
    error,
    isRefreshing,
    dataStatus,

    // Actions
    refresh,
    loadDashboardData,
  };
}

export default useEnhancedDashboardData;
