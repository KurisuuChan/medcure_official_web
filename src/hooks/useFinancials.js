import { useState, useEffect, useCallback } from "react";
import {
  getFinancialDashboard,
  getRevenueSummary,
  getCostAnalysis,
  getTopSellingProducts,
  getMonthlyTrends,
  getPaymentMethodBreakdown,
  getCategoryPerformance,
} from "@/services/financialService";

/**
 * Custom hook for managing financial data and state
 */
export const useFinancials = (initialPeriod = "month") => {
  // State management
  const [data, setData] = useState({
    revenueSummary: null,
    costAnalysis: null,
    topProducts: [],
    monthlyTrends: [],
    paymentBreakdown: null,
    categoryPerformance: [],
    lastUpdated: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load comprehensive dashboard data
  const loadDashboardData = useCallback(
    async (period = selectedPeriod, showLoading = true) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        const dashboardData = await getFinancialDashboard(period);
        setData(dashboardData);
      } catch (err) {
        console.error("Error loading financial dashboard:", err);
        setError(err.message || "Failed to load financial data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPeriod]
  );

  // Load specific data sections
  const loadRevenueSummary = useCallback(
    async (period = selectedPeriod) => {
      try {
        const revenueSummary = await getRevenueSummary(period);
        setData((prev) => ({ ...prev, revenueSummary }));
        return revenueSummary;
      } catch (err) {
        console.error("Error loading revenue summary:", err);
        throw err;
      }
    },
    [selectedPeriod]
  );

  const loadCostAnalysis = useCallback(
    async (period = selectedPeriod) => {
      try {
        const costAnalysis = await getCostAnalysis(period);
        setData((prev) => ({ ...prev, costAnalysis }));
        return costAnalysis;
      } catch (err) {
        console.error("Error loading cost analysis:", err);
        throw err;
      }
    },
    [selectedPeriod]
  );

  const loadTopProducts = useCallback(
    async (limit = 10, period = selectedPeriod) => {
      try {
        const topProducts = await getTopSellingProducts(limit, period);
        setData((prev) => ({ ...prev, topProducts }));
        return topProducts;
      } catch (err) {
        console.error("Error loading top products:", err);
        throw err;
      }
    },
    [selectedPeriod]
  );

  const loadMonthlyTrends = useCallback(async (months = 6) => {
    try {
      const monthlyTrends = await getMonthlyTrends(months);
      setData((prev) => ({ ...prev, monthlyTrends }));
      return monthlyTrends;
    } catch (err) {
      console.error("Error loading monthly trends:", err);
      throw err;
    }
  }, []);

  const loadPaymentBreakdown = useCallback(
    async (period = selectedPeriod) => {
      try {
        const paymentBreakdown = await getPaymentMethodBreakdown(period);
        setData((prev) => ({ ...prev, paymentBreakdown }));
        return paymentBreakdown;
      } catch (err) {
        console.error("Error loading payment breakdown:", err);
        throw err;
      }
    },
    [selectedPeriod]
  );

  const loadCategoryPerformance = useCallback(
    async (period = selectedPeriod) => {
      try {
        const categoryPerformance = await getCategoryPerformance(period);
        setData((prev) => ({ ...prev, categoryPerformance }));
        return categoryPerformance;
      } catch (err) {
        console.error("Error loading category performance:", err);
        throw err;
      }
    },
    [selectedPeriod]
  );

  // Refresh all data
  const refresh = useCallback(() => {
    loadDashboardData(selectedPeriod, false);
  }, [loadDashboardData, selectedPeriod]);

  // Change period and reload data
  const changePeriod = useCallback(
    (newPeriod) => {
      setSelectedPeriod(newPeriod);
      loadDashboardData(newPeriod);
    },
    [loadDashboardData]
  );

  // Load data on mount and period change
  useEffect(() => {
    loadDashboardData(selectedPeriod);
  }, [loadDashboardData, selectedPeriod]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refresh();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refresh, isLoading]);

  // Computed values
  const computedMetrics = {
    // Revenue growth calculation (comparing current vs previous period)
    revenueGrowth: (() => {
      if (!data.monthlyTrends || data.monthlyTrends.length < 2) return null;
      const current =
        data.monthlyTrends[data.monthlyTrends.length - 1]?.revenue || 0;
      const previous =
        data.monthlyTrends[data.monthlyTrends.length - 2]?.revenue || 0;
      if (previous === 0) return null;
      return ((current - previous) / previous) * 100;
    })(),

    // Profit growth calculation
    profitGrowth: (() => {
      if (!data.monthlyTrends || data.monthlyTrends.length < 2) return null;
      const current =
        data.monthlyTrends[data.monthlyTrends.length - 1]?.profit || 0;
      const previous =
        data.monthlyTrends[data.monthlyTrends.length - 2]?.profit || 0;
      if (previous === 0) return null;
      return ((current - previous) / previous) * 100;
    })(),

    // Top category by revenue
    topCategory: data.categoryPerformance?.[0]?.category || null,

    // Best performing product
    bestProduct: data.topProducts?.[0]?.name || null,

    // Most used payment method
    topPaymentMethod:
      data.paymentBreakdown?.breakdown?.sort((a, b) => b.amount - a.amount)?.[0]
        ?.method || null,
  };

  return {
    // Data
    data,
    isLoading,
    error,
    selectedPeriod,
    isRefreshing,
    computedMetrics,

    // Actions
    refresh,
    changePeriod,
    loadRevenueSummary,
    loadCostAnalysis,
    loadTopProducts,
    loadMonthlyTrends,
    loadPaymentBreakdown,
    loadCategoryPerformance,

    // Helper functions
    formatCurrency: (amount) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
      }).format(amount);
    },

    formatPercentage: (value, decimals = 1) => {
      if (value == null) return "N/A";
      return `${value.toFixed(decimals)}%`;
    },

    formatNumber: (value) => {
      return new Intl.NumberFormat("en-PH").format(value);
    },
  };
};

export default useFinancials;
