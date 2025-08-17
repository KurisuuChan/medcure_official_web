/**
 * MedCure Financials Hook
 * React hook for managing financial data and operations
 */

import { useState, useEffect, useCallback } from "react";
import {
  getFinancialOverview,
  getMonthlyFinancialTrends,
  getTopPerformingProducts,
  getCostBreakdown,
  exportFinancialReport,
} from "../services/financialService";
import { useNotification } from "./useNotification";

export function useFinancials(initialPeriod = "month") {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(initialPeriod);
  const [overview, setOverview] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { showNotification } = useNotification();

  // Fetch financial overview
  const fetchOverview = useCallback(
    async (selectedPeriod = period) => {
      try {
        setError(null);
        const result = await getFinancialOverview(selectedPeriod);

        if (result.error) {
          throw new Error(result.error);
        }

        setOverview(result.data);
        return result.data;
      } catch (err) {
        console.error("❌ Financial overview fetch error:", err);
        setError(err.message);
        showNotification(
          `Failed to load financial overview: ${err.message}`,
          "error"
        );
        return null;
      }
    },
    [period, showNotification]
  );

  // Fetch monthly trends
  const fetchMonthlyTrends = useCallback(
    async (months = 12) => {
      try {
        setError(null);
        const result = await getMonthlyFinancialTrends(months);

        if (result.error) {
          throw new Error(result.error);
        }

        setMonthlyTrends(result.data || []);
        return result.data;
      } catch (err) {
        console.error("❌ Monthly trends fetch error:", err);
        setError(err.message);
        showNotification(
          `Failed to load monthly trends: ${err.message}`,
          "error"
        );
        return [];
      }
    },
    [showNotification]
  );

  // Fetch top products
  const fetchTopProducts = useCallback(
    async (limit = 10, selectedPeriod = period) => {
      try {
        setError(null);
        const result = await getTopPerformingProducts(limit, selectedPeriod);

        if (result.error) {
          throw new Error(result.error);
        }

        setTopProducts(result.data || []);
        return result.data;
      } catch (err) {
        console.error("❌ Top products fetch error:", err);
        setError(err.message);
        showNotification(
          `Failed to load top products: ${err.message}`,
          "error"
        );
        return [];
      }
    },
    [period, showNotification]
  );

  // Fetch cost breakdown
  const fetchCostBreakdown = useCallback(
    async (selectedPeriod = period) => {
      try {
        setError(null);
        const result = await getCostBreakdown(selectedPeriod);

        if (result.error) {
          throw new Error(result.error);
        }

        setCostBreakdown(result.data);
        return result.data;
      } catch (err) {
        console.error("❌ Cost breakdown fetch error:", err);
        setError(err.message);
        showNotification(
          `Failed to load cost breakdown: ${err.message}`,
          "error"
        );
        return null;
      }
    },
    [period, showNotification]
  );

  // Refresh all financial data
  const refreshAll = useCallback(
    async (selectedPeriod = period) => {
      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Refreshing all financial data...");

        await Promise.all([
          fetchOverview(selectedPeriod),
          fetchMonthlyTrends(12),
          fetchTopProducts(10, selectedPeriod),
          fetchCostBreakdown(selectedPeriod),
        ]);

        setLastRefresh(new Date());
        showNotification("Financial data refreshed successfully", "success");
      } catch (err) {
        console.error("❌ Refresh all error:", err);
        setError(err.message);
        showNotification(
          `Failed to refresh financial data: ${err.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      period,
      fetchOverview,
      fetchMonthlyTrends,
      fetchTopProducts,
      fetchCostBreakdown,
      showNotification,
    ]
  );

  // Change period and refresh data
  const changePeriod = useCallback(
    async (newPeriod) => {
      if (newPeriod === period) return;

      console.log(
        `📊 Changing financial period from ${period} to ${newPeriod}`
      );
      setPeriod(newPeriod);

      setLoading(true);
      await Promise.all([
        fetchOverview(newPeriod),
        fetchTopProducts(10, newPeriod),
        fetchCostBreakdown(newPeriod),
      ]);
      setLoading(false);
    },
    [period, fetchOverview, fetchTopProducts, fetchCostBreakdown]
  );

  // Export financial report
  const exportReport = useCallback(
    async (exportPeriod = period) => {
      try {
        setLoading(true);
        console.log("📊 Exporting financial report...");

        const result = await exportFinancialReport(exportPeriod);

        if (result.error) {
          throw new Error(result.error);
        }

        // Create downloadable file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `financial-report-${exportPeriod}-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification("Financial report exported successfully", "success");
        return result.data;
      } catch (err) {
        console.error("❌ Export report error:", err);
        showNotification(`Failed to export report: ${err.message}`, "error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [period, showNotification]
  );

  // Calculate derived metrics
  const metrics = {
    // Growth calculations
    monthlyGrowth:
      monthlyTrends.length >= 2
        ? ((monthlyTrends[monthlyTrends.length - 1]?.revenue -
            monthlyTrends[monthlyTrends.length - 2]?.revenue) /
            monthlyTrends[monthlyTrends.length - 2]?.revenue) *
          100
        : 0,

    // Profitability
    profitMargin: overview?.profit?.margin || 0,

    // Top product revenue
    topProductRevenue: topProducts.length > 0 ? topProducts[0]?.revenue : 0,

    // Cost efficiency
    costEfficiency: costBreakdown
      ? costBreakdown.breakdown.find((b) => b.category === "Product Costs")
          ?.percentage || 0
      : 0,
  };

  // Format currency helper
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }, []);

  // Initialize data on mount
  useEffect(() => {
    refreshAll(period);
  }, []); // Only run once on mount

  return {
    // Data
    loading,
    error,
    period,
    overview,
    monthlyTrends,
    topProducts,
    costBreakdown,
    metrics,
    lastRefresh,

    // Actions
    refreshAll,
    changePeriod,
    exportReport,
    fetchOverview,
    fetchMonthlyTrends,
    fetchTopProducts,
    fetchCostBreakdown,

    // Utilities
    formatCurrency,

    // Computed properties
    isLoaded: !!overview && !!monthlyTrends.length,
    hasData: !!overview || !!monthlyTrends.length || !!topProducts.length,
  };
}

export default useFinancials;
