import { useState, useEffect, useCallback } from "react";
import {
  generateInventoryReport,
  generateSalesReport,
  generateFinancialReport,
  generateLowStockReport,
  generateProductPerformanceReport,
  generateDashboardReport,
} from "../services/reportService.js";

/**
 * Custom hook for report generation and management
 * Provides centralized report state and operations
 */
export function useReports() {
  const [reports, setReports] = useState({
    inventory: null,
    sales: null,
    financial: null,
    lowStock: null,
    productPerformance: null,
    dashboard: null,
  });

  const [loading, setLoading] = useState({
    inventory: false,
    sales: false,
    financial: false,
    lowStock: false,
    productPerformance: false,
    dashboard: false,
  });

  const [errors, setErrors] = useState({
    inventory: null,
    sales: null,
    financial: null,
    lowStock: null,
    productPerformance: null,
    dashboard: null,
  });

  /**
   * Generate inventory report
   */
  const generateInventory = useCallback(async (options = {}) => {
    setLoading(prev => ({ ...prev, inventory: true }));
    setErrors(prev => ({ ...prev, inventory: null }));

    try {
      const reportData = await generateInventoryReport(options);
      setReports(prev => ({ ...prev, inventory: reportData }));
      return reportData;
    } catch (error) {
      console.error("Error generating inventory report:", error);
      setErrors(prev => ({ ...prev, inventory: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  }, []);

  /**
   * Generate sales report
   */
  const generateSales = useCallback(async (options = {}) => {
    setLoading(prev => ({ ...prev, sales: true }));
    setErrors(prev => ({ ...prev, sales: null }));

    try {
      const reportData = await generateSalesReport(options);
      setReports(prev => ({ ...prev, sales: reportData }));
      return reportData;
    } catch (error) {
      console.error("Error generating sales report:", error);
      setErrors(prev => ({ ...prev, sales: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, sales: false }));
    }
  }, []);

  /**
   * Generate financial report
   */
  const generateFinancial = useCallback(async (options = {}) => {
    setLoading(prev => ({ ...prev, financial: true }));
    setErrors(prev => ({ ...prev, financial: null }));

    try {
      const reportData = await generateFinancialReport(options);
      setReports(prev => ({ ...prev, financial: reportData }));
      return reportData;
    } catch (error) {
      console.error("Error generating financial report:", error);
      setErrors(prev => ({ ...prev, financial: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, financial: false }));
    }
  }, []);

  /**
   * Generate low stock report
   */
  const generateLowStock = useCallback(async (options = {}) => {
    setLoading(prev => ({ ...prev, lowStock: true }));
    setErrors(prev => ({ ...prev, lowStock: null }));

    try {
      const reportData = await generateLowStockReport(options);
      setReports(prev => ({ ...prev, lowStock: reportData }));
      return reportData;
    } catch (error) {
      console.error("Error generating low stock report:", error);
      setErrors(prev => ({ ...prev, lowStock: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, lowStock: false }));
    }
  }, []);

  /**
   * Generate product performance report
   */
  const generateProductPerformance = useCallback(async (options = {}) => {
    setLoading(prev => ({ ...prev, productPerformance: true }));
    setErrors(prev => ({ ...prev, productPerformance: null }));

    try {
      const reportData = await generateProductPerformanceReport(options);
      setReports(prev => ({ ...prev, productPerformance: reportData }));
      return reportData;
    } catch (error) {
      console.error("Error generating product performance report:", error);
      setErrors(prev => ({ ...prev, productPerformance: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, productPerformance: false }));
    }
  }, []);

  /**
   * Generate dashboard report
   */
  const generateDashboard = useCallback(async () => {
    setLoading(prev => ({ ...prev, dashboard: true }));
    setErrors(prev => ({ ...prev, dashboard: null }));

    try {
      const reportData = await generateDashboardReport();
      setReports(prev => ({ ...prev, dashboard: reportData }));
      return reportData;
    } catch (error) {
      console.error("Error generating dashboard report:", error);
      setErrors(prev => ({ ...prev, dashboard: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  }, []);

  /**
   * Clear a specific report
   */
  const clearReport = useCallback((reportType) => {
    setReports(prev => ({ ...prev, [reportType]: null }));
    setErrors(prev => ({ ...prev, [reportType]: null }));
  }, []);

  /**
   * Clear all reports
   */
  const clearAllReports = useCallback(() => {
    setReports({
      inventory: null,
      sales: null,
      financial: null,
      lowStock: null,
      productPerformance: null,
      dashboard: null,
    });
    setErrors({
      inventory: null,
      sales: null,
      financial: null,
      lowStock: null,
      productPerformance: null,
      dashboard: null,
    });
  }, []);

  /**
   * Check if any report is currently loading
   */
  const isAnyLoading = Object.values(loading).some(isLoading => isLoading);

  /**
   * Get reports that have data
   */
  const availableReports = Object.entries(reports)
    .filter(([, data]) => data !== null)
    .map(([type]) => type);

  /**
   * Auto-generate dashboard report on mount
   */
  useEffect(() => {
    generateDashboard().catch(console.error);
  }, [generateDashboard]);

  return {
    // Report data
    reports,
    
    // Loading states
    loading,
    isAnyLoading,
    
    // Error states
    errors,
    
    // Generation functions
    generateInventory,
    generateSales,
    generateFinancial,
    generateLowStock,
    generateProductPerformance,
    generateDashboard,
    
    // Utility functions
    clearReport,
    clearAllReports,
    availableReports,
  };
}

/**
 * Hook for quick report status checking
 */
export function useReportStatus() {
  const [lastGenerated, setLastGenerated] = useState({});
  const [reportCounts, setReportCounts] = useState({
    total: 0,
    today: 0,
    week: 0,
  });

  const updateReportGenerated = useCallback((reportType) => {
    setLastGenerated(prev => ({
      ...prev,
      [reportType]: new Date().toISOString(),
    }));
    setReportCounts(prev => ({
      ...prev,
      total: prev.total + 1,
      today: prev.today + 1,
    }));
  }, []);

  const getLastGenerated = useCallback((reportType) => {
    return lastGenerated[reportType] || null;
  }, [lastGenerated]);

  const isReportFresh = useCallback((reportType, maxAgeMinutes = 30) => {
    const lastGen = lastGenerated[reportType];
    if (!lastGen) return false;
    
    const ageMinutes = (new Date() - new Date(lastGen)) / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }, [lastGenerated]);

  return {
    lastGenerated,
    reportCounts,
    updateReportGenerated,
    getLastGenerated,
    isReportFresh,
  };
}
