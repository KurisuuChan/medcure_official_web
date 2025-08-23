import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateInventoryReport,
  generateSalesReport,
  generateDashboardReport,
} from "../services/reportService.js";

/**
 * Optimized Reports Hook with intelligent caching and batch processing
 */
export function useOptimizedReports() {
  const queryClient = useQueryClient();

  // Cache report data with smart invalidation
  const dashboardReport = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: generateDashboardReport,
    staleTime: 5 * 60 * 1000, // 5 minutes - reports don't need real-time updates
    cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: 1, // Reduce retry attempts for better UX
  });

  // Conditional report generation - only fetch when needed
  const inventoryReport = useQuery({
    queryKey: ["reports", "inventory"],
    queryFn: generateInventoryReport,
    enabled: false, // Only fetch when explicitly requested
    staleTime: 10 * 60 * 1000, // Inventory changes less frequently
  });

  // Prefetch related data to reduce waterfall requests
  const prefetchSalesReport = async (dateRange) => {
    await queryClient.prefetchQuery({
      queryKey: ["reports", "sales", dateRange],
      queryFn: () => generateSalesReport(dateRange),
      staleTime: 2 * 60 * 1000,
    });
  };

  // Intelligent cache invalidation based on data changes
  const invalidateReports = (changedDataType) => {
    const invalidationMap = {
      product: ["inventory", "dashboard"],
      sale: ["sales", "dashboard", "financial"],
      stock: ["inventory", "dashboard"],
    };

    invalidationMap[changedDataType]?.forEach((reportType) => {
      queryClient.invalidateQueries({ queryKey: ["reports", reportType] });
    });
  };

  return {
    dashboardReport,
    inventoryReport,
    prefetchSalesReport,
    invalidateReports,
    // Expose loading states efficiently
    isAnyReportLoading: dashboardReport.isLoading || inventoryReport.isLoading,
  };
}
